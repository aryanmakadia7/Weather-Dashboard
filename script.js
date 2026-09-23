/* =========================================================
   WEATHER DASHBOARD - COMPLETE SCRIPT
   Uses secure Vercel backend:
   /api/weather?city=Pune

   No API key is used in this frontend file.
========================================================= */


/* =========================================================
   HTML ELEMENTS
========================================================= */

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


/* =========================================================
   CHECK REQUIRED ELEMENTS
========================================================= */

if (
    !cityInput ||
    !searchBtn ||
    !cityName ||
    !weatherIcon ||
    !temperature ||
    !weatherCondition ||
    !humidity ||
    !windSpeed ||
    !feelsLike ||
    !sunrise ||
    !sunset ||
    !visibility ||
    !pressure ||
    !cloudiness ||
    !forecastContainer ||
    !hourlyContainer ||
    !recentSearches ||
    !clearHistoryBtn ||
    !darkModeBtn ||
    !statusMessage
) {
    console.error(
        "One or more HTML elements are missing."
    );
}


/* =========================================================
   SEARCH BUTTON
========================================================= */

searchBtn.addEventListener(
    "click",
    getWeather
);


/* =========================================================
   ENTER KEY SEARCH
========================================================= */

cityInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            getWeather();
        }

    }
);


/* =========================================================
   GET WEATHER
========================================================= */

async function getWeather() {

    const city =
        cityInput.value.trim();


    /* -------------------------
       VALIDATE CITY
    ------------------------- */

    if (!city) {

        showStatus(
            "Please enter a city name."
        );

        return;
    }


    /* -------------------------
       LOADING
    ------------------------- */

    showStatus(
        "Loading weather..."
    );


    try {

        /* =================================================
           CALL SECURE VERCEL BACKEND
        ================================================= */

        const response =
            await fetch(
                `/api/weather?city=${encodeURIComponent(city)}`
            );


        /* =================================================
           READ RESPONSE
        ================================================= */

        const data =
            await response.json();


        /* =================================================
           CHECK ERROR
        ================================================= */

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to fetch weather."
            );
        }


        /* =================================================
           VALIDATE DATA
        ================================================= */

        if (
            !data.current ||
            !data.daily ||
            !data.hourly
        ) {

            throw new Error(
                "Weather data is incomplete."
            );
        }


        /* =================================================
           DISPLAY CURRENT WEATHER
        ================================================= */

        displayCurrentWeather(data);


        /* =================================================
           DISPLAY 5 FUTURE DAYS
        ================================================= */

        displayFiveDayForecast(data);


        /* =================================================
           DISPLAY NEXT 8 HOURS
        ================================================= */

        displayHourlyForecast(data);


        /* =================================================
           RECENT SEARCH
        ================================================= */

        saveRecentSearch(
            data.city
        );

        displayRecentSearches();


        /* =================================================
           REMOVE STATUS MESSAGE
        ================================================= */

        showStatus("");

    }

    catch (error) {

        console.error(
            "Weather Error:",
            error
        );


        showStatus(
            `Error: ${error.message}`
        );

    }
}


/* =========================================================
   DISPLAY CURRENT WEATHER
========================================================= */

function displayCurrentWeather(data) {

    const current =
        data.current;


    /* =================================================
       CITY
    ================================================= */

    cityName.textContent =
        data.country
            ? `${data.city}, ${data.country}`
            : data.city;


    /* =================================================
       TEMPERATURE
    ================================================= */

    temperature.textContent =
        `${Math.round(current.temperature_2m)}°C`;


    /* =================================================
       WEATHER CONDITION
    ================================================= */

    weatherCondition.textContent =
        getWeatherDescription(
            current.weather_code
        );


    /* =================================================
       CURRENT WEATHER ICON

       Clear sky:
       Day   = ☀️
       Night = 🌙

       Other weather conditions stay the same.
    ================================================= */

    const currentIsNight =
        isCurrentNight(data);

    weatherIcon.textContent =
        getWeatherIcon(
            convertWeatherCode(
                current.weather_code
            ),
            currentIsNight
        );


    /* =================================================
       HUMIDITY
    ================================================= */

    humidity.textContent =
        `${Math.round(
            current.relative_humidity_2m
        )}%`;


    /* =================================================
       WIND SPEED

       Open-Meteo gives km/h because
       wind_speed_unit is not changed.
    ================================================= */

    windSpeed.textContent =
        `${Math.round(
            current.wind_speed_10m
        )} km/h`;


    /* =================================================
       FEELS LIKE
    ================================================= */

    feelsLike.textContent =
        `${Math.round(
            current.apparent_temperature
        )}°C`;


    /* =================================================
       SUNRISE
    ================================================= */

    if (
        data.daily &&
        data.daily.sunrise &&
        data.daily.sunrise.length > 0
    ) {

        sunrise.textContent =
            formatOpenMeteoTime(
                data.daily.sunrise[0]
            );

    }
    else {

        sunrise.textContent =
            "--";

    }


    /* =================================================
       SUNSET
    ================================================= */

    if (
        data.daily &&
        data.daily.sunset &&
        data.daily.sunset.length > 0
    ) {

        sunset.textContent =
            formatOpenMeteoTime(
                data.daily.sunset[0]
            );

    }
    else {

        sunset.textContent =
            "--";

    }


    /* =================================================
       VISIBILITY
    ================================================= */

    if (
        typeof current.visibility === "number"
    ) {

        visibility.textContent =
            `${(
                current.visibility / 1000
            ).toFixed(1)} km`;

    }
    else {

        visibility.textContent =
            "-- km";

    }


    /* =================================================
       PRESSURE
    ================================================= */

    pressure.textContent =
        `${Math.round(
            current.surface_pressure
        )} hPa`;


    /* =================================================
       CLOUDINESS
    ================================================= */

    cloudiness.textContent =
        `${Math.round(
            current.cloud_cover
        )}%`;

}


