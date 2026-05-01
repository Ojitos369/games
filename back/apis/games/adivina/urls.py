import os
from fastapi import APIRouter, Request, WebSocket, UploadFile, File
from core.conf.settings import MEDIA_DIR

from .api import (
    ListCards, CreateCard, UpdateCard, DeleteCard,
    ListDecks, CreateDeck, UpdateDeck, DeleteDeck, GetDeckCards,
    CreateRoom, GetRoom,
)
from .ws import AdivinaWs

router = APIRouter()


# ── Cards ──────────────────────────────────────────────────────────────────

@router.get("/cards")
async def list_cards(request: Request):
    return await ListCards(request=request).run()


@router.post("/cards")
async def create_card(request: Request):
    return await CreateCard(request=request).run()


@router.put("/cards")
async def update_card(request: Request):
    return await UpdateCard(request=request).run()


@router.delete("/cards")
async def delete_card(request: Request):
    return await DeleteCard(request=request).run()


@router.post("/cards/upload/{card_id}")
async def upload_card_image(card_id: str, request: Request, file: UploadFile = File(...)):
    token = request.cookies.get("gamestka", "") or request.headers.get("authorization", "")
    if not token:
        return {"error": "No autorizado"}

    img_dir = os.path.join(MEDIA_DIR, "adivina")
    os.makedirs(img_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{card_id}.{ext}"
    filepath = os.path.join(img_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f_out:
        f_out.write(content)

    url = f"/media/adivina/{filename}"

    from core.conf.settings import ce, prod_mode, db_data
    from ojitos369_postgres_db.postgres_db import ConexionPostgreSQL
    try:
        conn = ConexionPostgreSQL(db_data, ce=ce, send_error=prod_mode, parameter_indicator=":")
        conn.raise_error = True
        conn.ejecutar("UPDATE adivina_cards SET image_url = :url WHERE id = :id", {"url": url, "id": card_id})
        conn.commit()
        conn.close()
    except Exception:
        pass

    return {"url": url}


# ── Decks ──────────────────────────────────────────────────────────────────

@router.get("/decks")
async def list_decks(request: Request):
    return await ListDecks(request=request).run()


@router.post("/decks")
async def create_deck(request: Request):
    return await CreateDeck(request=request).run()


@router.put("/decks")
async def update_deck(request: Request):
    return await UpdateDeck(request=request).run()


@router.delete("/decks")
async def delete_deck(request: Request):
    return await DeleteDeck(request=request).run()


@router.get("/decks/cards")
async def get_deck_cards(request: Request):
    return await GetDeckCards(request=request).run()


# ── Rooms ──────────────────────────────────────────────────────────────────

@router.post("/rooms")
async def create_room(request: Request):
    return await CreateRoom(request=request).run()


@router.get("/rooms")
async def get_room(request: Request):
    return await GetRoom(request=request).run()


# ── WebSocket ──────────────────────────────────────────────────────────────

@router.websocket("/ws/{room_code}")
async def ws_adivina(websocket: WebSocket, room_code: str):
    user_id = websocket.query_params.get("user_id", "")
    username = websocket.query_params.get("username", "")
    if not user_id or not username:
        await websocket.close(code=4001, reason="Credenciales requeridas")
        return
    handler = AdivinaWs(websocket, room_code.upper(), user_id, username)
    await handler.handle()
