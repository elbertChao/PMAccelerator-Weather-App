from fastapi import FastAPI, HTTPException, Query
from models import WeatherRequest, WeatherRecord
from database import weather_collection
from fastapi.responses import JSONResponse
from bson.objectid import ObjectId
import os
import httpx
from datetime import datetime
import csv
from fastapi.responses import StreamingResponse
import io
from fastapi.middleware.cors import CORSMiddleware
from fuzzywuzzy import process

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility function to convert Mongo document to dict
def weather_record_helper(record) -> dict:
    return {
        "id": str(record["_id"]),
        "location": record["location"],
        "date_range": record["date_range"],
        "weather_data": record["weather_data"],
        "forecast_data": record.get("forecast_data"),
        "youtube_videos": record.get("youtube_videos", []),
        "google_map_url": record.get("google_map_url", "")
    }

@app.post("/weather", response_model=WeatherRecord)
async def create_weather_record(request: WeatherRequest):
    if request.date_range.start > request.date_range.end:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date.")

    WEATHER_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    if "," in request.location:
        parts = request.location.split(",")
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid coordinate format. Use 'lat,lon'.")
        lat = parts[0].strip()
        lon = parts[1].strip()
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=imperial&appid={WEATHER_API_KEY}"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=imperial&appid={WEATHER_API_KEY}"
    elif request.location.isdigit():
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?zip={request.location}&units=imperial&appid={WEATHER_API_KEY}"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?zip={request.location}&units=imperial&appid={WEATHER_API_KEY}"
    else:
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={request.location}&units=imperial&appid={WEATHER_API_KEY}"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={request.location}&units=imperial&appid={WEATHER_API_KEY}"

    async with httpx.AsyncClient() as client:
        weather_response = await client.get(weather_url)
    if weather_response.status_code != 200:
        raise HTTPException(
            status_code=weather_response.status_code,
            detail=weather_response.json().get("message", "Error fetching current weather")
        )
    weather_data = weather_response.json()

    async with httpx.AsyncClient() as client:
        forecast_response = await client.get(forecast_url)
    if forecast_response.status_code != 200:
        raise HTTPException(
            status_code=forecast_response.status_code,
            detail=forecast_response.json().get("message", "Error fetching forecast")
        )
    forecast_data = forecast_response.json()

    youtube_videos = []
    GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google Maps API key not configured")
    google_map_url = f"https://www.google.com/maps/embed/v1/place?key={GOOGLE_API_KEY}&q={request.location}"

    weather_record = {
        "location": request.location,
        "date_range": {
            "start": request.date_range.start.isoformat(),
            "end": request.date_range.end.isoformat()
        },
        "weather_data": weather_data,
        "forecast_data": forecast_data,
        "youtube_videos": youtube_videos,
        "google_map_url": google_map_url,
    }

    result = await weather_collection.insert_one(weather_record)
    new_record = await weather_collection.find_one({"_id": result.inserted_id})
    return weather_record_helper(new_record)

@app.get("/weather", response_model=list[WeatherRecord])
async def read_weather_records():
    records = []
    async for record in weather_collection.find():
        records.append(weather_record_helper(record))
    return records

@app.get("/search")
async def search_location(query: str):
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not set")

    url = f"http://api.openweathermap.org/geo/1.0/direct?q={query}&limit=5&appid={OPENWEATHER_API_KEY}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Failed to fetch geocoding results")
    data = res.json()

    # Return `lat,lon` as location string for best compatibility
    results = []
    for item in data:
        location_name = f"{item['name']}, {item.get('state', '')}, {item['country']}".strip(", ")
        location_string = f"{item['lat']},{item['lon']}"
        results.append({
            "label": location_name,
            "location": location_string
        })

    return results

@app.put("/weather/{record_id}", response_model=WeatherRecord)
async def update_weather_record(record_id: str, request: WeatherRequest):
    if request.date_range.start > request.date_range.end:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date.")

    update_data = {
        "location": request.location,
        "date_range": {
            "start": request.date_range.start.isoformat(),
            "end": request.date_range.end.isoformat(),
        }
    }
    result = await weather_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Record not found or no changes made.")
    updated_record = await weather_collection.find_one({"_id": ObjectId(record_id)})
    return weather_record_helper(updated_record)

@app.delete("/weather/{record_id}")
async def delete_weather_record(record_id: str):
    result = await weather_collection.delete_one({"_id": ObjectId(record_id)})
    if result.deleted_count == 1:
        return JSONResponse(status_code=200, content={"message": "Record deleted"})
    raise HTTPException(status_code=404, detail="Record not found")

@app.get("/export/json")
async def export_json():
    records = []
    async for record in weather_collection.find():
        records.append(weather_record_helper(record))
    return records

@app.get("/export/csv")
async def export_csv():
    records = []
    async for record in weather_collection.find():
        records.append(weather_record_helper(record))
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=records[0].keys())
    writer.writeheader()
    writer.writerows(records)
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=weather.csv"})