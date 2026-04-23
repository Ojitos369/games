import os
from fastapi import APIRouter, Request, UploadFile, File, Form
from .api import (
    ListJuegos, CreateJuego, UpdateJuego, DeleteJuego,
    ListCategorias, CreateCategoria, UpdateCategoria, DeleteCategoria,
    UploadImagen, DeleteImagen, ToggleFavorito
)
from core.conf.settings import MEDIA_DIR

router = APIRouter()


# ============ JUEGOS ============

@router.get("/juegos")
async def list_juegos(request: Request):
    r = await ListJuegos(request=request).run()
    return r

@router.post("/juegos")
async def create_juego(request: Request):
    r = await CreateJuego(request=request).run()
    return r

@router.put("/juegos")
async def update_juego(request: Request):
    r = await UpdateJuego(request=request).run()
    return r

@router.delete("/juegos")
async def delete_juego(request: Request):
    r = await DeleteJuego(request=request).run()
    return r

@router.post("/favoritos")
async def toggle_favorito(request: Request):
    r = await ToggleFavorito(request=request).run()
    return r


# ============ CATEGORIAS ============

@router.get("/categorias")
async def list_categorias(request: Request):
    r = await ListCategorias(request=request).run()
    return r

@router.post("/categorias")
async def create_categoria(request: Request):
    r = await CreateCategoria(request=request).run()
    return r

@router.put("/categorias")
async def update_categoria(request: Request):
    r = await UpdateCategoria(request=request).run()
    return r

@router.delete("/categorias")
async def delete_categoria(request: Request):
    r = await DeleteCategoria(request=request).run()
    return r


# ============ IMAGENES ============

@router.post("/imagenes")
async def upload_imagen(request: Request):
    r = await UploadImagen(request=request).run()
    return r

@router.delete("/imagenes")
async def delete_imagen(request: Request):
    r = await DeleteImagen(request=request).run()
    return r


@router.post("/upload_image/{juego_id}")
async def upload_image_file(juego_id: str, request: Request, file: UploadFile = File(...)):
    # Validate session
    cookies = request.cookies
    mi_cookie = cookies.get('gamestka', '')
    auth_code = request.headers.get("authorization", None)
    token = mi_cookie or auth_code

    if not token:
        return {"error": "No autorizado"}

    # Save file
    img_dir = os.path.join(MEDIA_DIR, 'images', 'games', juego_id)
    os.makedirs(img_dir, exist_ok=True)

    file_path = os.path.join(img_dir, file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {
        "message": "Archivo subido",
        "filename": file.filename,
        "url": f"/media/images/games/{juego_id}/{file.filename}"
    }
