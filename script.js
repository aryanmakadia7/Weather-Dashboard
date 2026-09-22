/* =========================================================
   WEATHER DASHBOARD - COMPLETE SCRIPT
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_ENDPOINT = "/api/weather";

let currentCity = "";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const cityElement =
    document.getElementById("city");

const temperatureElement =
    document.getElementById("temperature");

const conditionElement =
    document.getElementById("condition");

const weatherIconElement =
    document.getElementById("weatherIcon");

const humidityElement =
    document.getElementById("humidity");

const windElement =
    document.getElementById("wind");

const feelsLikeElement =
    document.getElementById("feelsLike");

const sunriseElement =
    document.getElementById("sunrise");

const sunsetElement =
    document.getElementById("sunset");

const visibilityElement =
    document.getElementById("visibility");

const pressureElement =
    document.getElementById("pressure");

const cloudinessElement =
    document.getElementById("cloudiness");

const forecastContainer =
    document.getElementById("forecastContainer");

const hourlyContainer =
    document.getElementById("hourlyContainer");

const recentSearchesContainer =
    document.getElementById("recentSearches");

const clearSearchesButton =
    document.getElementById("clearSearches");

const darkModeButton =
    document.getElementById("darkModeToggle");


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupSearch();

        setupDarkMode();

        loadRecentSearches();

        /*
           Load the last searched city.
        */

        const lastCity =
            localStorage.getItem("lastCity");

        if (lastCity) {

            if (searchInput) {
                searchInput.value = lastCity;
            }

            searchWeather(lastCity);

        } else {

            /*
               Default city
            */

            searchWeather("Pune");
        }
    }
);


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    /*
       SEARCH BUTTON
    */

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                performSearch();
            }
        );
    }


    /*
       ENTER KEY
    */

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performSearch();
                }
            }
        );
    }
}


/* =========================================================
   PERFORM SEARCH
   ========================================================= */

function performSearch() {

    if (!searchInput) {

        console.error(
            "searchInput was not found."
        );

        return;
    }


    const city =
        searchInput.value.trim();


    if (!city) {

        alert(
            "Please enter a city name."
        );

        return;
    }


    searchWeather(city);
}


/* =========================================================
   FETCH WEATHER
   ========================================================= */

async function searchWeather(city) {

    city = city.trim();


    if (!city) {
        return;
    }


    currentCity = city;


    showLoading();


    console.log(
        "Searching weather for:",
        city
    );


    try {

        /*
           IMPORTANT:

           We DO NOT put an API key here.

           The browser calls our Vercel backend:

           /api/weather?city=Pune
        */

        const url =
            `${API_ENDPOINT}?city=${encodeURIComponent(city)}`;


        console.log(
            "Request URL:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        console.log(
            "Response status:",
            response.status
        );


        /*
           Try to read JSON response
        */

        const data =
            await response.json();


        console.log(
            "Weather response:",
            data
        );


        /*
           API ERROR
        */

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to fetch weather data."
            );
        }


        /*
           Make sure required data exists
        */

        if (
            !data ||
            !data.current ||
            !data.daily
        ) {

            throw new Error(
                "Weather response is incomplete."
            );
        }


        /*
           DISPLAY DATA
        */

        displayCurrentWeather(data);

        displayFiveDayForecast(data);

        displayHourlyForecast(data);

        displayAdditionalDetails(data);


        /*
           SAVE SEARCH
        */

        saveRecentSearch(city);

        localStorage.setItem(
            "lastCity",
            city
        );


    } catch (error) {

        console.error(
            "Weather error:",
            error
        );


        showError(
            error.message ||
            "Unable to fetch weather."
        );
    }
}


/* =========================================================
   CURRENT WEATHER
   ========================================================= */

