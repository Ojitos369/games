from fastapi import APIRouter, Request
from .api import (
    GetLevel,
    SaveRecord,
    GetRecords,
    GetUserRecords,
    GetTopPlayers,
    GetTrending,
)

router = APIRouter()

@router.get("/get_level")
async def get_level(request: Request):
    r = await GetLevel(request=request).run()
    return r

@router.post("/save_record")
async def save_record(request: Request):
    r = await SaveRecord(request=request).run()
    return r

@router.get("/get_records")
async def get_records(request: Request):
    r = await GetRecords(request=request).run()
    return r

@router.get("/get_user_records")
async def get_user_records(request: Request):
    r = await GetUserRecords(request=request).run()
    return r

@router.get("/get_top_players")
async def get_top_players(request: Request):
    r = await GetTopPlayers(request=request).run()
    return r

@router.get("/get_trending")
async def get_trending(request: Request):
    r = await GetTrending(request=request).run()
    return r
