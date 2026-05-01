import asyncio
from datetime import datetime, timedelta
from fastapi import WebSocket, WebSocketDisconnect

from .manager import room_manager


class AdivinaWs:
    def __init__(self, ws: WebSocket, code: str, user_id: str, username: str):
        self.ws = ws
        self.code = code
        self.user_id = user_id
        self.username = username

    async def handle(self):
        room = room_manager.get_room(self.code)
        if not room:
            await self.ws.close(code=4004, reason="Sala no encontrada")
            return

        await room_manager.connect(self.ws, self.code, self.user_id)
        room.add_player(self.user_id, self.username)

        await room_manager.send_to(self.code, self.user_id, {
            "type": "room_state",
            "room": room.to_dict(for_user_id=self.user_id),
        })

        await room_manager.broadcast(self.code, {
            "type": "player_joined",
            "player": room.players[self.user_id],
        }, exclude=self.user_id)

        try:
            while True:
                data = await self.ws.receive_json()
                await self._dispatch(data)
        except (WebSocketDisconnect, Exception):
            pass
        finally:
            room_manager.disconnect(self.code, self.user_id)
            await room_manager.broadcast(self.code, {
                "type": "player_left",
                "player_id": self.user_id,
                "username": self.username,
            })

    async def _dispatch(self, data: dict):
        room = room_manager.get_room(self.code)
        if not room:
            return
        handlers = {
            "chat": self._chat,
            "ready": self._ready,
            "select_cards": self._select_cards,
            "enable_voting": self._enable_voting,
            "vote_card": self._vote_card,
            "close_voting": self._close_voting,
            "start_game": self._start_game,
            "set_target": self._set_target,
            "ask_question": self._ask_question,
            "answer_question": self._answer_question,
            "make_guess": self._make_guess,
            "pass_turn": self._pass_turn,
            "voice_signal": self._voice_signal,
            "restart_room": self._restart_room,
        }
        fn = handlers.get(data.get("type", ""))
        if fn:
            await fn(room, data)

    async def _chat(self, room, data):
        await room_manager.broadcast(self.code, {
            "type": "chat_message",
            "from_id": self.user_id,
            "username": self.username,
            "message": (data.get("message") or "").strip(),
            "timestamp": datetime.now().isoformat(),
        })

    async def _ready(self, room, data):
        p = room.players.get(self.user_id)
        if not p:
            return
        p["is_ready"] = not p["is_ready"]
        await room_manager.broadcast(self.code, {
            "type": "player_ready",
            "player_id": self.user_id,
            "is_ready": p["is_ready"],
        })

    async def _select_cards(self, room, data):
        if self.user_id != room.host_id:
            return
        room.selected_cards = data.get("cards", [])
        room.status = "selecting"
        await room_manager.broadcast(self.code, {
            "type": "cards_selected",
            "cards": room.selected_cards,
            "count": len(room.selected_cards),
        })

    async def _enable_voting(self, room, data):
        if self.user_id != room.host_id:
            return
        duration = max(10, int(data.get("duration", 60)))
        deadline = (datetime.now() + timedelta(seconds=duration)).isoformat()
        room.voting_enabled = True
        room.voting_deadline = deadline
        room.card_votes = {}
        room.status = "voting"
        await room_manager.broadcast(self.code, {
            "type": "voting_started",
            "cards": room.selected_cards,
            "deadline": deadline,
            "duration": duration,
        })
        asyncio.create_task(self._auto_close(room, duration))

    async def _auto_close(self, room, delay: int):
        await asyncio.sleep(delay)
        if room.status == "voting":
            await self._close_voting(room, {})

    async def _vote_card(self, room, data):
        if room.status != "voting":
            return
        cid = data.get("card_id")
        if not cid:
            return
        if cid not in room.card_votes:
            room.card_votes[cid] = set()
        voters = room.card_votes[cid]
        if self.user_id in voters:
            voters.discard(self.user_id)
        else:
            voters.add(self.user_id)
        await room_manager.broadcast(self.code, {
            "type": "vote_update",
            "card_id": cid,
            "votes": len(voters),
            "voted_by": list(voters),
        })

    async def _close_voting(self, room, data):
        n = len(room.players)
        sorted_cards = sorted(
            room.selected_cards,
            key=lambda c: len(room.card_votes.get(str(c.get("id", "")), set())),
            reverse=True,
        )
        room.selected_cards = sorted_cards[:max(n, len(sorted_cards))]
        room.status = "selecting"
        room.voting_enabled = False
        await room_manager.broadcast(self.code, {
            "type": "voting_ended",
            "selected_cards": room.selected_cards,
        })

    async def _start_game(self, room, data):
        if self.user_id != room.host_id:
            return
        try:
            room.start_game()
        except ValueError as e:
            await room_manager.send_to(self.code, self.user_id, {
                "type": "error", "message": str(e),
            })
            return

        for pid in room.game["players"]:
            await room_manager.send_to(self.code, pid, {
                "type": "game_started",
                "my_card": room.game["players"][pid]["card"],
                "turn_order": room.game["turn_order"],
                "current_asker": room.game["current_asker"],
                "players": list(room.players.values()),
            })

    async def _set_target(self, room, data):
        g = room.game
        if not g or g["current_asker"] != self.user_id:
            return
        tid = data.get("target_id")
        if not tid or tid == self.user_id:
            return
        if g["players"].get(tid, {}).get("is_eliminated", True):
            return
        g["current_target"] = tid
        g["current_questions"] = []
        await room_manager.broadcast(self.code, {
            "type": "target_set",
            "asker_id": self.user_id,
            "target_id": tid,
        })

    async def _ask_question(self, room, data):
        g = room.game
        if not g or g["current_asker"] != self.user_id:
            return
        tid = g.get("current_target")
        if not tid:
            await room_manager.send_to(self.code, self.user_id, {
                "type": "error", "message": "Elige un objetivo primero",
            })
            return
        question = (data.get("question") or "").strip()
        if not question:
            return
        idx = len(g["current_questions"])
        g["current_questions"].append({"question": question, "answer": None})
        await room_manager.broadcast(self.code, {
            "type": "question_asked",
            "asker_id": self.user_id,
            "asker_username": self.username,
            "target_id": tid,
            "question": question,
            "q_idx": idx,
        })

    async def _answer_question(self, room, data):
        g = room.game
        if not g or g.get("current_target") != self.user_id:
            return
        q_idx = data.get("q_idx", -1)
        answer = bool(data.get("answer", False))
        qs = g.get("current_questions", [])
        if 0 <= q_idx < len(qs):
            qs[q_idx]["answer"] = answer
        await room_manager.broadcast(self.code, {
            "type": "question_answered",
            "target_id": self.user_id,
            "q_idx": q_idx,
            "answer": answer,
        })

    async def _make_guess(self, room, data):
        g = room.game
        if not g or g["current_asker"] != self.user_id:
            return
        tid = g.get("current_target")
        if not tid:
            await room_manager.send_to(self.code, self.user_id, {
                "type": "error", "message": "Elige un objetivo primero",
            })
            return

        guess = (data.get("character_name") or "").strip().lower()
        target_card = g["players"][tid]["card"]
        correct = guess == (target_card.get("name") or "").strip().lower()

        g["history"].append({
            "turn_number": g["turn_number"],
            "asker_id": self.user_id,
            "asker_username": self.username,
            "target_id": tid,
            "target_username": room.players.get(tid, {}).get("username", ""),
            "guess": data.get("character_name"),
            "correct": correct,
            "questions": list(g.get("current_questions", [])),
        })

        await room_manager.broadcast(self.code, {
            "type": "guess_result",
            "correct": correct,
            "asker_id": self.user_id,
            "asker_username": self.username,
            "target_id": tid,
            "target_username": room.players.get(tid, {}).get("username", ""),
            "character": target_card if correct else None,
            "guess": data.get("character_name"),
        })

        if correct:
            g["players"][tid]["is_eliminated"] = True
            g["players"][tid]["card_revealed"] = target_card
            room.players[tid]["is_eliminated"] = True

            active = room.get_active_players()
            if len(active) <= 1:
                winner_id = active[0] if active else None
                g["winner"] = winner_id
                g["status"] = "finished"
                room.status = "finished"
                all_cards = [
                    {**room.players.get(pid, {}), "card": g["players"][pid]["card"]}
                    for pid in g["players"]
                ]
                await room_manager.broadcast(self.code, {
                    "type": "game_over",
                    "winner_id": winner_id,
                    "winner_username": room.players.get(winner_id, {}).get("username"),
                    "players": all_cards,
                })
                return

        room.next_turn()
        if room.game:
            await room_manager.broadcast(self.code, {
                "type": "turn_changed",
                "current_asker": room.game["current_asker"],
                "turn_number": room.game["turn_number"],
            })

    async def _pass_turn(self, room, data):
        g = room.game
        if not g or g["current_asker"] != self.user_id:
            return
        room.next_turn()
        if room.game:
            await room_manager.broadcast(self.code, {
                "type": "turn_changed",
                "current_asker": room.game["current_asker"],
                "turn_number": room.game["turn_number"],
            })

    async def _voice_signal(self, room, data):
        to_id = data.get("to_id")
        if to_id:
            await room_manager.send_to(self.code, to_id, {
                "type": "voice_signal",
                "from_id": self.user_id,
                "signal": data.get("signal"),
            })

    async def _restart_room(self, room, data):
        if self.user_id != room.host_id:
            return
        room.game = None
        room.status = "waiting"
        for p in room.players.values():
            p["is_eliminated"] = False
            p["is_ready"] = False
        await room_manager.broadcast(self.code, {
            "type": "room_restarted",
            "room": room.to_dict(),
        })
