export default async function handler(req, res) {

    try {

        /* ================================
           GET CITY
        ================================= */

        const city = req.query.city;

        if (!city) {
            return res.status(400).json({
                error: "City is required"
            });
        }


        /* ================================
           GET CITY COORDINATES
        ================================= */

        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse =
            await fetch(geoURL);

        const geoData =
            await geoResponse.json();


        if (
            !geoResponse.ok ||
            !geoData.results ||
            geoData.results.length === 0
        ) {

            return res.status(404).json({
                error: "City not found"
            });

        }


        const location =
            geoData.results[0];

        const latitude =
            location.latitude;

        const longitude =
            location.longitude;


        /* ================================
           GET WEATHER
        ================================= */

        const weatherURL =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,surface_pressure,visibility,wind_speed_10m` +
            `&hourly=temperature_2m,weather_code` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=auto` +
            `&forecast_days=6`;


        const weatherResponse =
            await fetch(weatherURL);

        const weatherData =
            await weatherResponse.json();


        if (!weatherResponse.ok) {

            return res.status(500).json({
                error: "Weather data unavailable"
            });

        }


        /* ================================
           RETURN COMPLETE DATA
        ================================= */

        return res.status(200).json({

            city:
                location.name,

            country:
                location.country,

            latitude:
                latitude,

            longitude:
                longitude,

            timezone:
                weatherData.timezone,

            current:
                weatherData.current,

            hourly:
                weatherData.hourly,

            daily:
                weatherData.daily

        });

    }

    catch (error) {

        console.error(
            "Weather API Error:",
            error
        );

        return res.status(500).json({

            error:
                "Unable to fetch weather data"

        });

    }

}