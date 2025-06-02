import express from 'express';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// File setup helpers for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// GET * => return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /api/weather/history => read and return saved cities
app.get('/api/weather/history', async (req, res) => {
  try {
    const data = await fs.readFile('./searchHistory.json', 'utf-8');
    const cities = JSON.parse(data);
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read search history.' });
  }
});

// POST /api/weather => receive city name, save it, fetch weather data
app.post('/api/weather', async (req, res) => {
  const { city } = req.body;
  if (!city) return res.status(400).json({ error: 'City name is required.' });

  try {
    // Get coordinates from city name
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    const geoData = await geoResponse.json();

    if (!geoData.length) {
      return res.status(404).json({ error: 'City not found.' });
    }

    const { lat, lon, name } = geoData[0];

    // Get weather data using coordinates
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherResponse.json();

    // Save city to searchHistory.json
    const newCity = {
      id: uuidv4(),
      city: name,
      lat,
      lon,
      timestamp: new Date().toISOString()
    };

    const historyRaw = await fs.readFile('./searchHistory.json', 'utf-8');
    const history = JSON.parse(historyRaw);
    history.push(newCity);

    await fs.writeFile('./searchHistory.json', JSON.stringify(history, null, 2));

    // Send weather data to client
    res.json({
      city: name,
      forecast: weatherData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather or save city.' });
  }
});

// DELETE /api/weather/history/:id => delete city by ID
app.delete('/api/weather/history/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const data = await fs.readFile('./searchHistory.json', 'utf-8');
    let cities = JSON.parse(data);

    const initialLength = cities.length;
    cities = cities.filter(city => city.id !== id);

    if (cities.length === initialLength) {
      return res.status(404).json({ error: 'City not found.' });
    }

    await fs.writeFile('./searchHistory.json', JSON.stringify(cities, null, 2));
    res.json({ message: 'City deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete city.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
