import json
import random
import asyncio
import time
from uuid import uuid4
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status
from ojitos369_postgres_db.postgres_db import ConexionPostgreSQL
from core.conf.settings import ce, prod_mode, db_data
from core.websockets.manager import ConnectionManager

# ─── In-memory game state ───────────────────────────────────────────────────
# game_states[codigo] = {
#   sala_id, creador_id, estado, jugadores: {user_id: {...}},
#   turno_actual, turno_numero, seleccion: {...},
#   pregunta_actual, historial, ganador,
#   ws_connections: {user_id: WebSocket}
# }
game_states: dict = {}


def get_conexion():
    c = ConexionPostgreSQL(db_data, ce=ce, send_error=prod_mode, parameter_indicator=":")
    c.raise_error = True
    return c


def _new_state(sala_id: str, creador_id: str, visibilidad: str = 'publica') -> dict:
    return {
        'sala_id': sala_id,
        'creador_id': creador_id,
        'estado': 'esperando',
        'visibilidad': visibilidad,
        'jugadores': {},
        'espectadores': {},          # {user_id: {username, victorias}}
        'desconectados': set(),      # user_ids de jugadores desconectados temporalmente
        'turno_actual': None,  # This will be the "Guesser" (jugador_pregunta)
        'jugador_objetivo': None,
        'turno_numero': 0,
        'n_offset': 1,
        'tiempo_turno': 60,          # seconds per turn, 0 = no limit
        'turno_inicio': None,        # timestamp when current turn started
        'turn_timer_task': None,     # asyncio task for auto-advance
        'seleccion': {
            'modo': 'host',
            'tarjetas_disponibles': [],
            'tarjetas_seleccionadas': [],
            'votos': {},
            'votacion_abierta': False,
        },
        'pregunta_actual': None,
        'historial': [],
        'ganador': None,
        'ws_connections': {},
        'cleanup_task': None,
    }


def _get_tarjeta_data(tarjeta_id: str) -> dict:
    c = get_conexion()
    try:
        result = c.consulta_asociativa(
            "SELECT id, nombre, descripcion, imagen FROM adivina_tarjetas WHERE id = :id",
            {'id': tarjeta_id}
        )
        rows = result.to_dict(orient='records') if hasattr(result, 'to_dict') else []
        if not rows:
            return {}
        t = rows[0]
        if t.get('imagen'):
            t['imagen_url'] = f"/media/images/adivina/{t['id']}/{t['imagen']}"
        else:
            t['imagen_url'] = None
        return t
    finally:
        try:
            c.close()
        except Exception:
            pass


def _get_tarjetas_data(tarjeta_ids: list) -> list:
    if not tarjeta_ids:
        return []
    c = get_conexion()
    try:
        placeholders = ', '.join([f':id_{i}' for i in range(len(tarjeta_ids))])
        params = {f'id_{i}': tid for i, tid in enumerate(tarjeta_ids)}
        result = c.consulta_asociativa(
            f"SELECT id, nombre, descripcion, imagen FROM adivina_tarjetas WHERE id IN ({placeholders})",
            params
        )
        rows = result.to_dict(orient='records') if hasattr(result, 'to_dict') else []
        for t in rows:
            if t.get('imagen'):
                t['imagen_url'] = f"/media/images/adivina/{t['id']}/{t['imagen']}"
            else:
                t['imagen_url'] = None
        return rows
    finally:
        try:
            c.close()
        except Exception:
            pass


def _disqualify_player(state: dict, uid: str) -> None:
    """Move a player from jugadores to espectadores (disqualified)."""
    player = state['jugadores'].get(uid)
    if not player:
        return
    player['eliminado'] = True
    # Move to espectadores keeping username & victorias
    state['espectadores'][uid] = {
        'username': player['username'],
        'victorias': player.get('victorias', 0),
    }
    state['desconectados'].discard(uid)


