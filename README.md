# 🌦️ Full Stack Weather App

This is a full-stack weather application built using **Next.js**, **TypeScript**, **Tailwind CSS** on the frontend and **Python**, **FastAPI**, **MongoDB**, and **Uvicorn** on the backend. It allows users to search for current weather and a 5-day forecast using city names, ZIP/postal codes, or latitude/longitude coordinates. The application features Google Maps integration, fuzzy search, and historical weather record storage.

---

## 📁 Project Structure
├── .gitignore
├── README.md
├── backend
    ├── database.py
    ├── main.py
    ├── models.py
    └── requirements.txt
└── my-app
    ├── .gitignore
    ├── README.md
    ├── eslint.config.mjs
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── public
        ├── file.svg
        ├── globe.svg
        ├── next.svg
        ├── vercel.svg
        └── window.svg
    ├── src
        └── app
        │   ├── favicon.ico
        │   ├── globals.css
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── records
        │       └── page.tsx
    └── tsconfig.json

---

## ⚙️ Features

- 🌐 **Fuzzy Location Search**: Suggests matching cities/locations as the user types using OpenWeather API.
- 📍 **Supports city names, ZIP/postal codes, and coordinates**
- ☀️ **Displays real-time weather and 5-day forecast**
- 🗺️ **Google Maps integration with embedded location view**
- 💾 **MongoDB database for storing weather records**
- 📤 **CSV export for historical data**
- 📌 **Current location weather support using browser geolocation**
- 🔍 **Weather search with autosuggestions**
- 📈 **Responsive design styled with Tailwind CSS**

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/weather-app.git
cd weather-app
```

## 🖥️ Frontend Setup (Next.js + Tailwind)

### 2. Navigate to the frontend directory and install dependencies

```bash
cd my-app
npm install
```

### 3. Run the frontend

```bash
npm run dev
```

App will run on http://localhost:3000

## 🧠 Backend Setup (FastAPI + MongoDB)

### 4. Navigate to the backend directory

```bash
cd ../backend
```

### 5. Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate   # On Windows use: venv\Scripts\activate
```

### 6. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 7. Set up .env file in the backend folder

```bash
OPENWEATHERMAP_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_embed_api_key
MONGODB_URL=mongodb://localhost:27017
```

🔐 You can get a free API key for OpenWeatherMap and Google Maps Embed API.

### 8. Start the backend server

```bash
uvicorn main:app --reload --port 8000
```

Server will run on http://localhost:8000

## 🛠️ MongoDB Setup

Ensure that MongoDB is installed and running locally on your system.

Install MongoDB from: https://www.mongodb.com/try/download/community

Default connection string is used: mongodb://localhost:27017

Make sure MongoDB service is running before starting the backend.

## 🧪 API Endpoints

Method	Endpoint	Description

POST	/weather	Get weather and store to MongoDB

GET	/weather	Fetch all saved weather records

PUT	/weather/{id}	Update a saved weather record

DELETE	/weather/{id}	Delete a record from the database

GET	/search?query=	Fuzzy search for locations

GET	/export/csv	Export records as CSV file

## 👨‍💻 Developer Info

This application was developed as part of a technical assessment to demonstrate full-stack development skills using modern technologies.

Feel free to explore, fork, or contribute!