/* =========================================================
   DETERMINE CURRENT DAY/NIGHT

   Uses the selected city's local sunrise/sunset,
   NOT the user's computer timezone.
========================================================= */

function isCurrentNight(data) {

    if (
        !data.daily ||
        !data.daily.sunrise ||
        !data.daily.sunset ||
        !data.current ||
        !data.current.time
    ) {

        return false;

    }


    const currentTime =
        data.current.time;

    const sunriseTime =
        data.daily.sunrise[0];

    const sunsetTime =
        data.daily.sunset[0];


    if (
        !sunriseTime ||
        !sunsetTime
    ) {

        return false;

    }


    /*
       Open-Meteo returns local time when
       timezone=auto is used.

       Example:

       2026-09-23T06:15
       2026-09-23T18:25
    */

    return (
        currentTime < sunriseTime ||
        currentTime >= sunsetTime
    );

}


/* =========================================================
   DISPLAY 5 FUTURE DAYS
========================================================= */

function displayFiveDayForecast(data) {

    forecastContainer.innerHTML = "";


    if (
        !data.daily ||
        !data.daily.time
    ) {

        forecastContainer.innerHTML =
            "<p>No forecast available.</p>";

        return;

    }


    const daily =
        data.daily;


    /*
       IMPORTANT

       daily[0] = TODAY

       daily[1] = TOMORROW
       daily[2] = DAY 2
       daily[3] = DAY 3
       daily[4] = DAY 4
       daily[5] = DAY 5

       We SKIP daily[0].

       Therefore exactly 5 future days
       are displayed.
    */


    const futureDays = [];


    for (
        let i = 1;
        i <= 5 &&
        i < daily.time.length;
        i++
    ) {

        futureDays.push({

            date:
                daily.time[i],

            min:
                daily.temperature_2m_min[i],

            max:
                daily.temperature_2m_max[i],

            weatherCode:
                daily.weather_code[i],

            sunrise:
                daily.sunrise
                    ? daily.sunrise[i]
                    : null,

            sunset:
                daily.sunset
                    ? daily.sunset[i]
                    : null

        });

    }


    /* =================================================
       DISPLAY CARDS
    ================================================= */

    futureDays.forEach(
        function (day) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "forecast-card";


            /* -------------------------
               DATE
            ------------------------- */

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


            /* =================================================
               DAY/NIGHT ICON FOR FORECAST

               We use midday for the 5-day card.
               Therefore clear weather normally uses ☀️.

               The current/hourly sections handle actual
               nighttime separately.
            ================================================= */

            const icon =
                getWeatherIcon(
                    convertWeatherCode(
                        day.weatherCode
                    ),
                    false
                );


            card.innerHTML = `

                <div class="forecast-day">
                    ${dayName}
                </div>

                <div class="forecast-icon">
                    ${icon}
                </div>

                <div class="forecast-max">
                    ${Math.round(day.max)}°C
                </div>

                <div class="forecast-min">
                    Min ${Math.round(day.min)}°C
                </div>

            `;


            forecastContainer.appendChild(
                card
            );

        }
    );


    if (
        futureDays.length === 0
    ) {

        forecastContainer.innerHTML =
            "<p>No forecast available.</p>";

    }

}


/* =========================================================
   DISPLAY HOURLY FORECAST
========================================================= */