def _advance_turn(state: dict) -> None:
    # Get all active players sorted by their initial order
    active = sorted(
        [uid for uid, p in state['jugadores'].items() if not p.get('eliminado')],
        key=lambda uid: state['jugadores'][uid].get('orden', 0)
    )
    if len(active) < 2:
        return

    # Find the current target (Player 1)
    current_target = state.get('jugador_objetivo')
    
    if current_target not in active:
        # If target left or was eliminated, reset to first active player
        state['jugador_objetivo'] = active[0]
        idx_target = 0
    else:
        # Move to next target
        idx_target = (active.index(current_target) + 1) % len(active)
        state['jugador_objetivo'] = active[idx_target]
        
        # If we cycled back to the start (or whatever player started the round)
        # For simplicity, we increment N whenever we complete a full cycle of targets
        if idx_target == 0:
            state['n_offset'] = (state.get('n_offset', 1) % (len(active) - 1)) + 1

    # Ensure n_offset is strictly less than len(active) and at least 1
    # This prevents a player from asking themselves if the number of active players decreased
    current_n_offset = state.get('n_offset', 1)
    if current_n_offset >= len(active):
        current_n_offset = 1
        state['n_offset'] = current_n_offset

    # Find the guesser (Player 2) based on N offset
    idx_guesser = (idx_target + current_n_offset) % len(active)
    state['turno_actual'] = active[idx_guesser]
    
    state['turno_numero'] += 1
    state['pregunta_actual'] = None

    # --- Auto-disqualify disconnected players when it's their turn ---
    desconectados = state.get('desconectados', set())
    target_uid = state['jugador_objetivo']
    guesser_uid = state['turno_actual']
    disqualified_any = False

    if target_uid in desconectados:
        _disqualify_player(state, target_uid)
        disqualified_any = True
    if guesser_uid in desconectados:
        _disqualify_player(state, guesser_uid)
        disqualified_any = True

    if disqualified_any:
        # Re-check active players after disqualification
        active_after = [uid for uid, p in state['jugadores'].items() if not p.get('eliminado')]
        if len(active_after) >= 2:
            # Recurse to find a valid turn
            _advance_turn(state)
        # If < 2, _check_win will be called by the caller


def _check_win(state: dict) -> str | None:
    """Check win condition: only 1 player active AND connected."""
    desconectados = state.get('desconectados', set())
    active = [uid for uid, p in state['jugadores'].items() if not p.get('eliminado')]
    # Filter out disconnected from active
    active_connected = [uid for uid in active if uid not in desconectados]
    
    if len(active_connected) == 1:
        return active_connected[0]
    if len(active_connected) == 0:
        # Fallback: if everyone disconnected, last active wins
        if active:
            return active[-1]
        ids = list(state['jugadores'].keys())
        return ids[-1] if ids else None
    return None


def _public_state(state: dict, for_user_id: str) -> dict:
    jugadores_public = {}
    current_target_id = state.get('jugador_objetivo')
    desconectados = state.get('desconectados', set())

    for uid, p in state['jugadores'].items():
        entry = {
            'user_id': uid,
            'username': p['username'],
            'eliminado': p.get('eliminado', False),
            'desconectado': uid in desconectados,
            'orden': p.get('orden', 0),
            'victorias': p.get('victorias', 0),
        }
        if uid == for_user_id:
            entry['tarjeta'] = p.get('tarjeta')
            entry['tarjeta_id'] = p.get('tarjeta_id')
            # discards is now a dict: { target_id: [tarjeta_ids] }
            entry['discards'] = p.get('discards', {})
        else:
            entry['tarjeta'] = None
            entry['tarjeta_id'] = None
        jugadores_public[uid] = entry

    # Build espectadores list
    espectadores_public = {}
    for uid, e in state.get('espectadores', {}).items():
        espectadores_public[uid] = {
            'user_id': uid,
            'username': e['username'],
            'victorias': e.get('victorias', 0),
        }

    # Determine if for_user_id is a spectator
    es_espectador = for_user_id in state.get('espectadores', {})

    return {
        'sala_id': state['sala_id'],
        'creador_id': state['creador_id'],
        'estado': state['estado'],
        'visibilidad': state.get('visibilidad', 'publica'),
        'jugadores': jugadores_public,
        'espectadores': espectadores_public,
        'es_espectador': es_espectador,
        'turno_actual': state['turno_actual'], # Guesser
        'jugador_objetivo': state['jugador_objetivo'], # Target
        'turno_numero': state['turno_numero'],
        'n_offset': state.get('n_offset', 1),
        'tiempo_turno': state.get('tiempo_turno', 60),
        'turno_inicio': state.get('turno_inicio'),
        'seleccion': {
            'modo': state['seleccion']['modo'],
            'tarjetas_disponibles': state['seleccion']['tarjetas_disponibles'],
            'tarjetas_seleccionadas': state['seleccion']['tarjetas_seleccionadas'],
            'votacion_abierta': state['seleccion']['votacion_abierta'],
            'votos_count': {
                tid: len(voters)
                for tid, voters in _count_votos(state).items()
            },
        },
        'pregunta_actual': state['pregunta_actual'],
        'historial': state['historial'][-30:],
        'ganador': state['ganador'],
        'mi_user_id': for_user_id,
    }


