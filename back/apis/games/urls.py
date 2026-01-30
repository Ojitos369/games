from fastapi import APIRouter
from .rush_hour.urls import router as rush_hour_router

router = APIRouter()

router.include_router(rush_hour_router, prefix="/rush_hour")