function displayCurrentWeather(data) {

    const current =
        data.current;


    /*
       CITY
    */

    if (cityElement) {

        cityElement.textContent =
            data.city ||
            currentCity;
    }


    /*
       TEMPERATURE
    */

    if (temperatureElement) {

        if (
            current.temperature_2m !==
            undefined
        ) {

            temperatureElement.textContent =
                `${Math.round(
                    current.temperature_2m
                )}°C`;

        } else {

            temperatureElement.textContent =
                "--°C";
        }
    }


    /*
       WEATHER CONDITION
    */

    const weather =
        convertWeatherCode(
            current.weather_code
        );


    if (conditionElement) {

        conditionElement.textContent =
            weather.main;
    }


    /*
       WEATHER ICON
    */

    if (weatherIconElement) {

        weatherIconElement.textContent =
            weather.icon;
    }


    /*
       HUMIDITY
    */

    if (humidityElement) {

        if (
            current.relative_humidity_2m !==
            undefined
        ) {

            humidityElement.textContent =
                `${Math.round(
                    current.relative_humidity_2m
                )}%`;

        } else {

            humidityElement.textContent =
                "--%";
        }
    }


    /*
       WIND
    */

    if (windElement) {

        if (
            current.wind_speed_10m !==
            undefined
        ) {

            windElement.textContent =
                `${Math.round(
                    current.wind_speed_10m
                )} km/h`;

        } else {

            windElement.textContent =
                "-- km/h";
        }
    }


    /*
       FEELS LIKE
    */

    if (feelsLikeElement) {

        if (
            current.apparent_temperature !==
            undefined
        ) {

            feelsLikeElement.textContent =
                `${Math.round(
                    current.apparent_temperature
                )}°C`;

        } else {

            feelsLikeElement.textContent =
                "--°C";
        }
    }
}


/* =========================================================
   5 FUTURE DAYS
   ========================================================= */

function displayFiveDayForecast(data) {

    if (!forecastContainer) {

        console.error(
            "forecastContainer not found."
        );

        return;
    }


    forecastContainer.innerHTML = "";


    const daily =
        data.daily;


    /*
       IMPORTANT:

       Backend requests 7 days.

       Open-Meteo:

       daily[0] = TODAY
       daily[1] = TOMORROW
       daily[2] = FUTURE DAY 2
       daily[3] = FUTURE DAY 3
       daily[4] = FUTURE DAY 4
       daily[5] = FUTURE DAY 5

       We ALWAYS skip daily[0].

       We display ONLY daily[1] through daily[5].
    */


    if (
        !daily.time ||
        daily.time.length < 6
    ) {

        console.error(
            "Not enough daily forecast data."
        );

        forecastContainer.innerHTML = `
            <p>
                Unable to load 5-day forecast.
            </p>
        `;

        return;
    }


    /*
       EXACTLY FIVE FUTURE DAYS
    */

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        const dateString =
            daily.time[i];


        /*
           Safety check
        */

        if (!dateString) {
            continue;
        }


        /*
           IMPORTANT:

           Do NOT use:

           new Date("YYYY-MM-DD")

           because timezone conversion can
           shift the displayed day.

           We create the date manually.
        */

        const parts =
            dateString.split("-");


        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]) - 1;

        const day =
            Number(parts[2]);


        const date =
            new Date(
                year,
                month,
                day,
                12,
                0,
                0
            );


        /*
           DAY NAME
        */

        const dayName =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );


        /*
           TEMPERATURE
        */

        const maxTemperature =
            Math.round(
                daily.temperature_2m_max[i]
            );


        const minTemperature =
            Math.round(
                daily.temperature_2m_min[i]
            );


        /*
           WEATHER
        */

        const weather =
            convertWeatherCode(
                daily.weather_code[i]
            );


        /*
           CREATE CARD
        */

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "forecast-card";


        card.innerHTML = `

            <h3>
                ${dayName}
            </h3>

            <div class="forecast-icon">
                ${weather.icon}
            </div>

            <div class="forecast-max">
                ${maxTemperature}°C
            </div>

            <div class="forecast-min">
                Min ${minTemperature}°C
            </div>

        `;


        forecastContainer.appendChild(
            card
        );
    }


    /*
       FINAL SAFETY CHECK

       There should be exactly 5 cards.
    */

    const cards =
        forecastContainer.querySelectorAll(
            ".forecast-card"
        );


    console.log(
        "Future forecast cards:",
        cards.length
    );
}


