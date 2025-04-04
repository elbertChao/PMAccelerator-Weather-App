'use client';
import { useState } from 'react';
import Link from 'next/link';

const Home: React.FC = () => {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [googleMapUrl, setGoogleMapUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ label: string; location: string }[]>([]);
  const [locationDisplay, setLocationDisplay] = useState('');
  const [locationCoords, setLocationCoords] = useState('');

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

  const fetchSearchResults = async (query: string): Promise<any[]> => {
    try {
      const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search locations");
      return await res.json();
    } catch (err) {
      console.error("Search failed:", err);
      return [];
    }
  };

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
      setGoogleMapUrl(data.google_map_url);
    } catch (err: any) {
      setError(err.message);
      setWeatherData(null);
      setForecastData(null);
      setGoogleMapUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loc = locationCoords || locationDisplay;
    if (!loc) return;
  
    fetchWeather(loc);
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

  // Renders Google Maps iframe if the map URL is present in the weather data
  const renderGoogleMap = () => {
    // console.log("Google Map URL:", googleMapUrl); // DEBUGGING
    if (!googleMapUrl) return null;;

    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">Location Map</h2>
        <div className="w-full h-64">
          <iframe
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={googleMapUrl}
            allowFullScreen
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Weather App</h1>
      <form onSubmit={handleSubmit} className="relative flex mb-4 gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Enter location (city, zip, or lat,lon)"
            value={locationDisplay}
            onChange={async (e) => {
              const value = e.target.value;
              setLocationDisplay(value);
              setLocationCoords(''); // clear until selected

              if (value.length >= 2) {
                const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(value)}`);
                const results = await res.json();
                setSearchResults(results);
              } else {
                setSearchResults([]);
              }
            }}
            className="w-full p-2 border border-white rounded bg-black text-white placeholder-white"
          />
          {searchResults.length > 0 && (
            <ul className="absolute left-0 right-0 z-10 bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
              {searchResults.map((s, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setLocationDisplay(s.label);
                    setLocationCoords(s.location); // actual lat,lon string
                    setSearchResults([]);
                  }}
                  className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 cursor-pointer"
                >
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>
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
      <Link href="/records" legacyBehavior>
        <a className="block text-center p-2 bg-gray-700 text-white rounded">
          View Weather Records
        </a>
      </Link>
      {loading && <p className="text-center">Loading...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}
      {renderCurrentWeather()}
      {renderForecast()}
      {renderGoogleMap()}
    </div>
  );
};

export default Home;
