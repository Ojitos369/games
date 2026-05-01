from fastapi import APIRouter
from .rush_car.urls import router as rush_car_router
from .adivina.urls import router as adivina_router

router = APIRouter()

router.include_router(rush_car_router, prefix="/rush_car")
router.include_router(adivina_router, prefix="/adivina")
