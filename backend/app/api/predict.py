import xgboost as xgb
import numpy as np
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Load model once at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'ml', 'panahon_ai_xgboost_model.json')
model = xgb.XGBRegressor()
model.load_model(MODEL_PATH)

def predict_temperature(current_data, lat, lon, target_hour=6):
    now = datetime.now()
    target_dt = datetime.now().replace(hour=(now.hour + target_hour) % 24)
    hour = target_dt.hour
    day = target_dt.day
    month = target_dt.month
    
    features = np.array([[
        current_data['temperature'],
        current_data['humidity'],
        current_data.get('pressure', 1013),
        current_data['cloud_cover'],
        current_data.get('precipitation', 0),
        current_data.get('wind_speed', 0),
        current_data.get('wind_direction', 0),
        lat,
        lon,
        np.sin(2 * np.pi * hour / 24),
        np.cos(2 * np.pi * hour / 24),
        np.sin(2 * np.pi * month / 12),
        np.cos(2 * np.pi * month / 12),
        np.sin(2 * np.pi * day / 31),
        np.cos(2 * np.pi * day / 31),
    ]])
    
    prediction = model.predict(features)[0]
    return round(float(prediction), 1)

class CurrentWeather(BaseModel):
    temperature: float
    humidity: float
    cloud_cover: float
    pressure: float = 1013
    precipitation: float = 0
    wind_speed: float = 0
    wind_direction: float = 0

class PredictionRequest(BaseModel):
    current: CurrentWeather
    lat: float
    lon: float
    hours: list[int] = [6, 12, 24]

class PredictionResponse(BaseModel):
    predictions: dict

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        current_data = {
            'temperature': request.current.temperature,
            'humidity': request.current.humidity,
            'cloud_cover': request.current.cloud_cover,
            'pressure': request.current.pressure,
            'precipitation': request.current.precipitation,
            'wind_speed': request.current.wind_speed,
            'wind_direction': request.current.wind_direction,
        }
        
        predictions = {}
        for h in request.hours:
            predictions[f"{h}h"] = predict_temperature(
                current_data, request.lat, request.lon, h
            )
        
        return PredictionResponse(predictions=predictions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))