import os
import uuid
from core.bases.apis import ConexionApi
from core.conf.settings import MEDIA_DIR

from .manager import room_manager


def _get_user(conexion, d2d, token, MYE):
    r = conexion.consulta_asociativa(
        "SELECT u.id, u.username FROM sessiones s JOIN usuarios u ON u.id = s.usuario_id"
        " WHERE s.token = :t ORDER BY s.created_at DESC LIMIT 1",
        {"t": token},
    )
    rows = d2d(r)
    if not rows:
        raise MYE("Sesión inválida")
    return rows[0]


def _require_token(self):
    cookies = self.request.cookies
    self.token = cookies.get("gamestka", "") or self.request.headers.get("authorization", "")
    if not self.token:
        raise self.MYE("Sesión requerida")


def _optional_token(self):
    cookies = self.request.cookies
    self.token = cookies.get("gamestka", "") or self.request.headers.get("authorization", "") or ""


# ─────────────────────────────────── CARDS ───────────────────────────────────

class ListCards(ConexionApi):
    def validate_session(self):
        _optional_token(self)

    def main(self):
        tags_raw = (self.data.get("tags") or "").strip()
        search = (self.data.get("search") or "").strip()
        params: dict = {}
        where = []

        if tags_raw:
            tag_list = [t.strip().lower() for t in tags_raw.split(",") if t.strip()]
            if tag_list:
                where.append("c.id IN (SELECT card_id FROM adivina_card_tags WHERE tag = ANY(:tags))")
                params["tags"] = tag_list

        if search:
            where.append("(LOWER(c.name) LIKE :s OR LOWER(c.description) LIKE :s)")
            params["s"] = f"%{search.lower()}%"

        q = (
            "SELECT c.id, c.name, c.description, c.image_url, c.created_by,"
            " u.username AS created_by_username,"
            " COALESCE(json_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL), '[]') AS tags"
            " FROM adivina_cards c"
            " LEFT JOIN usuarios u ON u.id = c.created_by"
            " LEFT JOIN adivina_card_tags t ON t.card_id = c.id"
        )
        if where:
            q += " WHERE " + " AND ".join(where)
        q += " GROUP BY c.id, u.username ORDER BY c.name ASC"

        cards = self.d2d(self.conexion.consulta_asociativa(q, params))
        all_tags = [
            row["tag"]
            for row in self.d2d(
                self.conexion.consulta_asociativa(
                    "SELECT DISTINCT tag FROM adivina_card_tags ORDER BY tag"
                )
            )
        ]
        self.response = {"cards": cards, "tags": all_tags}


