/* ================================= */
/* API KEY */
/* ================================= */

/*
   Your config.js should contain:

   const API_KEY = "YOUR_API_KEY";

   Do not put your real API key directly on GitHub.
*/


/* ================================= */
/* HTML ELEMENTS */
/* ================================= */

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const visibility = document.getElementById("visibility");
const pressure = document.getElementById("pressure");
const cloudiness = document.getElementById("cloudiness");

const forecastContainer =
    document.getElementById("forecastContainer");

const hourlyContainer =
    document.getElementById("hourlyContainer");

const recentSearches =
    document.getElementById("recentSearches");

const clearHistoryBtn =
    document.getElementById("clearHistoryBtn");

const darkModeBtn =
    document.getElementById("darkModeBtn");

const statusMessage =
    document.getElementById("statusMessage");


/* ================================= */
/* SEARCH */
/* ================================= */

searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keypress", function (event) {

    if (event.key === "Enter") {
        getWeather();
    }

});


/* ================================= */
/* GET WEATHER */
/* ================================= */

async function getWeather() {

    const city = cityInput.value.trim();

    if (city === "") {

        showStatus("Please enter a city name.");

        return;
    }

    showStatus("Loading weather...");

    try {

        /* ------------------------- */
        /* CURRENT WEATHER */
        /* ------------------------- */

        const weatherURL =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

        const weatherResponse =
            await fetch(weatherURL);

        const weatherData =
            await weatherResponse.json();

        if (!weatherResponse.ok) {

            throw new Error(
                weatherData.message ||
                "City not found"
            );

        }


        /* ------------------------- */
        /* DISPLAY CURRENT WEATHER */
        /* ------------------------- */

        displayCurrentWeather(weatherData);


        /* ------------------------- */
        /* FORECAST */
        /* ------------------------- */

        await getForecast(city);


        /* ------------------------- */
        /* RECENT SEARCH */
        /* ------------------------- */

        saveRecentSearch(weatherData.name);

        displayRecentSearches();

        showStatus("");

    }

    catch (error) {

        console.error(error);

        showStatus(`Error: ${error.message}`);

    }

}


/* ================================= */
/* CURRENT WEATHER */
/* ================================= */

function displayCurrentWeather(data) {

    cityName.textContent =
        `${data.name}, ${data.sys.country}`;

    temperature.textContent =
        `${Math.round(data.main.temp)}°C`;

    weatherCondition.textContent =
        data.weather[0].description;

    weatherIcon.textContent =
        getWeatherIcon(data.weather[0].main);

    humidity.textContent =
        `${data.main.humidity}%`;

    windSpeed.textContent =
        `${(data.wind.speed * 3.6).toFixed(1)} km/h`;

    feelsLike.textContent =
        `${Math.round(data.main.feels_like)}°C`;


    /* Sunrise */

    sunrise.textContent =
        formatTime(
            data.sys.sunrise,
            data.timezone
        );


    /* Sunset */

    sunset.textContent =
        formatTime(
            data.sys.sunset,
            data.timezone
        );


    /* Visibility */

    visibility.textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;


    /* Pressure */

    pressure.textContent =
        `${data.main.pressure} hPa`;


    /* Cloudiness */

    cloudiness.textContent =
        `${data.clouds.all}%`;

}


/* ================================= */
/* GET FORECAST */
/* ================================= */

