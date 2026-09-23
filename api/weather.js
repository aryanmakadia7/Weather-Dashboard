export default async function handler(req, res) {

    try {

        const city = req.query.city;

        if (!city) {
            return res.status(400).json({
                error: "City is required"
            });
        }

        const API_KEY =
            process.env.OPENWEATHER_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({
                error: "API key is not configured"
            });
        }

        const url =
            `https://api.openweathermap.org/data/2.5/weather` +
            `?q=${encodeURIComponent(city)}` +
            `&units=metric` +
            `&appid=${API_KEY}`;

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.message || "Weather request failed"
            });
        }

        return res.status(200).json(data);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Server error"
        });

    }

}