class CreateCard(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        name = (self.data.get("name") or "").strip()
        if not name:
            raise self.MYE("El nombre es requerido")
        description = (self.data.get("description") or "").strip()
        image_url = (self.data.get("image_url") or "").strip()
        tags = self.data.get("tags") or []

        card_id = str(uuid.uuid4())
        self.conexion.ejecutar(
            "INSERT INTO adivina_cards (id, name, description, image_url, created_by)"
            " VALUES (:id, :n, :d, :img, :uid)",
            {"id": card_id, "n": name, "d": description, "img": image_url, "uid": user["id"]},
        )
        for tag in tags:
            t = tag.strip().lower()
            if t:
                self.conexion.ejecutar(
                    "INSERT INTO adivina_card_tags (card_id, tag) VALUES (:cid, :t) ON CONFLICT DO NOTHING",
                    {"cid": card_id, "t": t},
                )
        self.response = {"card_id": card_id}


class UpdateCard(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        card_id = (self.data.get("id") or "").strip()
        if not card_id:
            raise self.MYE("ID requerido")

        rows = self.d2d(
            self.conexion.consulta_asociativa("SELECT * FROM adivina_cards WHERE id = :id", {"id": card_id})
        )
        if not rows:
            raise self.MYE("Tarjeta no encontrada")
        card = rows[0]

        if str(card["created_by"]) != str(user["id"]) and user["username"] != "test":
            raise self.MYE("Sin permiso para editar esta tarjeta")

        name = (self.data.get("name") or card["name"]).strip()
        description = (
            self.data["description"] if "description" in self.data else card.get("description") or ""
        ).strip()
        image_url = (
            self.data["image_url"] if "image_url" in self.data else card.get("image_url") or ""
        ).strip()
        tags = self.data.get("tags")

        self.conexion.ejecutar(
            "UPDATE adivina_cards SET name=:n, description=:d, image_url=:img WHERE id=:id",
            {"n": name, "d": description, "img": image_url, "id": card_id},
        )
        if tags is not None:
            self.conexion.ejecutar("DELETE FROM adivina_card_tags WHERE card_id = :id", {"id": card_id})
            for tag in tags:
                t = tag.strip().lower()
                if t:
                    self.conexion.ejecutar(
                        "INSERT INTO adivina_card_tags (card_id, tag) VALUES (:cid, :t) ON CONFLICT DO NOTHING",
                        {"cid": card_id, "t": t},
                    )
        self.response = {"status": "updated"}


class DeleteCard(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        card_id = (self.data.get("id") or "").strip()
        rows = self.d2d(
            self.conexion.consulta_asociativa("SELECT * FROM adivina_cards WHERE id = :id", {"id": card_id})
        )
        if not rows:
            raise self.MYE("Tarjeta no encontrada")
        card = rows[0]
        if str(card["created_by"]) != str(user["id"]) and user["username"] != "test":
            raise self.MYE("Sin permiso para eliminar esta tarjeta")

        img = card.get("image_url") or ""
        if img:
            path = os.path.join(MEDIA_DIR, img.lstrip("/"))
            if os.path.exists(path):
                os.remove(path)

        self.conexion.ejecutar("DELETE FROM adivina_cards WHERE id = :id", {"id": card_id})
        self.response = {"status": "deleted"}


# ─────────────────────────────────── DECKS ───────────────────────────────────

class ListDecks(ConexionApi):
    def validate_session(self):
        _optional_token(self)

    def main(self):
        user_id = None
        if self.token:
            rows = self.d2d(
                self.conexion.consulta_asociativa(
                    "SELECT u.id FROM sessiones s JOIN usuarios u ON u.id = s.usuario_id"
                    " WHERE s.token = :t ORDER BY s.created_at DESC LIMIT 1",
                    {"t": self.token},
                )
            )
            if rows:
                user_id = rows[0]["id"]

        q = (
            "SELECT d.id, d.name, d.description, d.is_public, d.created_by, d.created_at,"
            " u.username AS created_by_username, COUNT(dc.card_id) AS card_count"
            " FROM adivina_decks d"
            " LEFT JOIN usuarios u ON u.id = d.created_by"
            " LEFT JOIN adivina_deck_cards dc ON dc.deck_id = d.id"
            " WHERE d.is_public = true OR d.created_by = :uid"
            " GROUP BY d.id, u.username ORDER BY d.name ASC"
        )
        self.response = {"decks": self.d2d(self.conexion.consulta_asociativa(q, {"uid": user_id}))}


class CreateDeck(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        name = (self.data.get("name") or "").strip()
        if not name:
            raise self.MYE("Nombre del mazo requerido")
        description = (self.data.get("description") or "").strip()
        is_public = bool(self.data.get("is_public", False))
        card_ids = self.data.get("card_ids") or []

        deck_id = str(uuid.uuid4())
        self.conexion.ejecutar(
            "INSERT INTO adivina_decks (id, name, description, is_public, created_by)"
            " VALUES (:id, :n, :d, :p, :uid)",
            {"id": deck_id, "n": name, "d": description, "p": is_public, "uid": user["id"]},
        )
        for cid in card_ids:
            self.conexion.ejecutar(
                "INSERT INTO adivina_deck_cards (deck_id, card_id) VALUES (:did, :cid) ON CONFLICT DO NOTHING",
                {"did": deck_id, "cid": cid},
            )
        self.response = {"deck_id": deck_id}


class UpdateDeck(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        deck_id = (self.data.get("id") or "").strip()
        rows = self.d2d(
            self.conexion.consulta_asociativa("SELECT * FROM adivina_decks WHERE id = :id", {"id": deck_id})
        )
        if not rows:
            raise self.MYE("Mazo no encontrado")
        deck = rows[0]
        if str(deck["created_by"]) != str(user["id"]) and user["username"] != "test":
            raise self.MYE("Sin permiso")

        name = (self.data.get("name") or deck["name"]).strip()
        description = (
            self.data["description"] if "description" in self.data else deck.get("description") or ""
        ).strip()
        is_public = self.data["is_public"] if "is_public" in self.data else deck["is_public"]
        card_ids = self.data.get("card_ids")

        self.conexion.ejecutar(
            "UPDATE adivina_decks SET name=:n, description=:d, is_public=:p WHERE id=:id",
            {"n": name, "d": description, "p": is_public, "id": deck_id},
        )
        if card_ids is not None:
            self.conexion.ejecutar("DELETE FROM adivina_deck_cards WHERE deck_id = :id", {"id": deck_id})
            for cid in card_ids:
                self.conexion.ejecutar(
                    "INSERT INTO adivina_deck_cards (deck_id, card_id) VALUES (:did, :cid) ON CONFLICT DO NOTHING",
                    {"did": deck_id, "cid": cid},
                )
        self.response = {"status": "updated"}


class DeleteDeck(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        deck_id = (self.data.get("id") or "").strip()
        rows = self.d2d(
            self.conexion.consulta_asociativa("SELECT * FROM adivina_decks WHERE id = :id", {"id": deck_id})
        )
        if not rows:
            raise self.MYE("Mazo no encontrado")
        deck = rows[0]
        if str(deck["created_by"]) != str(user["id"]) and user["username"] != "test":
            raise self.MYE("Sin permiso")
        self.conexion.ejecutar("DELETE FROM adivina_decks WHERE id = :id", {"id": deck_id})
        self.response = {"status": "deleted"}


class GetDeckCards(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        deck_id = (self.data.get("id") or "").strip()
        q = (
            "SELECT c.id, c.name, c.description, c.image_url,"
            " COALESCE(json_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL), '[]') AS tags"
            " FROM adivina_deck_cards dc"
            " JOIN adivina_cards c ON c.id = dc.card_id"
            " LEFT JOIN adivina_card_tags t ON t.card_id = c.id"
            " WHERE dc.deck_id = :id GROUP BY c.id ORDER BY c.name ASC"
        )
        self.response = {"cards": self.d2d(self.conexion.consulta_asociativa(q, {"id": deck_id}))}


# ─────────────────────────────────── ROOMS ───────────────────────────────────

class CreateRoom(ConexionApi):
    def validate_session(self):
        _require_token(self)

    def main(self):
        user = _get_user(self.conexion, self.d2d, self.token, self.MYE)
        room_id = str(uuid.uuid4())
        room = room_manager.create_room(room_id, str(user["id"]), user["username"])
        self.conexion.ejecutar(
            "INSERT INTO adivina_rooms (id, code, created_by) VALUES (:id, :code, :uid)",
            {"id": room_id, "code": room.code, "uid": user["id"]},
        )
        self.response = {"room_code": room.code, "room_id": room_id}


class GetRoom(ConexionApi):
    def validate_session(self):
        pass

    def main(self):
        code = (self.data.get("code") or "").upper().strip()
        room = room_manager.get_room(code)
        if not room:
            raise self.MYE("Sala no encontrada o ya cerrada")
        self.response = {"room": room.to_dict()}