async function getForecast(city) {

    try {

        /* ------------------------- */
        /* GET CITY COORDINATES */
        /* ------------------------- */

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

            throw new Error("Location not found");

        }


        const latitude =
            geoData.results[0].latitude;

        const longitude =
            geoData.results[0].longitude;


        /* ------------------------- */
        /* OPEN-METEO FORECAST */
        /* ------------------------- */

        const forecastURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,pressure_msl,visibility,wind_speed_10m` +
            `&hourly=temperature_2m,weather_code` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=auto&forecast_days=6`;

        const response =
            await fetch(forecastURL);

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error("Forecast unavailable");

        }


        /* ================================= */
        /* 5 FUTURE DAYS */
        /* ================================= */

        const dailyData = [];


        /*
           IMPORTANT:

           daily[0] = TODAY
           daily[1] = TOMORROW
           daily[2] = DAY 2
           daily[3] = DAY 3
           daily[4] = DAY 4
           daily[5] = DAY 5

           Therefore we SKIP daily[0].

           Example:

           Today = Tuesday

           Display:
           Wednesday
           Thursday
           Friday
           Saturday
           Sunday
        */

        for (
            let i = 1;
            i <= 5 &&
            i < data.daily.time.length;
            i++
        ) {

            dailyData.push({

                date:
                    data.daily.time[i],

                min:
                    data.daily.temperature_2m_min[i],

                max:
                    data.daily.temperature_2m_max[i],

                weather: {

                    main:
                        convertWeatherCode(
                            data.daily.weather_code[i]
                        )

                }

            });

        }


        /* Display 5-day forecast */

        displayFiveDayForecast(
            dailyData
        );


        /* ================================= */
        /* HOURLY FORECAST */
        /* ================================= */

        const hourlyData = [];


        /*
           IMPORTANT HOURLY TIME FIX

           Open-Meteo gives the hourly times in
           the city's local timezone because:

           timezone=auto

           We DO NOT use:

           new Date().toISOString()

           because that converts the browser's
           local time into UTC.

           Instead we use Open-Meteo's own
           current local time.
        */

        let currentHourKey;


        if (
            data.current &&
            data.current.time
        ) {

            /*
               Example:

               data.current.time:

               2026-09-22T22:38

               becomes:

               2026-09-22T22
            */

            currentHourKey =
                data.current.time.slice(0, 13);

        }

        else {

            /*
               Backup method
            */

            const now =
                new Date();

            currentHourKey =
                now.getFullYear() +
                "-" +
                String(
                    now.getMonth() + 1
                ).padStart(2, "0") +
                "-" +
                String(
                    now.getDate()
                ).padStart(2, "0") +
                "T" +
                String(
                    now.getHours()
                ).padStart(2, "0");

        }


        /*
           Find the NEXT full hour.

           If current time is:

           10:38 PM

           currentHourKey:

           2026-09-22T22

           We want:

           2026-09-22T23

           Therefore we use > instead of >=.
        */

        let startIndex = -1;


        for (
            let i = 0;
            i < data.hourly.time.length;
            i++
        ) {

            const hourlyKey =
                data.hourly.time[i].slice(0, 13);


            if (
                hourlyKey >
                currentHourKey
            ) {

                startIndex = i;

                break;

            }

        }


        /*
           If something goes wrong,
           start from the first available hour.
        */

        if (startIndex === -1) {

            startIndex = 0;

        }


        /*
           Get next 8 complete hours.
        */

        for (
            let i = startIndex;
            i < startIndex + 8 &&
            i < data.hourly.time.length;
            i++
        ) {

            hourlyData.push({

                time:
                    data.hourly.time[i],

                main: {

                    temp:
                        data.hourly.temperature_2m[i]

                },

                weather: [

                    {

                        main:
                            convertWeatherCode(
                                data.hourly.weather_code[i]
                            ),

                        description:
                            getWeatherDescription(
                                data.hourly.weather_code[i]
                            )

                    }

                ]

            });

        }


        /* Display hourly forecast */

        displayHourlyForecastOpenMeteo(
            hourlyData
        );

    }

    catch (error) {

        console.error(
            "Forecast error:",
            error
        );


        /*
           Forecast failure should NOT
           destroy current weather.
        */

        forecastContainer.innerHTML =
            "<p>Forecast temporarily unavailable.</p>";

        hourlyContainer.innerHTML =
            "<p>Hourly forecast temporarily unavailable.</p>";

    }

}


/* ================================= */
/* DISPLAY 5-DAY FORECAST */
/* ================================= */

