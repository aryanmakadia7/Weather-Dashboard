export default async function handler(req, res) {
    try {
        /* ================================
           GET & VALIDATE CITY
        ================================= */
        const city = req.query.city;

        if (!city || typeof city !== "string" || !city.trim()) {
            return res.status(400).json({
                error: "City name is required"
            });
        }

        /* ================================
           GEOCODING (CITY TO COORDS)
        ================================= */
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`;
        
        const geoResponse = await fetch(geoURL);
        const geoData = await geoResponse.json();

        if (!geoResponse.ok || !geoData.results || geoData.results.length === 0) {
            return res.status(404).json({
                error: `City "${city}" not found`
            });
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country } = location;

        /* ================================
           OPEN-METEO WEATHER FORECAST
        ================================= */
        // Note: forecast_days is set to 7 to guarantee 5 future days
        // Note: hourly includes visibility as a fallback
        const weatherURL =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,surface_pressure,visibility,wind_speed_10m` +
            `&hourly=temperature_2m,weather_code,visibility` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=auto` +
            `&forecast_days=7`;

        const weatherResponse = await fetch(weatherURL);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            return res.status(502).json({
                error: "Failed to fetch weather data from upstream provider"
            });
        }

        /* ================================
           CACHE & RESPONSE
        ================================= */
        // Cache at edge for 10 minutes (600s), revalidate in background up to 5 minutes (300s)
        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");

        return res.status(200).json({
            city: name,
            country: country || "",
            latitude,
            longitude,
            timezone: weatherData.timezone,
            current: weatherData.current,
            hourly: weatherData.hourly,
            daily: weatherData.daily
        });

    } catch (error) {
        console.error("Weather API Error:", error);

        return res.status(500).json({
            error: "An internal error occurred while processing the weather request."
        });
    }
}