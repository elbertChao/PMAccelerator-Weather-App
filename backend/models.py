from datetime import date
from pydantic import BaseModel, Field

class DateRange(BaseModel):
    start: date
    end: date

class WeatherRequest(BaseModel):
    location: str
    date_range: DateRange

class WeatherRecord(BaseModel):
    id: str
    location: str
    date_range: DateRange
    weather_data: dict
    forecast_data: dict
    youtube_videos: list[str] = []
    google_map_url: str = ""