function displayFiveDayForecast(days) {

    forecastContainer.innerHTML = "";


    days.forEach(function (day) {

        const card =
            document.createElement("div");

        card.className =
            "forecast-card";


        /*
           Add noon time so the date does not
           shift because of timezone conversion.
        */

        const date =
            new Date(
                `${day.date}T12:00:00`
            );


        const dayName =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );


        card.innerHTML = `

            <div class="forecast-day">
                ${dayName}
            </div>

            <div class="forecast-icon">
                ${getWeatherIcon(
                    day.weather.main
                )}
            </div>

            <div class="forecast-max">
                ${Math.round(
                    day.max
                )}°C
            </div>

            <div class="forecast-min">
                Min ${Math.round(
                    day.min
                )}°C
            </div>

        `;


        forecastContainer.appendChild(
            card
        );

    });


    if (days.length === 0) {

        forecastContainer.innerHTML =
            "<p>No forecast available.</p>";

    }

}


/* ================================= */
/* DISPLAY HOURLY FORECAST */
/* ================================= */

function displayHourlyForecastOpenMeteo(
    forecastList
) {

    hourlyContainer.innerHTML = "";


    forecastList.forEach(
        function (item) {

            const card =
                document.createElement("div");


            card.className =
                "hourly-card";


            /*
               Open-Meteo gives the time
               in the city's local timezone.

               Add T00 handling by treating the
               string as a local-style timestamp.
            */

            const [datePart, timePart] =
                item.time.split("T");


            const [
                hourString,
                minuteString
            ] =
                timePart.split(":");


            let hour =
                parseInt(
                    hourString,
                    10
                );


            const minute =
                minuteString;


            const period =
                hour >= 12
                    ? "PM"
                    : "AM";


            let displayHour =
                hour % 12;


            if (displayHour === 0) {

                displayHour = 12;

            }


            const time =
                `${String(displayHour).padStart(2, "0")}:${minute} ${period}`;


            card.innerHTML = `

                <div class="hourly-time">
                    ${time}
                </div>

                <div class="hourly-icon">
                    ${getWeatherIcon(
                        item.weather[0].main
                    )}
                </div>

                <div class="hourly-temp">
                    ${Math.round(
                        item.main.temp
                    )}°C
                </div>

                <div class="hourly-condition">
                    ${item.weather[0].description}
                </div>

            `;


            hourlyContainer.appendChild(
                card
            );

        }
    );


    if (forecastList.length === 0) {

        hourlyContainer.innerHTML =
            "<p>No hourly forecast available.</p>";

    }

}


/* ================================= */
/* WEATHER CODE CONVERTER */
/* ================================= */

function convertWeatherCode(code) {

    /* Clear */

    if (code === 0) {

        return "Clear";

    }


    /* Mainly clear / cloudy */

    if (
        code === 1 ||
        code === 2 ||
        code === 3
    ) {

        return "Clouds";

    }


    /* Fog */

    if (
        code === 45 ||
        code === 48
    ) {

        return "Mist";

    }


    /* Drizzle */

    if (
        code === 51 ||
        code === 53 ||
        code === 55 ||
        code === 56 ||
        code === 57
    ) {

        return "Drizzle";

    }


    /* Rain */

    if (
        code === 61 ||
        code === 63 ||
        code === 65 ||
        code === 66 ||
        code === 67 ||
        code === 80 ||
        code === 81 ||
        code === 82
    ) {

        return "Rain";

    }


    /* Snow */

    if (
        code === 71 ||
        code === 73 ||
        code === 75 ||
        code === 77 ||
        code === 85 ||
        code === 86
    ) {

        return "Snow";

    }


    /* Thunderstorm */

    if (
        code === 95 ||
        code === 96 ||
        code === 99
    ) {

        return "Thunderstorm";

    }


    return "Clouds";

}


/* ================================= */
/* WEATHER DESCRIPTION */
/* ================================= */

function getWeatherDescription(code) {

    if (code === 0) {

        return "clear sky";

    }


    if (code === 1) {

        return "mainly clear";

    }


    if (code === 2) {

        return "partly cloudy";

    }


    if (code === 3) {

        return "overcast";

    }


    if (
        code === 45 ||
        code === 48
    ) {

        return "foggy";

    }


    if (
        code >= 51 &&
        code <= 57
    ) {

        return "drizzle";

    }


    if (
        code >= 61 &&
        code <= 67
    ) {

        return "rain";

    }


    if (
        code >= 71 &&
        code <= 77
    ) {

        return "snow";

    }


    if (
        code >= 80 &&
        code <= 82
    ) {

        return "rain showers";

    }


    if (code >= 95) {

        return "thunderstorm";

    }


    return "cloudy";

}