/* =========================================================
   HOURLY FORECAST
   ========================================================= */

function displayHourlyForecast(data) {

    if (!hourlyContainer) {

        console.error(
            "hourlyContainer not found."
        );

        return;
    }


    hourlyContainer.innerHTML = "";


    if (
        !data.hourly ||
        !data.hourly.time
    ) {

        return;
    }


    const hourly =
        data.hourly;


    /*
       Find the current local hour.

       The backend uses:

       timezone=auto

       so hourly times are already
       local to the searched city.
    */

    const now =
        new Date();


    let startIndex = 0;


    /*
       Find the first future/current hour.
    */

    for (
        let i = 0;
        i < hourly.time.length;
        i++
    ) {

        const hourDate =
            new Date(
                hourly.time[i]
            );


        if (
            hourDate >= now
        ) {

            startIndex = i;

            break;
        }
    }


    /*
       Show next 8 hours
    */

    const hoursToShow = 8;


    for (
        let i = startIndex;

        i <
        startIndex +
        hoursToShow &&
        i <
        hourly.time.length;

        i++
    ) {

        const hourDate =
            new Date(
                hourly.time[i]
            );


        const temperature =
            hourly.temperature_2m[i];


        const weather =
            convertWeatherCode(
                hourly.weather_code[i]
            );


        const timeText =
            hourDate.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "hourly-card";


        card.innerHTML = `

            <h3>
                ${timeText}
            </h3>

            <div class="hourly-icon">
                ${weather.icon}
            </div>

            <div class="hourly-temperature">
                ${Math.round(
                    temperature
                )}°C
            </div>

            <div class="hourly-condition">
                ${weather.main}
            </div>

        `;


        hourlyContainer.appendChild(
            card
        );
    }
}


/* =========================================================
   SUNRISE / SUNSET / VISIBILITY / PRESSURE / CLOUDINESS
   ========================================================= */

function displayAdditionalDetails(data) {

    const current =
        data.current;

    const daily =
        data.daily;


    /*
       SUNRISE
    */

    if (sunriseElement) {

        if (
            daily.sunrise &&
            daily.sunrise[0]
        ) {

            sunriseElement.textContent =
                formatTime(
                    daily.sunrise[0]
                );

        } else {

            sunriseElement.textContent =
                "--";
        }
    }


    /*
       SUNSET
    */

    if (sunsetElement) {

        if (
            daily.sunset &&
            daily.sunset[0]
        ) {

            sunsetElement.textContent =
                formatTime(
                    daily.sunset[0]
                );

        } else {

            sunsetElement.textContent =
                "--";
        }
    }


    /*
       VISIBILITY

       Current API requests visibility,
       so use current.visibility first.
    */

    if (visibilityElement) {

        if (
            current.visibility !==
            undefined &&
            current.visibility !== null
        ) {

            const visibilityKm =
                current.visibility / 1000;


            visibilityElement.textContent =
                `${visibilityKm.toFixed(1)} km`;

        } else {

            visibilityElement.textContent =
                "-- km";
        }
    }


    /*
       PRESSURE
    */

    if (pressureElement) {

        if (
            current.surface_pressure !==
            undefined
        ) {

            pressureElement.textContent =
                `${Math.round(
                    current.surface_pressure
                )} hPa`;

        } else {

            pressureElement.textContent =
                "-- hPa";
        }
    }


    /*
       CLOUDINESS
    */

    if (cloudinessElement) {

        if (
            current.cloud_cover !==
            undefined
        ) {

            cloudinessElement.textContent =
                `${Math.round(
                    current.cloud_cover
                )}%`;

        } else {

            cloudinessElement.textContent =
                "--%";
        }
    }
}


/* =========================================================
   WEATHER CODE
   ========================================================= */

