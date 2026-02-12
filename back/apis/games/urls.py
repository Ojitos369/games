from fastapi import APIRouter
from .rush_car.urls import router as rush_car_router

router = APIRouter()

router.include_router(rush_car_router, prefix="/rush_car")