/* ================================= */
/* WEATHER ICONS */
/* ================================= */

function getWeatherIcon(condition) {

    switch (condition) {

        case "Clear":

            return "☀️";


        case "Clouds":

            return "☁️";


        case "Rain":

            return "🌧️";


        case "Drizzle":

            return "🌦️";


        case "Thunderstorm":

            return "⛈️";


        case "Snow":

            return "❄️";


        case "Mist":

        case "Fog":

        case "Haze":

        case "Smoke":

        case "Dust":

        case "Sand":

        case "Ash":

            return "🌫️";


        case "Squall":

            return "💨";


        case "Tornado":

            return "🌪️";


        default:

            return "🌤️";

    }

}


/* ================================= */
/* FORMAT TIME */
/* ================================= */

function formatTime(
    timestamp,
    timezoneOffset
) {

    const date =
        new Date(
            (timestamp + timezoneOffset) * 1000
        );


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC"
        }
    );

}


/* ================================= */
/* LOCAL DATE KEY */
/* ================================= */

function getLocalDateKey(
    timestamp,
    timezoneOffset
) {

    const date =
        new Date(
            (timestamp + timezoneOffset) * 1000
        );


    return date
        .toISOString()
        .split("T")[0];

}


/* ================================= */
/* STATUS MESSAGE */
/* ================================= */

function showStatus(message) {

    statusMessage.textContent =
        message;

}


/* ================================= */
/* RECENT SEARCHES */
/* ================================= */

function saveRecentSearch(city) {

    let searches =
        JSON.parse(
            localStorage.getItem(
                "weatherSearches"
            )
        ) || [];


    /* Remove duplicate */

    searches =
        searches.filter(
            function (item) {

                return (
                    item.toLowerCase() !==
                    city.toLowerCase()
                );

            }
        );


    /* Add city at beginning */

    searches.unshift(city);


    /* Keep only 5 */

    searches =
        searches.slice(0, 5);


    localStorage.setItem(
        "weatherSearches",
        JSON.stringify(searches)
    );

}


/* ================================= */
/* DISPLAY RECENT SEARCHES */
/* ================================= */

function displayRecentSearches() {

    let searches =
        JSON.parse(
            localStorage.getItem(
                "weatherSearches"
            )
        ) || [];


    recentSearches.innerHTML = "";


    if (searches.length === 0) {

        recentSearches.innerHTML =
            "<p>No recent searches yet.</p>";

        return;

    }


    searches.forEach(
        function (city) {

            const button =
                document.createElement("button");


            button.className =
                "recent-city";


            button.textContent =
                city;


            button.addEventListener(
                "click",
                function () {

                    cityInput.value =
                        city;

                    getWeather();

                }
            );


            recentSearches.appendChild(
                button
            );

        }
    );

}


/* ================================= */
/* CLEAR RECENT SEARCHES */
/* ================================= */

clearHistoryBtn.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "weatherSearches"
        );

        displayRecentSearches();

    }
);


/* ================================= */
/* DARK MODE */
/* ================================= */

darkModeBtn.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "dark-mode"
        );


        const darkMode =
            document.body.classList.contains(
                "dark-mode"
            );


        localStorage.setItem(
            "darkMode",
            darkMode
        );


        updateDarkModeButton();

    }
);


/* ================================= */
/* DARK MODE BUTTON TEXT */
/* ================================= */

function updateDarkModeButton() {

    const darkMode =
        document.body.classList.contains(
            "dark-mode"
        );


    if (darkMode) {

        darkModeBtn.textContent =
            "☀️ Light Mode";

    }

    else {

        darkModeBtn.textContent =
            "🌙 Dark Mode";

    }

}


/* ================================= */
/* LOAD DARK MODE */
/* ================================= */

function loadDarkMode() {

    const darkMode =
        localStorage.getItem(
            "darkMode"
        );


    if (darkMode === "true") {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateDarkModeButton();

}


/* ================================= */
/* INITIALIZE */
/* ================================= */

displayRecentSearches();

loadDarkMode();