function displayHourlyForecast(data) {

    hourlyContainer.innerHTML = "";


    if (
        !data.hourly ||
        !data.hourly.time ||
        !data.hourly.temperature_2m ||
        !data.hourly.weather_code
    ) {

        hourlyContainer.innerHTML =
            "<p>No hourly forecast available.</p>";

        return;

    }


    const hourly =
        data.hourly;


    /* =================================================
       FIND CURRENT HOUR

       Open-Meteo's timezone=auto means its
       time values are for the selected city.

       We therefore compare the strings directly.
    ================================================= */

    const currentTime =
        data.current &&
        data.current.time
            ? data.current.time
            : "";


    const currentHour =
        currentTime.substring(
            0,
            13
        );


    let startIndex = 0;


    for (
        let i = 0;
        i < hourly.time.length;
        i++
    ) {

        const hour =
            hourly.time[i].substring(
                0,
                13
            );


        if (
            hour >= currentHour
        ) {

            startIndex = i;

            break;

        }

    }


    /* =================================================
       SHOW NEXT 8 HOURS
    ================================================= */

    const endIndex =
        Math.min(
            startIndex + 8,
            hourly.time.length
        );


    for (
        let i = startIndex;
        i < endIndex;
        i++
    ) {

        const time =
            hourly.time[i];


        const temperatureValue =
            hourly.temperature_2m[i];


        const weatherCode =
            hourly.weather_code[i];


        /* =================================================
           DETERMINE WHETHER THIS HOURLY CARD IS NIGHT
        ================================================= */

        const night =
            isHourlyNight(
                data,
                time
            );


        const condition =
            convertWeatherCode(
                weatherCode
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "hourly-card";


        card.innerHTML = `

            <div class="hourly-time">
                ${formatOpenMeteoTime(time)}
            </div>

            <div class="hourly-icon">
                ${getWeatherIcon(
                    condition,
                    night
                )}
            </div>

            <div class="hourly-temp">
                ${Math.round(
                    temperatureValue
                )}°C
            </div>

            <div class="hourly-condition">
                ${getWeatherDescription(
                    weatherCode
                )}
            </div>

        `;


        hourlyContainer.appendChild(
            card
        );

    }


    if (
        hourlyContainer.children.length === 0
    ) {

        hourlyContainer.innerHTML =
            "<p>No hourly forecast available.</p>";

    }

}


/* =========================================================
   CHECK IF HOURLY TIME IS NIGHT
========================================================= */

function isHourlyNight(
    data,
    hourlyTime
) {

    if (
        !data.daily ||
        !data.daily.time ||
        !data.daily.sunrise ||
        !data.daily.sunset
    ) {

        return false;

    }


    /*
       Find which date the hourly time belongs to.
    */

    const date =
        hourlyTime.substring(
            0,
            10
        );


    const dayIndex =
        data.daily.time.indexOf(
            date
        );


    if (
        dayIndex === -1
    ) {

        return false;

    }


    const sunriseTime =
        data.daily.sunrise[dayIndex];

    const sunsetTime =
        data.daily.sunset[dayIndex];


    if (
        !sunriseTime ||
        !sunsetTime
    ) {

        return false;

    }


    /*
       Clear sky at night = moon.

       For example:

       sunrise = 06:10
       sunset  = 18:25

       01:00 -> night
       05:00 -> night
       07:00 -> day
       15:00 -> day
       20:00 -> night
    */

    return (
        hourlyTime < sunriseTime ||
        hourlyTime >= sunsetTime
    );

}


/* =========================================================
   WEATHER CODE CONVERTER
========================================================= */

function convertWeatherCode(
    code
) {

    /* -------------------------
       CLEAR
    ------------------------- */

    if (code === 0) {

        return "Clear";

    }


    /* -------------------------
       CLOUDS
    ------------------------- */

    if (
        code === 1 ||
        code === 2 ||
        code === 3
    ) {

        return "Clouds";

    }


    /* -------------------------
       FOG
    ------------------------- */

    if (
        code === 45 ||
        code === 48
    ) {

        return "Mist";

    }


    /* -------------------------
       DRIZZLE
    ------------------------- */

    if (
        code === 51 ||
        code === 53 ||
        code === 55 ||
        code === 56 ||
        code === 57
    ) {

        return "Drizzle";

    }


    /* -------------------------
       RAIN
    ------------------------- */

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


    /* -------------------------
       SNOW
    ------------------------- */

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


    /* -------------------------
       THUNDERSTORM
    ------------------------- */

    if (
        code === 95 ||
        code === 96 ||
        code === 99
    ) {

        return "Thunderstorm";

    }


    return "Clouds";

}


/* =========================================================
   WEATHER DESCRIPTION
========================================================= */

function getWeatherDescription(
    code
) {

    if (code === 0) {
        return "Clear sky";
    }

    if (code === 1) {
        return "Mainly clear";
    }

    if (code === 2) {
        return "Partly cloudy";
    }

    if (code === 3) {
        return "Overcast";
    }

    if (
        code === 45 ||
        code === 48
    ) {
        return "Foggy";
    }

    if (
        code >= 51 &&
        code <= 57
    ) {
        return "Drizzle";
    }

    if (
        code >= 61 &&
        code <= 67
    ) {
        return "Rain";
    }

    if (
        code >= 71 &&
        code <= 77
    ) {
        return "Snow";
    }

    if (
        code >= 80 &&
        code <= 82
    ) {
        return "Rain showers";
    }

    if (
        code >= 95 &&
        code <= 99
    ) {
        return "Thunderstorm";
    }

    return "Cloudy";

}


/* =========================================================
   WEATHER ICONS
========================================================= */

function getWeatherIcon(
    condition,
    isNight = false
) {

    switch (condition) {

        /* -------------------------
           CLEAR
        ------------------------- */

        case "Clear":

            if (isNight) {

                return "🌙";

            }

            return "☀️";


        /* -------------------------
           CLOUDS
        ------------------------- */

        case "Clouds":

            return "☁️";


        /* -------------------------
           RAIN
        ------------------------- */

        case "Rain":

            return "🌧️";


        /* -------------------------
           DRIZZLE
        ------------------------- */

        case "Drizzle":

            return "🌦️";


        /* -------------------------
           THUNDERSTORM
        ------------------------- */

        case "Thunderstorm":

            return "⛈️";


        /* -------------------------
           SNOW
        ------------------------- */

        case "Snow":

            return "❄️";


        /* -------------------------
           MIST / FOG
        ------------------------- */

        case "Mist":
        case "Fog":
        case "Haze":
        case "Smoke":
        case "Dust":
        case "Sand":
        case "Ash":

            return "🌫️";


        /* -------------------------
           SQUALL
        ------------------------- */

        case "Squall":

            return "💨";


        /* -------------------------
           TORNADO
        ------------------------- */

        case "Tornado":

            return "🌪️";


        /* -------------------------
           DEFAULT
        ------------------------- */

        default:

            return isNight
                ? "🌙"
                : "🌤️";

    }

}


/* =========================================================
   FORMAT OPEN-METEO TIME
========================================================= */

function formatOpenMeteoTime(
    dateTime
) {

    if (
        !dateTime
    ) {

        return "--";

    }


    /*
       Example:

       2026-09-23T18:30

       becomes:

       06:30 PM
    */


    const timePart =
        dateTime.substring(
            11,
            16
        );


    if (
        !timePart
    ) {

        return "--";

    }


    const parts =
        timePart.split(":");


    let hour =
        parseInt(
            parts[0],
            10
        );


    const minute =
        parts[1];


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    if (hour === 0) {

        hour = 12;

    }
    else if (hour > 12) {

        hour -= 12;

    }


    return `${String(hour).padStart(2, "0")}:${minute} ${period}`;

}


/* =========================================================
   STATUS MESSAGE
========================================================= */

function showStatus(
    message
) {

    statusMessage.textContent =
        message;

}


/* =========================================================
   RECENT SEARCHES
========================================================= */

function saveRecentSearch(
    city
) {

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
                    item.toLowerCase()
                    !== city.toLowerCase()
                );

            }
        );


    /* Add latest city first */

    searches.unshift(
        city
    );


    /* Keep maximum 5 */

    searches =
        searches.slice(
            0,
            5
        );


    localStorage.setItem(
        "weatherSearches",
        JSON.stringify(searches)
    );

}


/* =========================================================
   DISPLAY RECENT SEARCHES
========================================================= */

function displayRecentSearches() {

    let searches =
        JSON.parse(
            localStorage.getItem(
                "weatherSearches"
            )
        ) || [];


    recentSearches.innerHTML =
        "";


    if (
        searches.length === 0
    ) {

        recentSearches.innerHTML =
            "<p>No recent searches yet.</p>";

        return;

    }


    searches.forEach(
        function (city) {

            const button =
                document.createElement(
                    "button"
                );


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


/* =========================================================
   CLEAR RECENT SEARCHES
========================================================= */

clearHistoryBtn.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "weatherSearches"
        );


        displayRecentSearches();

    }
);


/* =========================================================
   DARK MODE
========================================================= */

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


/* =========================================================
   DARK MODE BUTTON
========================================================= */

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


/* =========================================================
   LOAD DARK MODE
========================================================= */

function loadDarkMode() {

    const darkMode =
        localStorage.getItem(
            "darkMode"
        );


    if (
        darkMode === "true"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }


    updateDarkModeButton();

}


/* =========================================================
   INITIALIZE
========================================================= */

displayRecentSearches();

loadDarkMode();