function convertWeatherCode(code) {

    switch (Number(code)) {

        case 0:

            return {
                icon: "☀️",
                main: "Clear Sky"
            };


        case 1:

            return {
                icon: "🌤️",
                main: "Mainly Clear"
            };


        case 2:

            return {
                icon: "⛅",
                main: "Partly Cloudy"
            };


        case 3:

            return {
                icon: "☁️",
                main: "Overcast"
            };


        case 45:
        case 48:

            return {
                icon: "🌫️",
                main: "Fog"
            };


        case 51:
        case 53:
        case 55:
        case 56:
        case 57:

            return {
                icon: "🌦️",
                main: "Drizzle"
            };


        case 61:
        case 63:
        case 65:
        case 66:
        case 67:

            return {
                icon: "🌧️",
                main: "Rain"
            };


        case 71:
        case 73:
        case 75:
        case 77:

            return {
                icon: "❄️",
                main: "Snow"
            };


        case 80:
        case 81:
        case 82:

            return {
                icon: "🌦️",
                main: "Rain Showers"
            };


        case 85:
        case 86:

            return {
                icon: "🌨️",
                main: "Snow Showers"
            };


        case 95:

            return {
                icon: "⛈️",
                main: "Thunderstorm"
            };


        case 96:
        case 99:

            return {
                icon: "⛈️",
                main: "Thunderstorm"
            };


        default:

            return {
                icon: "🌤️",
                main: "Unknown"
            };
    }
}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(dateTimeString) {

    if (!dateTimeString) {
        return "--";
    }


    const date =
        new Date(
            dateTimeString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--";
    }


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   RECENT SEARCHES
   ========================================================= */

function saveRecentSearch(city) {

    let searches =
        JSON.parse(
            localStorage.getItem(
                "recentSearches"
            )
        ) || [];


    /*
       Remove duplicate
    */

    searches =
        searches.filter(
            function (item) {

                return (
                    item.toLowerCase() !==
                    city.toLowerCase()
                );
            }
        );


    /*
       Add newest search first
    */

    searches.unshift(city);


    /*
       Maximum 5 searches
    */

    searches =
        searches.slice(0, 5);


    localStorage.setItem(
        "recentSearches",
        JSON.stringify(searches)
    );


    loadRecentSearches();
}


/* =========================================================
   LOAD RECENT SEARCHES
   ========================================================= */

function loadRecentSearches() {

    if (!recentSearchesContainer) {
        return;
    }


    recentSearchesContainer.innerHTML =
        "";


    const searches =
        JSON.parse(
            localStorage.getItem(
                "recentSearches"
            )
        ) || [];


    searches.forEach(
        function (city) {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "recent-search";


            button.textContent =
                city;


            button.addEventListener(
                "click",
                function () {

                    if (searchInput) {

                        searchInput.value =
                            city;
                    }


                    searchWeather(city);
                }
            );


            recentSearchesContainer.appendChild(
                button
            );
        }
    );
}


/* =========================================================
   CLEAR RECENT SEARCHES
   ========================================================= */

if (clearSearchesButton) {

    clearSearchesButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "recentSearches"
            );


            loadRecentSearches();
        }
    );
}


/* =========================================================
   DARK MODE
   ========================================================= */

function setupDarkMode() {

    if (!darkModeButton) {
        return;
    }


    /*
       Restore saved setting
    */

    const savedDarkMode =
        localStorage.getItem(
            "darkMode"
        );


    if (
        savedDarkMode === "true"
    ) {

        document.body.classList.add(
            "dark-mode"
        );
    }


    /*
       Toggle
    */

    darkModeButton.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "dark-mode"
            );


            const enabled =
                document.body.classList.contains(
                    "dark-mode"
                );


            localStorage.setItem(
                "darkMode",
                enabled
            );
        }
    );
}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    if (temperatureElement) {

        temperatureElement.textContent =
            "--°C";
    }


    if (conditionElement) {

        conditionElement.textContent =
            "Loading...";
    }
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    console.error(
        "Dashboard error:",
        message
    );


    if (conditionElement) {

        conditionElement.textContent =
            "Unable to fetch weather";
    }


    if (temperatureElement) {

        temperatureElement.textContent =
            "--°C";
    }


    if (forecastContainer) {

        forecastContainer.innerHTML = `

            <p style="
                width:100%;
                text-align:center;
                color:white;
                font-size:18px;
            ">
                ${message}
            </p>

        `;
    }
}