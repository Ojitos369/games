import json
import random
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
        'turno_actual': None,  # This will be the "Guesser" (jugador_pregunta)
        'jugador_objetivo': None,
        'turno_numero': 0,
        'n_offset': 1,
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

    # Find the guesser (Player 2) based on N offset
    idx_guesser = (idx_target + state.get('n_offset', 1)) % len(active)
    state['turno_actual'] = active[idx_guesser]
    
    state['turno_numero'] += 1
    state['pregunta_actual'] = None


def _check_win(state: dict) -> str | None:
    active = [uid for uid, p in state['jugadores'].items() if not p.get('eliminado')]
    if len(active) == 1:
        return active[0]
    if len(active) == 0:
        ids = list(state['jugadores'].keys())
        return ids[-1] if ids else None
    return None


def _public_state(state: dict, for_user_id: str) -> dict:
    jugadores_public = {}
    current_target_id = state.get('jugador_objetivo')

    for uid, p in state['jugadores'].items():
        entry = {
            'user_id': uid,
            'username': p['username'],
            'eliminado': p.get('eliminado', False),
            'orden': p.get('orden', 0),
            'victorias': p.get('victorias', 0),
        }
        if uid == for_user_id:
            entry['tarjeta'] = p.get('tarjeta')
            entry['tarjeta_id'] = p.get('tarjeta_id')
            # Only send discards for the current target to the current user
            # discards is now a dict: { target_id: [tarjeta_ids] }
            entry['discards'] = p.get('discards', {}).get(current_target_id, [])
        else:
            entry['tarjeta'] = None
            entry['tarjeta_id'] = None
        jugadores_public[uid] = entry

    return {
        'sala_id': state['sala_id'],
        'creador_id': state['creador_id'],
        'estado': state['estado'],
        'visibilidad': state.get('visibilidad', 'publica'),
        'jugadores': jugadores_public,
        'turno_actual': state['turno_actual'], # Guesser
        'jugador_objetivo': state['jugador_objetivo'], # Target
        'turno_numero': state['turno_numero'],
        'n_offset': state.get('n_offset', 1),
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
        if self.usuario_id not in state['jugadores']:
            # Try to load victorias from DB if player was already in room
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
                    # New player in room — insert into DB
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

            state['jugadores'][self.usuario_id] = {
                'username': self.username,
                'eliminado': False,
                'tarjeta_id': None,
                'tarjeta': None,
                'orden': len(state['jugadores']),
                'victorias': victorias,
                'discards': {}, # target_id -> [tarjeta_ids]
            }

        await self._broadcast_to_all(state, {
            "type": "player_joined",
            "user_id": self.usuario_id,
            "username": self.username,
        })
        await self._send_state_to_user(state, self.usuario_id)

    async def on_disconnect(self, state: dict):
        # Always remove player from state
        state['jugadores'].pop(self.usuario_id, None)

        if not state['jugadores']:
            # No players left — clean up room
            game_states.pop(self.codigo, None)
            c = get_conexion()
            try:
                c.ejecutar("DELETE FROM adivina_salas_jugadores WHERE sala_id = :sala_id", {'sala_id': state['sala_id']})
                c.ejecutar("DELETE FROM adivina_salas WHERE id = :id", {'id': state['sala_id']})
                c.commit()
            except Exception:
                pass
            finally:
                try:
                    c.close()
                except Exception:
                    pass
            return

        if state['estado'] == 'esperando':
            await self._broadcast_to_all(state, {
                "type": "player_left",
                "user_id": self.usuario_id,
                "username": self.username,
            })
        else:
            await self._broadcast_to_all(state, {
                "type": "player_disconnected",
                "user_id": self.usuario_id,
                "username": self.username,
            })

        # If game is in progress and disconnected player was the current turn, advance
        if state['estado'] == 'jugando' and (state['turno_actual'] == self.usuario_id or state['jugador_objetivo'] == self.usuario_id):
            _advance_turn(state)

        await self._broadcast_state_to_all(state)

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
        if not self._is_host(state):
            return
        if state['estado'] != 'esperando':
            return
        tarjeta_ids = msg.get('tarjeta_ids', [])
        tarjetas = _get_tarjetas_data(tarjeta_ids)
        state['seleccion']['tarjetas_seleccionadas'] = tarjeta_ids
        state['seleccion']['tarjetas_disponibles'] = tarjetas
        await self._broadcast_state_to_all(state)

    async def _handle_start_game(self, msg: dict, state: dict):
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
        await self._broadcast_state_to_all(state)

    async def _handle_pregunta(self, msg: dict, state: dict):
        if state['estado'] != 'jugando':
            return
        if state['turno_actual'] != self.usuario_id:
            return

        target_id = msg.get('target_id', '')
        texto = msg.get('texto', '').strip()
        if not target_id or not texto:
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
        
        # Optional: Auto-advance turn after answer is received
        # _advance_turn(state) 
        # state['pregunta_actual'] = None
        
        await self._broadcast_state_to_all(state)

    async def _handle_adivinar(self, msg: dict, state: dict):
        if state['estado'] != 'jugando':
            return
        if state['turno_actual'] != self.usuario_id:
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
            if ganador:
                state['ganador'] = ganador
                state['estado'] = 'terminado'
                ganador_player = state['jugadores'].get(ganador)
                if ganador_player:
                    ganador_player['victorias'] = ganador_player.get('victorias', 0) + 1
                
                ganador_username = ganador_player.get('username', '') if ganador_player else ''
                await self._broadcast_to_all(state, event)
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
                await self._broadcast_state_to_all(state)
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
            # Automatic discard on fail for this specific target
            guessing_player = state['jugadores'].get(self.usuario_id)
            if guessing_player:
                if target_id not in guessing_player['discards']:
                    guessing_player['discards'][target_id] = []
                
                failed_tarjeta_id = target.get('tarjeta_id')
                if failed_tarjeta_id and failed_tarjeta_id not in guessing_player['discards'][target_id]:
                    guessing_player['discards'][target_id].append(failed_tarjeta_id)

        await self._broadcast_to_all(state, event)
        _advance_turn(state)
        state['pregunta_actual'] = None
        await self._broadcast_state_to_all(state)

    async def _handle_advance_turn(self, msg: dict, state: dict):
        if not self._is_host(state) and state['turno_actual'] != self.usuario_id:
            return
        if state['estado'] != 'jugando':
            return
        _advance_turn(state)
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
        
        for uid, p in state['jugadores'].items():
            p['eliminado'] = False
            p['tarjeta_id'] = None
            p['tarjeta'] = None
            p['discards'] = {}
            
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
        
        # We need the target_id to toggle for. It should be the current jugador_objetivo
        target_id = state.get('jugador_objetivo')
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
