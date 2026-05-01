import random
import string
from typing import Dict, List, Optional
from fastapi import WebSocket


def _gen_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class GameRoom:
    def __init__(self, room_id: str, code: str, host_id: str, host_username: str):
        self.id = room_id
        self.code = code
        self.host_id = host_id
        self.status = "waiting"  # waiting | selecting | voting | playing | finished
        self.players: Dict[str, dict] = {}
        self.selected_cards: List[dict] = []
        self.voting_enabled = False
        self.voting_deadline: Optional[str] = None
        self.card_votes: Dict[str, set] = {}
        self.game: Optional[dict] = None
        self._add_player(host_id, host_username, is_host=True)

    def _add_player(self, user_id: str, username: str, is_host: bool = False):
        self.players[user_id] = {
            "id": user_id,
            "username": username,
            "is_host": is_host,
            "is_ready": False,
            "is_eliminated": False,
        }

    def add_player(self, user_id: str, username: str):
        if user_id not in self.players:
            self._add_player(user_id, username)

    def remove_player(self, user_id: str):
        self.players.pop(user_id, None)

    def start_game(self):
        pids = list(self.players.keys())
        if len(pids) < 2:
            raise ValueError("Se necesitan al menos 2 jugadores")
        if len(self.selected_cards) < len(pids):
            raise ValueError("No hay suficientes tarjetas para todos los jugadores")

        order = pids[:]
        random.shuffle(order)
        cards = self.selected_cards[:]
        random.shuffle(cards)

        game_players = {}
        for i, pid in enumerate(order):
            game_players[pid] = {
                "card": cards[i % len(cards)],
                "is_eliminated": False,
                "card_revealed": None,
            }

        self.game = {
            "status": "playing",
            "turn_order": order,
            "turn_number": 1,
            "current_turn_idx": 0,
            "current_asker": order[0],
            "current_target": None,
            "current_questions": [],
            "history": [],
            "players": game_players,
            "winner": None,
        }
        self.status = "playing"

    def get_active_players(self) -> List[str]:
        if not self.game:
            return []
        return [pid for pid, p in self.game["players"].items() if not p["is_eliminated"]]

    def next_turn(self):
        if not self.game:
            return
        active = self.get_active_players()
        if len(active) <= 1:
            self.game["winner"] = active[0] if active else None
            self.game["status"] = "finished"
            self.status = "finished"
            return

        order = self.game["turn_order"]
        nxt = (self.game["current_turn_idx"] + 1) % len(order)
        for _ in range(len(order)):
            if order[nxt] in active:
                break
            nxt = (nxt + 1) % len(order)

        self.game["current_turn_idx"] = nxt
        self.game["current_asker"] = order[nxt]
        self.game["current_target"] = None
        self.game["current_questions"] = []
        self.game["turn_number"] += 1

    def to_dict(self, for_user_id: str = None) -> dict:
        game_out = None
        if self.game:
            gp = {}
            for pid, pd_data in self.game["players"].items():
                info: dict = {
                    "is_eliminated": pd_data["is_eliminated"],
                    "card_revealed": pd_data.get("card_revealed"),
                }
                if pid == for_user_id:
                    info["my_card"] = pd_data["card"]
                gp[pid] = info

            game_out = {
                "status": self.game["status"],
                "current_asker": self.game["current_asker"],
                "current_target": self.game.get("current_target"),
                "turn_number": self.game["turn_number"],
                "current_questions": self.game.get("current_questions", []),
                "history": self.game.get("history", []),
                "players": gp,
                "winner": self.game.get("winner"),
            }

        return {
            "id": self.id,
            "code": self.code,
            "host_id": self.host_id,
            "status": self.status,
            "players": list(self.players.values()),
            "selected_cards": self.selected_cards,
            "selected_cards_count": len(self.selected_cards),
            "voting_enabled": self.voting_enabled,
            "voting_deadline": self.voting_deadline,
            "card_votes": {cid: list(voters) for cid, voters in self.card_votes.items()},
            "game": game_out,
        }


class AdivinaRoomManager:
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, ws: WebSocket, code: str, user_id: str):
        await ws.accept()
        if code not in self.connections:
            self.connections[code] = {}
        self.connections[code][user_id] = ws

    def disconnect(self, code: str, user_id: str):
        if code in self.connections:
            self.connections[code].pop(user_id, None)
            if not self.connections[code]:
                del self.connections[code]

    async def broadcast(self, code: str, msg: dict, exclude: str = None):
        for uid, ws in list(self.connections.get(code, {}).items()):
            if uid == exclude:
                continue
            try:
                await ws.send_json(msg)
            except Exception:
                self.disconnect(code, uid)

    async def send_to(self, code: str, user_id: str, msg: dict):
        ws = self.connections.get(code, {}).get(user_id)
        if ws:
            try:
                await ws.send_json(msg)
            except Exception:
                self.disconnect(code, user_id)

    def get_room(self, code: str) -> Optional[GameRoom]:
        return self.rooms.get(code)

    def create_room(self, room_id: str, host_id: str, host_username: str) -> GameRoom:
        code = _gen_code()
        while code in self.rooms:
            code = _gen_code()
        room = GameRoom(room_id, code, host_id, host_username)
        self.rooms[code] = room
        return room

    def online_count(self, code: str) -> int:
        return len(self.connections.get(code, {}))


room_manager = AdivinaRoomManager()
