'use client';
import { useState } from 'react';
import Link from 'next/link';

const Home: React.FC = () => {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  let tempInCelsius: number | null = null;
  let tempInFahrenheit: number | null = null;
  let windSpeedInMph: number | null = null;
  let windSpeedInKmh: number | null = null;

  if (weatherData && weatherData.main && weatherData.wind) {
    tempInFahrenheit = Math.round(weatherData.main.temp);
    if (tempInFahrenheit !== null) {
      tempInCelsius = Math.round((tempInFahrenheit - 32) * (5 / 9));
    }
    windSpeedInMph = Math.round(weatherData.wind.speed);
    if (windSpeedInMph !== null) {
      windSpeedInKmh = Math.round(windSpeedInMph * 1.60934);
    }
  }

  // Fetch weather data from our backend
  const fetchWeather = async (loc: string): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      // For demonstration, we use today's date as both start and end of the date range.
      const today = new Date().toISOString().split('T')[0];
      const body = {
        location: loc,
        date_range: { start: today, end: today }
      };

      const res = await fetch('http://localhost:8000/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error fetching weather from backend');
      }
      const data = await res.json();
      // console.log("Forecast data:", data.forecast_data); // DEBUGGING
      setWeatherData(data.weather_data);
      setForecastData(data.forecast_data);
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
        <p>Temperature: {tempInCelsius} °C | {tempInFahrenheit} °F</p>
        <p>Humidity: {weatherData.main.humidity} %</p>
        <p>Wind: {windSpeedInKmh} km/h | {windSpeedInMph} mph</p>
      </div>
    );
  };

  // Render a 5-day forecast using forecast API data.
  // Here, we pick one forecast data point per day (typically near noon UTC).
  const renderForecast = () => {
    if (!forecastData || !forecastData.list) return null;
  
    const dailyData: { [day: string]: any } = {};
  
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString();
      const hour = date.getUTCHours();
      // If no entry for this day yet, simply set it.
      if (!dailyData[day]) {
        dailyData[day] = item;
      } else {
        // Otherwise, compare which forecast is closer to 12:00 UTC.
        const currentEntry = dailyData[day];
        const currentHour = new Date(currentEntry.dt * 1000).getUTCHours();
        if (Math.abs(hour - 12) < Math.abs(currentHour - 12)) {
          dailyData[day] = item;
        }
      }
    });
  
    const days = Object.keys(dailyData);
    if (days.length === 0) {
      return <p>No forecast data available.</p>;
    }
  
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
                <p className="text-sm">
                  Temperature:{" "}
                    {Math.round((item.main.temp - 32) * (5 / 9))}°C
                  /{" "}
                    {Math.round(item.main.temp)}°F
                </p>
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
        <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded">
          Get Weather
        </button>
      </form>
      <button
        onClick={handleGetCurrentLocation}
        className="w-full p-2 bg-green-500 text-white rounded mb-4"
      >
        Use My Current Location
      </button>
      <Link href="/records" legacyBehavior>
        <a className="block text-center p-2 bg-gray-700 text-white rounded">
          View Weather Records
        </a>
      </Link>
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {renderCurrentWeather()}
      {renderForecast()}
    </div>
  );
};

export default Home;
