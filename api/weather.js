export default async function handler(req, res) {

    try {

        /* ------------------------- */
        /* GET CITY FROM REQUEST */
        /* ------------------------- */

        const city = req.query.city;


        if (!city) {

            return res.status(400).json({

                error: "City is required"

            });

        }


        /* ------------------------- */
        /* GET API KEY FROM VERCEL */
        /* ------------------------- */

        const API_KEY =
            process.env.OPENWEATHER_API_KEY;


        if (!API_KEY) {

            return res.status(500).json({

                error: "OpenWeather API key is not configured"

            });

        }


        /* ------------------------- */
        /* OPENWEATHER REQUEST */
        /* ------------------------- */

        const url =
            `https://api.openweathermap.org/data/2.5/weather` +
            `?q=${encodeURIComponent(city)}` +
            `&units=metric` +
            `&appid=${API_KEY}`;


        const response =
            await fetch(url);


        const data =
            await response.json();


        /* ------------------------- */
        /* RETURN ERROR */
        /* ------------------------- */

        if (!response.ok) {

            return res.status(response.status).json({

                error:
                    data.message ||
                    "Weather request failed"

            });

        }


        /* ------------------------- */
        /* RETURN WEATHER */
        /* ------------------------- */

        return res.status(200).json(data);

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            error: "Server error"

        });

    }

}