def _count_votos(state: dict) -> dict:
    counts: dict = {}
    for uid, tarjeta_ids in state['seleccion']['votos'].items():
        for tid in tarjeta_ids:
            counts[tid] = counts.get(tid, [])
            counts[tid].append(uid)
    return counts


class AdivinaSocketApi:
    def __init__(self, websocket: WebSocket, manager: ConnectionManager, codigo: str, **kwargs):
        self.websocket = websocket
        self.manager = manager
        self.codigo = codigo.upper()
        self.data = kwargs
        self.usuario_id = None
        self.username = None

    def validate_session(self):
        token = self.websocket.query_params.get("clientId", None)
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sin autorización")

        c = get_conexion()
        try:
            result = c.consulta_asociativa(
                """SELECT u.id, u.username FROM sessiones s
                   JOIN usuarios u ON u.id = s.usuario_id
                   WHERE s.token = :token ORDER BY s.created_at DESC LIMIT 1""",
                {'token': token}
            )
            rows = result.to_dict(orient='records') if hasattr(result, 'to_dict') else []
            if not rows:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
            self.usuario_id = rows[0]['id']
            self.username = rows[0]['username']
        finally:
            try:
                c.close()
            except Exception:
                pass

    def _get_or_create_state(self):
        if self.codigo not in game_states:
            c = get_conexion()
            try:
                result = c.consulta_asociativa(
                    "SELECT id, creador_id, estado FROM adivina_salas WHERE codigo = :codigo",
                    {'codigo': self.codigo}
                )
                rows = result.to_dict(orient='records') if hasattr(result, 'to_dict') else []
                if not rows:
                    return None
                sala = rows[0]
                game_states[self.codigo] = _new_state(sala['id'], sala['creador_id'], sala.get('visibilidad', 'publica'))
            finally:
                try:
                    c.close()
                except Exception:
                    pass
        return game_states.get(self.codigo)

    async def handle_connection(self):
        self.validate_session()
        state = self._get_or_create_state()
        if state is None:
            await self.websocket.accept()
            await self.websocket.send_text(json.dumps({"type": "error", "message": "Sala no encontrada"}))
            await self.websocket.close()
            return

        await self.manager.connect(self.websocket, self.codigo)
        state['ws_connections'][self.usuario_id] = self.websocket
        await self.on_connect(state)

        try:
            while True:
                raw = await self.websocket.receive_text()
                await self.on_receive(raw, state)
        except (WebSocketDisconnect, RuntimeError):
            pass
        finally:
            self.manager.disconnect(self.websocket, self.codigo)
            state['ws_connections'].pop(self.usuario_id, None)
            await self.on_disconnect(state)

    async def on_connect(self, state: dict):
        if state.get('cleanup_task'):
            state['cleanup_task'].cancel()
            state['cleanup_task'] = None

        game_active = state['estado'] in ('jugando', 'votando')

        # Si la sala está vacía, el que entra se vuelve el creador/admin
        if not state['jugadores'] and not state.get('espectadores', {}):
            state['creador_id'] = self.usuario_id
            c = get_conexion()
            try:
                c.ejecutar(
                    "UPDATE adivina_salas SET creador_id = :creador_id WHERE id = :id",
                    {'creador_id': self.usuario_id, 'id': state['sala_id']}
                )
                c.commit()
            except Exception:
                pass
            finally:
                try:
                    c.close()
                except Exception:
                    pass

        # --- Reconnection: player already in jugadores ---
        if self.usuario_id in state['jugadores']:
            state['desconectados'].discard(self.usuario_id)
            await self._broadcast_to_all(state, {
                "type": "player_joined",
                "user_id": self.usuario_id,
                "username": self.username,
            })
            await self._broadcast_state_to_all(state)
            return

        # --- Was spectator, reconnecting ---
        if self.usuario_id in state.get('espectadores', {}):
            if not game_active:
                # Promote back to player if game is not active
                spec = state['espectadores'].pop(self.usuario_id)
                state['jugadores'][self.usuario_id] = {
                    'username': self.username,
                    'eliminado': False,
                    'tarjeta_id': None,
                    'tarjeta': None,
                    'orden': len(state['jugadores']),
                    'victorias': spec.get('victorias', 0),
                    'discards': {},
                }
            await self._broadcast_to_all(state, {
                "type": "player_joined",
                "user_id": self.usuario_id,
                "username": self.username,
            })
            await self._broadcast_state_to_all(state)
            return

        # --- Completely new user ---
        # Load victorias from DB
        victorias = 0
        c = get_conexion()
        try:
            result = c.consulta_asociativa(
                "SELECT victorias FROM adivina_salas_jugadores WHERE sala_id = :sala_id AND usuario_id = :usuario_id",
                {'sala_id': state['sala_id'], 'usuario_id': self.usuario_id}
            )
            rows = result.to_dict(orient='records') if hasattr(result, 'to_dict') else []
            if rows:
                victorias = rows[0].get('victorias', 0)
            else:
                c.ejecutar(
                    "INSERT INTO adivina_salas_jugadores (sala_id, usuario_id) VALUES (:sala_id, :usuario_id) ON CONFLICT DO NOTHING",
                    {'sala_id': state['sala_id'], 'usuario_id': self.usuario_id}
                )
                c.commit()
        except Exception:
            pass
        finally:
            try:
                c.close()
            except Exception:
                pass

        if game_active:
            # Game in progress → join as spectator
            state['espectadores'][self.usuario_id] = {
                'username': self.username,
                'victorias': victorias,
            }
            await self._broadcast_to_all(state, {
                "type": "spectator_joined",
                "user_id": self.usuario_id,
                "username": self.username,
            })
        else:
            # Waiting/Finished → join as player
            state['jugadores'][self.usuario_id] = {
                'username': self.username,
                'eliminado': False,
                'tarjeta_id': None,
                'tarjeta': None,
                'orden': len(state['jugadores']),
                'victorias': victorias,
                'discards': {},
            }
            await self._broadcast_to_all(state, {
                "type": "player_joined",
                "user_id": self.usuario_id,
                "username": self.username,
            })

        await self._broadcast_state_to_all(state)

    async def on_disconnect(self, state: dict):
        is_spectator = self.usuario_id in state.get('espectadores', {})
        is_player = self.usuario_id in state['jugadores']
        game_active = state['estado'] in ('jugando', 'votando')

        if is_spectator:
            # Spectators are simply removed
            state['espectadores'].pop(self.usuario_id, None)
            await self._broadcast_to_all(state, {
                "type": "spectator_left",
                "user_id": self.usuario_id,
                "username": self.username,
            })
            # Check if room is totally empty (no jugadores AND no espectadores)
            if not state['jugadores'] and not state.get('espectadores', {}):
                await self._start_cleanup_timer(state)
            return

        if is_player:
            if game_active:
                # During active game: DON'T remove from jugadores, just mark as disconnected
                state['desconectados'].add(self.usuario_id)
                await self._broadcast_to_all(state, {
                    "type": "player_disconnected",
                    "user_id": self.usuario_id,
                    "username": self.username,
                })
                
                # Si es el turno de alguien y se desconecta, se toma como turno finalizado
                if state.get('turno_actual') == self.usuario_id or state.get('jugador_objetivo') == self.usuario_id:
                    _advance_turn(state)
                    self._start_turn_timer(state)
            else:
                # During esperando/terminado: remove player fully
                state['jugadores'].pop(self.usuario_id, None)
                await self._broadcast_to_all(state, {
                    "type": "player_left",
                    "user_id": self.usuario_id,
                    "username": self.username,
                })

        # Check if room is totally empty
        has_anyone = bool(state['jugadores']) or bool(state.get('espectadores', {}))
        if not has_anyone:
            await self._start_cleanup_timer(state)
            return

        # Ensure we have a connected host
        self._ensure_host_connected(state)

        # Check for win condition due to disconnection
        if game_active:
            ganador = _check_win(state)
            if ganador:
                await self._handle_win(state, ganador)
                return

        await self._broadcast_state_to_all(state)

    async def _start_cleanup_timer(self, state: dict):
        """Start the 1-minute delayed cleanup for empty rooms."""
        async def _delayed_cleanup(codigo, sala_id):
            try:
                await asyncio.sleep(60)
                if codigo in game_states:
                    gs = game_states[codigo]
                    if not gs['jugadores'] and not gs.get('espectadores', {}):
                        game_states.pop(codigo, None)
                        c = get_conexion()
                        try:
                            c.ejecutar("DELETE FROM adivina_salas_jugadores WHERE sala_id = :sala_id", {'sala_id': sala_id})
                            c.ejecutar("DELETE FROM adivina_salas WHERE id = :id", {'id': sala_id})
                            c.commit()
                        except Exception:
                            pass
                        finally:
                            try:
                                c.close()
                            except Exception:
                                pass
            except asyncio.CancelledError:
                pass

        state['cleanup_task'] = asyncio.create_task(_delayed_cleanup(self.codigo, state['sala_id']))

    async def on_receive(self, raw: str, state: dict):
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            return

        msg_type = msg.get('type', '')

        handlers = {
            'chat': self._handle_chat,
            'voice_signal': self._handle_voice_signal,
            'voice_toggle': self._handle_voice_toggle,
            'set_tarjetas': self._handle_set_tarjetas,
            'set_tiempo_turno': self._handle_set_tiempo_turno,
            'start_game': self._handle_start_game,
            'pregunta': self._handle_pregunta,
            'respuesta': self._handle_respuesta,
            'adivinar': self._handle_adivinar,
            'advance_turn': self._handle_advance_turn,
            'kick_player': self._handle_kick_player,
            'restart_game': self._handle_restart_game,
            'toggle_discard': self._handle_toggle_discard,
        }

        handler = handlers.get(msg_type)
        if handler:
            try:
                await handler(msg, state)
            except Exception as e:
                await self._send_to_user(self.usuario_id, state, {"type": "error", "message": str(e)})

    # ── Helpers ────────────────────────────────────────────────────────────

    async def _broadcast_to_all(self, state: dict, payload: dict):
        text = json.dumps(payload)
        for uid, ws in list(state['ws_connections'].items()):
            try:
                await ws.send_text(text)
            except Exception:
                pass

    async def _send_to_user(self, user_id: str, state: dict, payload: dict):
        ws = state['ws_connections'].get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                pass

    async def _send_state_to_user(self, state: dict, user_id: str):
        await self._send_to_user(user_id, state, {
            "type": "state",
            "state": _public_state(state, user_id)
        })

    async def _broadcast_state_to_all(self, state: dict):
        for uid in list(state['ws_connections'].keys()):
            await self._send_state_to_user(state, uid)

    def _is_host(self, state: dict) -> bool:
        return self.usuario_id == state['creador_id']

    def _is_spectator(self, state: dict) -> bool:
        return self.usuario_id in state.get('espectadores', {})

    def _cancel_turn_timer(self, state: dict):
        """Cancel the current turn timer if any."""
        task = state.get('turn_timer_task')
        if task and not task.done():
            task.cancel()
        state['turn_timer_task'] = None

    def _start_turn_timer(self, state: dict):
        """Start an async timer for the current turn. Auto-advances when expired."""
        self._cancel_turn_timer(state)
        tiempo = state.get('tiempo_turno', 60)
        if tiempo <= 0:
            # 0 = no limit
            state['turno_inicio'] = time.time()
            return

        state['turno_inicio'] = time.time()
        codigo = self.codigo

        async def _turn_timeout():
            try:
                await asyncio.sleep(tiempo)
                s = game_states.get(codigo)
                if s and s['estado'] == 'jugando':
                    _advance_turn(s)
                    # Check win after auto-advance (disqualifications may have occurred)
                    ganador = _check_win(s)
                    if ganador:
                        await self._handle_win(s, ganador)
                    else:
                        self._start_turn_timer(s)
                        await self._broadcast_state_to_all(s)
            except asyncio.CancelledError:
                pass

        state['turn_timer_task'] = asyncio.create_task(_turn_timeout())

    async def _handle_win(self, state: dict, ganador: str):
        """Centralized win handling: set state, broadcast, save, transfer host."""
        state['ganador'] = ganador
        state['estado'] = 'terminado'
        self._cancel_turn_timer(state)
        state['turno_inicio'] = None

        ganador_player = state['jugadores'].get(ganador)
        if ganador_player:
            ganador_player['victorias'] = ganador_player.get('victorias', 0) + 1

        ganador_username = ganador_player.get('username', '') if ganador_player else ''
        await self._broadcast_to_all(state, {
            "type": "game_over",
            "ganador": ganador,
            "ganador_username": ganador_username,
            "jugadores": {
                uid: {
                    'username': p['username'],
                    'tarjeta': p.get('tarjeta'),
                }
                for uid, p in state['jugadores'].items()
            }
        })
        await self._save_partida(state, ganador)
        self._ensure_host_connected(state)
        await self._broadcast_state_to_all(state)

    def _ensure_host_connected(self, state: dict):
        """Transfer host to a connected player if current host is disconnected."""
        creador_id = state['creador_id']
        ws_connections = state.get('ws_connections', {})

        # Host is connected — nothing to do
        if creador_id in ws_connections:
            return

        # Find a connected player (prefer non-spectators first)
        for uid in state['jugadores']:
            if uid in ws_connections and not state['jugadores'][uid].get('eliminado'):
                state['creador_id'] = uid
                self._update_host_db(state, uid)
                return

        # Fallback: any connected spectator
        for uid in state.get('espectadores', {}):
            if uid in ws_connections:
                state['creador_id'] = uid
                self._update_host_db(state, uid)
                return

    def _update_host_db(self, state: dict, new_host_id: str):
        """Update creador_id in database."""
        c = get_conexion()
        try:
            c.ejecutar(
                "UPDATE adivina_salas SET creador_id = :creador_id WHERE id = :id",
                {'creador_id': new_host_id, 'id': state['sala_id']}
            )
            c.commit()
        except Exception:
            pass
        finally:
            try:
                c.close()
            except Exception:
                pass

    # ── Message handlers ───────────────────────────────────────────────────

    async def _handle_chat(self, msg: dict, state: dict):
        await self._broadcast_to_all(state, {
            "type": "chat",
            "from": self.usuario_id,
            "from_name": self.username,
            "message": msg.get('message', ''),
        })

    async def _handle_voice_signal(self, msg: dict, state: dict):
        to = msg.get('to')
        if not to:
            return
        await self._send_to_user(to, state, {
            "type": "voice_signal",
            "from": self.usuario_id,
            "signal": msg.get('signal'),
        })

    async def _handle_voice_toggle(self, msg: dict, state: dict):
        await self._broadcast_to_all(state, {
            "type": "voice_state",
            "user_id": self.usuario_id,
            "enabled": bool(msg.get('enabled', False)),
        })

    async def _handle_set_tarjetas(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if not self._is_host(state):
            return
        if state['estado'] != 'esperando':
            return
        tarjeta_ids = msg.get('tarjeta_ids', [])
        tarjetas = _get_tarjetas_data(tarjeta_ids)
        state['seleccion']['tarjetas_seleccionadas'] = tarjeta_ids
        state['seleccion']['tarjetas_disponibles'] = tarjetas
        await self._broadcast_state_to_all(state)

    async def _handle_set_tiempo_turno(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if not self._is_host(state):
            return
        if state['estado'] != 'esperando':
            return
        tiempo = msg.get('tiempo', 60)
        if not isinstance(tiempo, (int, float)):
            return
        tiempo = max(0, int(tiempo))  # 0 = sin límite
        state['tiempo_turno'] = tiempo
        await self._broadcast_state_to_all(state)

    async def _handle_start_game(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if not self._is_host(state):
            return

        active_players = [uid for uid, p in state['jugadores'].items() if not p.get('eliminado')]
        if len(active_players) < 2:
            await self._send_to_user(self.usuario_id, state, {
                "type": "error", "message": "Se necesitan al menos 2 jugadores"
            })
            return

        selected_ids = state['seleccion']['tarjetas_seleccionadas']
        if len(selected_ids) < 2:
            await self._send_to_user(self.usuario_id, state, {
                "type": "error", "message": "Se necesitan al menos 2 tarjetas para jugar"
            })
            return

        tarjetas = _get_tarjetas_data(selected_ids)
        tarjetas_map = {t['id']: t for t in tarjetas}

        random.shuffle(active_players)
        random.shuffle(selected_ids)

        for i, uid in enumerate(active_players):
            # Assignment is now random and can be the same for multiple players
            assigned_id = random.choice(selected_ids)
            state['jugadores'][uid]['tarjeta_id'] = assigned_id
            state['jugadores'][uid]['tarjeta'] = tarjetas_map.get(assigned_id, {})
            state['jugadores'][uid]['orden'] = i
            state['jugadores'][uid]['eliminado'] = False
            state['jugadores'][uid]['discards'] = {}

        state['estado'] = 'jugando'
        state['n_offset'] = 1
        state['jugador_objetivo'] = active_players[0]
        # Initial guesser is index 1 (or 0 if only 1 player, but we check >=2)
        state['turno_actual'] = active_players[1] if len(active_players) > 1 else active_players[0]
        
        state['turno_numero'] = 0
        state['pregunta_actual'] = None
        state['historial'] = []
        state['ganador'] = None

        c = get_conexion()
        try:
            c.ejecutar(
                "UPDATE adivina_salas SET estado = 'jugando', started_at = CURRENT_TIMESTAMP WHERE id = :id",
                {'id': state['sala_id']}
            )
            c.commit()
        except Exception:
            pass
        finally:
            try:
                c.close()
            except Exception:
                pass

        await self._broadcast_to_all(state, {"type": "game_started"})
        self._start_turn_timer(state)
        await self._broadcast_state_to_all(state)

    async def _handle_pregunta(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if state['estado'] != 'jugando':
            return
        if state['turno_actual'] != self.usuario_id:
            return

        target_id = msg.get('target_id', '')
        texto = msg.get('texto', '').strip()
        if not target_id or not texto:
            return

        if state.get('pregunta_actual'):
            # Ya hay una pregunta en curso en este turno
            return

        pregunta = {
            'id': str(uuid4()),
            'de': self.usuario_id,
            'de_nombre': self.username,
            'para': target_id,
            'para_nombre': state['jugadores'].get(target_id, {}).get('username', ''),
            'texto': texto,
            'respuesta': 'pendiente',
        }
        state['pregunta_actual'] = pregunta
        state['historial'].append(dict(pregunta))

        await self._broadcast_to_all(state, {
            "type": "pregunta",
            **pregunta,
        })
        await self._broadcast_state_to_all(state)

    async def _handle_respuesta(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if state['estado'] != 'jugando':
            return
        if not state['pregunta_actual']:
            return
        if state['pregunta_actual']['para'] != self.usuario_id:
            return

        respuesta = msg.get('respuesta', '')
        if respuesta not in ['si', 'no', 'quizas']:
            return

        state['pregunta_actual']['respuesta'] = respuesta
        
        # Update history as well
        for h in reversed(state['historial']):
            if h.get('id') == state['pregunta_actual']['id']:
                h['respuesta'] = respuesta
                break

        await self._broadcast_to_all(state, {
            "type": "respuesta",
            "respuesta": respuesta,
            "de": self.usuario_id,
            "de_nombre": self.username,
        })
        
        await self._broadcast_state_to_all(state)

    async def _handle_adivinar(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if state['estado'] != 'jugando':
            return
        if state['turno_actual'] != self.usuario_id:
            return

        if state.get('pregunta_actual'):
            # No se puede adivinar si ya se hizo una pregunta en este turno
            return

        target_id = msg.get('target_id', '')
        personaje_nombre = msg.get('personaje_nombre', '').strip()
        if not target_id or not personaje_nombre:
            return

        target = state['jugadores'].get(target_id)
        if not target or target.get('eliminado'):
            return

        correct = (
            target.get('tarjeta', {}).get('nombre', '').strip().lower() ==
            personaje_nombre.lower()
        )

        event = {
            "type": "guess_result",
            "from": self.usuario_id,
            "from_name": self.username,
            "target_id": target_id,
            "target_name": target['username'],
            "personaje_nombre": personaje_nombre,
            "correct": correct,
        }

        if correct:
            target['eliminado'] = True
            event['revealed_tarjeta'] = target.get('tarjeta')
            state['historial'].append({
                'id': str(uuid4()),
                'tipo': 'adivino',
                'de': self.usuario_id,
                'de_nombre': self.username,
                'para': target_id,
                'para_nombre': target['username'],
                'personaje': personaje_nombre,
                'correcto': True,
            })

            ganador = _check_win(state)
            await self._broadcast_to_all(state, event)
            if ganador:
                await self._handle_win(state, ganador)
                return
        else:
            state['historial'].append({
                'id': str(uuid4()),
                'tipo': 'adivino',
                'de': self.usuario_id,
                'de_nombre': self.username,
                'para': target_id,
                'para_nombre': target['username'],
                'personaje': personaje_nombre,
                'correcto': False,
            })
            # Automatic discard on fail for this specific target for EVERYONE
            failed_tarjeta_id = None
            for t in state.get('seleccion', {}).get('tarjetas_disponibles', []):
                if t.get('nombre', '').lower() == personaje_nombre.lower():
                    failed_tarjeta_id = t.get('id')
                    break
                    
            if failed_tarjeta_id:
                for uid, p in state['jugadores'].items():
                    if 'discards' not in p or not isinstance(p['discards'], dict):
                        p['discards'] = {}
                    if target_id not in p['discards']:
                        p['discards'][target_id] = []
                    if failed_tarjeta_id not in p['discards'][target_id]:
                        p['discards'][target_id].append(failed_tarjeta_id)

        await self._broadcast_to_all(state, event)
        _advance_turn(state)
        state['pregunta_actual'] = None
        ganador = _check_win(state)
        if ganador:
            await self._handle_win(state, ganador)
        else:
            self._start_turn_timer(state)
            await self._broadcast_state_to_all(state)

    async def _handle_advance_turn(self, msg: dict, state: dict):
        if self._is_spectator(state):
            return
        if not self._is_host(state) and state['turno_actual'] != self.usuario_id:
            return
        if state['estado'] != 'jugando':
            return
        _advance_turn(state)
        ganador = _check_win(state)
        if ganador:
            await self._handle_win(state, ganador)
        else:
            self._start_turn_timer(state)
            await self._broadcast_state_to_all(state)

    async def _handle_kick_player(self, msg: dict, state: dict):
        if not self._is_host(state):
            return
        if state['estado'] != 'esperando':
            return
        kick_id = msg.get('user_id', '')
        if not kick_id or kick_id == self.usuario_id:
            return
        state['jugadores'].pop(kick_id, None)
        ws = state['ws_connections'].get(kick_id)
        if ws:
            try:
                await ws.send_text(json.dumps({"type": "kicked"}))
                await ws.close()
            except Exception:
                pass
        await self._broadcast_to_all(state, {"type": "player_kicked", "user_id": kick_id})
        await self._broadcast_state_to_all(state)

    async def _handle_restart_game(self, msg: dict, state: dict):
        if not self._is_host(state):
            return
        
        state['estado'] = 'esperando'
        state['turno_actual'] = None
        state['jugador_objetivo'] = None
        state['turno_numero'] = 0
        state['n_offset'] = 1
        state['pregunta_actual'] = None
        state['historial'] = []
        state['ganador'] = None

        # Remove disconnected players that never came back
        for uid in list(state.get('desconectados', set())):
            state['jugadores'].pop(uid, None)
        state['desconectados'] = set()

        # Reset remaining players
        for uid, p in list(state['jugadores'].items()):
            p['eliminado'] = False
            p['tarjeta_id'] = None
            p['tarjeta'] = None
            p['discards'] = {}

        # Promote spectators to players
        for uid, spec in list(state.get('espectadores', {}).items()):
            if uid not in state['jugadores']:
                state['jugadores'][uid] = {
                    'username': spec['username'],
                    'eliminado': False,
                    'tarjeta_id': None,
                    'tarjeta': None,
                    'orden': len(state['jugadores']),
                    'victorias': spec.get('victorias', 0),
                    'discards': {},
                }
        state['espectadores'] = {}
            
        c = get_conexion()
        try:
            c.ejecutar(
                "UPDATE adivina_salas SET estado = 'esperando', finished_at = NULL WHERE id = :id",
                {'id': state['sala_id']}
            )
            c.commit()
        except Exception:
            pass
        finally:
            try:
                c.close()
            except Exception:
                pass
                
        await self._broadcast_to_all(state, {"type": "game_restarted"})
        await self._broadcast_state_to_all(state)

    async def _handle_toggle_discard(self, msg: dict, state: dict):
        tarjeta_id = msg.get('tarjeta_id')
        if not tarjeta_id:
            return
            
        player = state['jugadores'].get(self.usuario_id)
        if not player:
            return
        
        # We need the target_id to toggle for. It can be sent from frontend (tab), fallback to jugador_objetivo
        target_id = msg.get('target_id') or state.get('jugador_objetivo')
        if not target_id:
            return

        if 'discards' not in player or not isinstance(player['discards'], dict):
            player['discards'] = {}
            
        if target_id not in player['discards']:
            player['discards'][target_id] = []
            
        if tarjeta_id in player['discards'][target_id]:
            player['discards'][target_id].remove(tarjeta_id)
        else:
            player['discards'][target_id].append(tarjeta_id)
            
        await self._send_state_to_user(state, self.usuario_id)

    async def _save_partida(self, state: dict, ganador_id: str):
        c = get_conexion()
        try:
            partida_id = str(uuid4())
            c.ejecutar(
                """INSERT INTO adivina_partidas (id, sala_id, ganador_id)
                   VALUES (:id, :sala_id, :ganador_id)""",
                {'id': partida_id, 'sala_id': state['sala_id'], 'ganador_id': ganador_id}
            )
            c.ejecutar(
                "UPDATE adivina_salas SET estado = 'terminado', finished_at = CURRENT_TIMESTAMP WHERE id = :id",
                {'id': state['sala_id']}
            )
            c.ejecutar(
                "UPDATE adivina_salas_jugadores SET victorias = victorias + 1 WHERE sala_id = :sala_id AND usuario_id = :usuario_id",
                {'sala_id': state['sala_id'], 'usuario_id': ganador_id}
            )
            c.commit()
        except Exception:
            pass
        finally:
            try:
                c.close()
            except Exception:
                pass
