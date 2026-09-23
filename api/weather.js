export default async function handler(req, res) {
    try {
        /* =================================
           GET & VALIDATE CITY
        ================================= */

        const city = req.query.city;

        if (!city || typeof city !== "string" || !city.trim()) {
            return res.status(400).json({
                error: "City name is required"
            });
        }

        /* =================================
           GEOCODING
           CITY → LATITUDE / LONGITUDE
        ================================= */

        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search` +
            `?name=${encodeURIComponent(city.trim())}` +
            `&count=1` +
            `&language=en` +
            `&format=json`;

        const geoResponse = await fetch(geoURL);
        const geoData = await geoResponse.json();

        if (
            !geoResponse.ok ||
            !geoData.results ||
            geoData.results.length === 0
        ) {
            return res.status(404).json({
                error: `City "${city}" not found`
            });
        }

        const location = geoData.results[0];

        const {
            latitude,
            longitude,
            name,
            country
        } = location;

        /* =================================
           OPEN-METEO WEATHER API
        ================================= */

        const weatherURL =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +

            /* CURRENT WEATHER */
            `&current=` +
            `temperature_2m,` +
            `relative_humidity_2m,` +
            `apparent_temperature,` +
            `weather_code,` +
            `cloud_cover,` +
            `surface_pressure,` +
            `visibility,` +
            `wind_speed_10m,` +
            `is_day` +

            /* HOURLY WEATHER */
            `&hourly=` +
            `temperature_2m,` +
            `weather_code,` +
            `visibility` +

            /* DAILY WEATHER */
            `&daily=` +
            `weather_code,` +
            `temperature_2m_max,` +
            `temperature_2m_min,` +
            `sunrise,` +
            `sunset` +

            /* AUTOMATIC LOCAL TIMEZONE */
            `&timezone=auto` +

            /* GET ENOUGH DAYS FOR 5 FUTURE DAYS */
            `&forecast_days=7`;

        const weatherResponse = await fetch(weatherURL);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            console.error("Open-Meteo error:", weatherData);

            return res.status(502).json({
                error: "Failed to fetch weather data"
            });
        }

        /* =================================
           CACHE RESPONSE
        ================================= */

        res.setHeader(
            "Cache-Control",
            "s-maxage=600, stale-while-revalidate=300"
        );

        /* =================================
           SEND DATA TO FRONTEND
        ================================= */

        return res.status(200).json({
            city: name,
            country: country || "",
            latitude: latitude,
            longitude: longitude,

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