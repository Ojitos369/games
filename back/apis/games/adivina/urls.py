from fastapi import APIRouter, WebSocket, Request, UploadFile, File
from .api import (
    ListTags, CreateTag, DeleteTag,
    ListTarjetas, CreateTarjeta, UpdateTarjeta, DeleteTarjeta, UploadTarjetaImagen,
    ListDecks, CreateDeck, UpdateDeck, DeleteDeck, GetDeckTarjetas,
    PublicarDeck, DecksPublicos, ImportarDeck, DesvincularDeck, CopiarDeck,
    ListSalas, CreateSala, GetSala,
)
from .socket_api import AdivinaSocketApi
from core.websockets.manager import manager

router = APIRouter()

# ── Tags ──────────────────────────────────────────────────────────────────────

@router.get("/tags")
async def list_tags(request: Request):
    return await ListTags(request=request).run()

@router.post("/tags")
async def create_tag(request: Request):
    return await CreateTag(request=request).run()

@router.delete("/tags")
async def delete_tag(request: Request):
    return await DeleteTag(request=request).run()

# ── Tarjetas ──────────────────────────────────────────────────────────────────

@router.get("/tarjetas")
async def list_tarjetas(request: Request):
    return await ListTarjetas(request=request).run()

@router.post("/tarjetas")
async def create_tarjeta(request: Request):
    return await CreateTarjeta(request=request).run()

@router.put("/tarjetas")
async def update_tarjeta(request: Request):
    return await UpdateTarjeta(request=request).run()

@router.delete("/tarjetas")
async def delete_tarjeta(request: Request):
    return await DeleteTarjeta(request=request).run()

@router.post("/upload_tarjeta/{tarjeta_id}")
async def upload_tarjeta_imagen(request: Request, tarjeta_id: str, file: UploadFile = File(...)):
    api = UploadTarjetaImagen(request=request, tarjeta_id=tarjeta_id, file=file)
    return await api.run()

# ── Decks ─────────────────────────────────────────────────────────────────────

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

@router.get("/decks/publicos")
async def decks_publicos(request: Request):
    return await DecksPublicos(request=request).run()

@router.get("/decks/{deck_id}/tarjetas")
async def get_deck_tarjetas(request: Request, deck_id: str):
    return await GetDeckTarjetas(request=request, deck_id=deck_id).run()

@router.patch("/decks/publicar")
async def publicar_deck(request: Request):
    return await PublicarDeck(request=request).run()

@router.post("/decks/importar")
async def importar_deck(request: Request):
    return await ImportarDeck(request=request).run()

@router.delete("/decks/importar")
async def desvincular_deck(request: Request):
    return await DesvincularDeck(request=request).run()

@router.post("/decks/copiar")
async def copiar_deck(request: Request):
    return await CopiarDeck(request=request).run()

# ── Salas ─────────────────────────────────────────────────────────────────────

@router.get("/salas")
async def list_salas(request: Request):
    return await ListSalas(request=request).run()

@router.post("/salas")
async def create_sala(request: Request):
    return await CreateSala(request=request).run()

@router.get("/salas/info")
async def get_sala(request: Request):
    return await GetSala(request=request).run()

# ── WebSocket ─────────────────────────────────────────────────────────────────

@router.websocket("/ws/{codigo}")
async def adivina_ws(websocket: WebSocket, codigo: str):
    api = AdivinaSocketApi(websocket=websocket, manager=manager, codigo=codigo)
    await api.handle_connection()
