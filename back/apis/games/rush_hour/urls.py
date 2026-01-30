from fastapi import APIRouter, Request
from .api import (
    GetRandomLevel
)

router = APIRouter()

@router.get("/get_random_level")
async def get_random_level(request: Request):
    r = await GetRandomLevel(request=request).run()
    return r

