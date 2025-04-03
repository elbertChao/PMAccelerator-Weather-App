'use client';
import { useState } from 'react';

const Home: React.FC = () => {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // The API key must be set in .env.local as NEXT_PUBLIC_OPENWEATHERMAP_API_KEY
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

  // Fetch current weather and forecast based on input
  const fetchWeather = async (loc: string): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      let urlCurrent = '';
      let urlForecast = '';

      // Check input format: coordinates, zip code, or city name.
      if (loc.includes(',')) {
        // Expecting "lat,lon"
        const parts = loc.split(',');
        if (parts.length === 2) {
          const lat = parts[0].trim();
          const lon = parts[1].trim();
          urlCurrent = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;
          urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;
        } else {
          setError("Invalid coordinate format. Use 'lat,lon'.");
          setLoading(false);
          return;
        }
      } else if (/^\d+$/.test(loc)) {
        // Only digits – assume ZIP/Postal code.
        urlCurrent = `https://api.openweathermap.org/data/2.5/weather?zip=${loc}&units=imperial&appid=${API_KEY}`;
        urlForecast = `https://api.openweathermap.org/data/2.5/forecast?zip=${loc}&units=imperial&appid=${API_KEY}`;
      } else {
        // Otherwise, treat input as a city name or landmark.
        urlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${loc}&units=imperial&appid=${API_KEY}`;
        urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${loc}&units=imperial&appid=${API_KEY}`;
      }

      // Fetch current weather
      const resCurrent = await fetch(urlCurrent);
      if (!resCurrent.ok) {
        const data = await resCurrent.json();
        throw new Error(data.message || 'Error fetching current weather');
      }
      const currentData = await resCurrent.json();
      setWeatherData(currentData);

      // Fetch 5-day forecast
      const resForecast = await fetch(urlForecast);
      if (!resForecast.ok) {
        const data = await resForecast.json();
        throw new Error(data.message || 'Error fetching forecast');
      }
      const forecast = await resForecast.json();
      setForecastData(forecast);
    } catch (err: any) {
      setError(err.message);
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!location) return;
    fetchWeather(location);
  };

  // Use browser geolocation to get current position
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        setLocation(coords);
        fetchWeather(coords);
      },
      () => {
        setError('Unable to retrieve your location');
      }
    );
  };

  // Render current weather details
  const renderCurrentWeather = () => {
    if (!weatherData) return null;
    const iconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">
          Current Weather for {weatherData.name}
        </h2>
        <img
          src={iconUrl}
          alt={weatherData.weather[0].description}
          className="w-20 h-20"
        />
        <p className="text-lg">{weatherData.weather[0].description}</p>
        <p>Temperature: {weatherData.main.temp} °F</p>
        <p>Humidity: {weatherData.main.humidity} %</p>
        <p>Wind: {weatherData.wind.speed} mph</p>
      </div>
    );
  };

  // Render a 5-day forecast using forecast API data.
  // Here, we pick one forecast data point per day (typically near noon).
  const renderForecast = () => {
    if (!forecastData) return null;

    const dailyData: { [day: string]: any } = {};
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString();
      const hour = date.getHours();
      // Choose forecast entry near noon (12:00)
      if (hour === 12) {
        dailyData[day] = item;
      }
    });

    const days = Object.keys(dailyData);
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">5-Day Forecast</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {days.map((day) => {
            const item = dailyData[day];
            const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
            return (
              <div key={day} className="border p-4 text-center rounded">
                <h3 className="font-semibold">{day}</h3>
                <img
                  src={iconUrl}
                  alt={item.weather[0].description}
                  className="w-16 h-16 mx-auto"
                />
                <p className="text-sm">{item.weather[0].description}</p>
                <p className="text-sm">Temp: {item.main.temp} °F</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Weather App</h1>
      <form onSubmit={handleSubmit} className="flex mb-4">
        <input
          type="text"
          placeholder="Enter location (city, zip, or lat,lon)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-grow p-2 border rounded"
        />
        <button
          type="submit"
          className="ml-2 p-2 bg-blue-500 text-white rounded"
        >
          Get Weather
        </button>
      </form>
      <button
        onClick={handleGetCurrentLocation}
        className="w-full p-2 bg-green-500 text-white rounded mb-4"
      >
        Use My Current Location
      </button>
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {renderCurrentWeather()}
      {renderForecast()}
    </div>
  );
};

export default Home;
