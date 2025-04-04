'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WeatherRecord {
  id: string;
  location: string;
  date_range: {
    start: string;
    end: string;
  };
  weather_data: any;
  youtube_videos: string[];
  google_map_url: string;
}

const RecordsPage: React.FC = () => {
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [editRecord, setEditRecord] = useState<WeatherRecord | null>(null);
  const [updatedLocation, setUpdatedLocation] = useState<string>('');

  // Fetch all weather records from the backend
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:8000/weather');
      if (!res.ok) {
        throw new Error('Failed to fetch records');
      }
      const data: WeatherRecord[] = await res.json();
      setRecords(data);
    } catch (err: any) {
      console.log("Fetched records:", records);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:8000/weather");
      const data = await res.json();
      console.log("Fetched records:", data);
      // Expect each record to have `id: "someObjectId"`
      setRecords(data);
    })();
  }, []);

  // Delete a record by its id
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/weather/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete record');
      }
      // Refresh the records after deletion
      fetchRecords();
    } catch (err: any) {
      console.log("Fetched records:", records);
      setError(err.message);
    }
  };

  // Set up the record to be edited
  const handleEdit = (record: WeatherRecord) => {
    setEditRecord(record);
    setUpdatedLocation(record.location);
  };

  const handleDownloadCSV = async () => {
    const response = await fetch('http://localhost:8000/export/csv');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weather.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Update a record, updates location only for now
  const handleUpdate = async (id: string) => {
    try {
      const body = {
        location: updatedLocation,
        date_range: editRecord?.date_range,
      };
      const res = await fetch(`http://localhost:8000/weather/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error('Failed to update record');
      }
      setEditRecord(null);
      fetchRecords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Weather Records</h1>

      <Link href="/" className="block w-full text-center mb-4 p-2 bg-blue-500 text-white rounded">
        Back to Home
      </Link>

      {loading && <p className="text-center">Loading records...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <ul className="space-y-4">
        {records.map((record) => {
          // Compute the same weather info you show on the home page
          let tempInFahrenheit: number | null = null;
          let tempInCelsius: number | null = null;
          let windSpeedInMph: number | null = null;
          let windSpeedInKmh: number | null = null;

          const mainData = record.weather_data?.main;
          const windData = record.weather_data?.wind;
          const weatherArr = record.weather_data?.weather;

          if (mainData) {
            tempInFahrenheit = Math.round(mainData.temp);
            if (typeof tempInFahrenheit === 'number') {
              tempInCelsius = Math.round((tempInFahrenheit - 32) * (5 / 9));
            }
          }
          if (windData) {
            // If using imperial units, wind speed is in mph
            windSpeedInMph = Math.round(windData.speed);
            if (typeof windSpeedInMph === 'number') {
              windSpeedInKmh = Math.round(windSpeedInMph * 1.60934);
            }
          }

          const humidity = mainData?.humidity;
          const weatherIcon = weatherArr?.[0]?.icon;
          const description = weatherArr?.[0]?.description;
          const iconUrl = weatherIcon
            ? `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`
            : null;

          return (
            <li
              key={record.id}
              className="border p-4 rounded flex flex-col gap-2 md:flex-row md:justify-between md:items-center"
            >
              <div>
                <h2 className="font-bold mb-2">Location: {record.location}</h2>
                <p>
                  Date Range: {record.date_range.start} to {record.date_range.end}
                </p>

                {/* Display the same info from the home page */}
                <div className="mt-2">
                  <p className="font-semibold">
                    Temperature: {tempInCelsius} °C | {tempInFahrenheit} °F
                  </p>
                  <p>Humidity: {humidity} %</p>
                  <p>
                    Wind: {windSpeedInKmh} km/h | {windSpeedInMph} mph
                  </p>
                  {iconUrl && (
                    <img src={iconUrl} alt={description} className="w-16 h-16 mt-2" />
                  )}
                  <p className="italic">{description}</p>
                </div>
              </div>

              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => handleEdit(record)}
                  className="p-2 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-2 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Edit Form */}
      {editRecord && (
        <div className="mt-8 border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Edit Record</h2>
          <label className="block mb-2">
            Location:
            <input
              type="text"
              value={updatedLocation}
              onChange={(e) => setUpdatedLocation(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleUpdate(editRecord.id)}
              className="p-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditRecord(null)}
              className="p-2 bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleDownloadCSV}
        className="mb-4 px-4 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600"
      >
        Download All Records (CSV)
      </button>
    </div>
  );
};

export default RecordsPage;