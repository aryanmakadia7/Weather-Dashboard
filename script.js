/* =========================================================
   WEATHER DASHBOARD
   Open-Meteo data through secure Vercel backend
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let weatherData = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");

const forecastContainer =
    document.getElementById("forecastContainer");

const hourlyContainer =
    document.getElementById("hourlyContainer");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const visibility = document.getElementById("visibility");
const pressure = document.getElementById("pressure");
const cloudiness = document.getElementById("cloudiness");

const recentSearchesContainer =
    document.getElementById("recentSearches");

const clearSearchesBtn =
    document.getElementById("clearSearches");

const darkModeBtn =
    document.getElementById("darkModeBtn");


/* =========================================================
   WEATHER CODE CONVERSION
   ========================================================= */

function convertWeatherCode(code) {

    const weatherCodes = {

        0: {
            main: "Clear Sky",
            icon: "☀️"
        },

        1: {
            main: "Mainly Clear",
            icon: "🌤️"
        },

        2: {
            main: "Partly Cloudy",
            icon: "⛅"
        },

        3: {
            main: "Overcast",
            icon: "☁️"
        },

        45: {
            main: "Fog",
            icon: "🌫️"
        },

        48: {
            main: "Fog",
            icon: "🌫️"
        },

        51: {
            main: "Drizzle",
            icon: "🌦️"
        },

        53: {
            main: "Drizzle",
            icon: "🌦️"
        },

        55: {
            main: "Heavy Drizzle",
            icon: "🌧️"
        },

        61: {
            main: "Rain",
            icon: "🌧️"
        },

        63: {
            main: "Rain",
            icon: "🌧️"
        },

        65: {
            main: "Heavy Rain",
            icon: "🌧️"
        },

        71: {
            main: "Snow",
            icon: "🌨️"
        },

        73: {
            main: "Snow",
            icon: "🌨️"
        },

        75: {
            main: "Heavy Snow",
            icon: "❄️"
        },

        80: {
            main: "Rain Showers",
            icon: "🌦️"
        },

        81: {
            main: "Rain Showers",
            icon: "🌦️"
        },

        82: {
            main: "Heavy Rain Showers",
            icon: "🌧️"
        },

        95: {
            main: "Thunderstorm",
            icon: "⛈️"
        },

        96: {
            main: "Thunderstorm",
            icon: "⛈️"
        },

        99: {
            main: "Thunderstorm",
            icon: "⛈️"
        }
    };

    return weatherCodes[code] || {
        main: "Unknown",
        icon: "🌤️"
    };
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function getCityToday(timezone) {

    try {

        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone || "UTC",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(new Date());

        const year =
            parts.find(p => p.type === "year").value;

        const month =
            parts.find(p => p.type === "month").value;

        const day =
            parts.find(p => p.type === "day").value;

        return `${year}-${month}-${day}`;

    } catch (error) {

        return new Date()
            .toISOString()
            .split("T")[0];
    }
}


function getDayName(dateString) {

    const date = new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString("en-US", {
        weekday: "short"
    });
}


/* =========================================================
   SEARCH WEATHER
   ========================================================= */

async function searchWeather() {

    const city = cityInput.value.trim();

    if (!city) {

        alert("Please enter a city name.");

        return;
    }


    try {

        searchBtn.disabled = true;

        searchBtn.textContent = "Loading...";


        /*
           IMPORTANT:

           The API key is NOT here.

           The request goes to your Vercel backend.
        */

        const response = await fetch(
            `/api/weather?city=${encodeURIComponent(city)}`
        );


        if (!response.ok) {

            let errorMessage = "Weather request failed.";

            try {

                const errorData = await response.json();

                if (errorData.error) {
                    errorMessage = errorData.error;
                }

            } catch (error) {
                // Ignore JSON parsing error
            }

            throw new Error(errorMessage);
        }


        const data = await response.json();


        console.log("Weather data:", data);


        weatherData = data;


        /* Display all weather information */

        displayCurrentWeather(data);

        displayFiveDayForecast(data);

        displayHourlyForecast(data);

        displayExtraDetails(data);


        /* Save search */

        saveRecentSearch(city);

        displayRecentSearches();


    } catch (error) {

        console.error("Weather error:", error);

        alert(
            error.message ||
            "Unable to fetch weather data."
        );

    } finally {

        searchBtn.disabled = false;

        searchBtn.textContent = "Search";
    }
}


/* =========================================================
   CURRENT WEATHER
   ========================================================= */

function displayCurrentWeather(data) {

    if (!data) {
        return;
    }


    /* City name */

    if (cityName) {

        cityName.textContent =
            data.city ||
            data.name ||
            cityInput.value;
    }


    /* Current temperature */

    if (
        temperature &&
        data.current &&
        data.current.temperature_2m !== undefined
    ) {

        temperature.textContent =
            `${Math.round(data.current.temperature_2m)}°C`;
    }


    /* Weather condition */

    if (
        weatherCondition &&
        data.current &&
        data.current.weather_code !== undefined
    ) {

        const weather =
            convertWeatherCode(
                data.current.weather_code
            );

        weatherCondition.textContent =
            weather.main;
    }


    /* Humidity */

    if (
        humidity &&
        data.current &&
        data.current.relative_humidity_2m !== undefined
    ) {

        humidity.textContent =
            `${Math.round(
                data.current.relative_humidity_2m
            )}%`;
    }


    /* Wind */

    if (
        windSpeed &&
        data.current &&
        data.current.wind_speed_10m !== undefined
    ) {

        windSpeed.textContent =
            `${Math.round(
                data.current.wind_speed_10m
            )} km/h`;
    }


    /* Feels like */

    if (
        feelsLike &&
        data.current &&
        data.current.apparent_temperature !== undefined
    ) {

        feelsLike.textContent =
            `${Math.round(
                data.current.apparent_temperature
            )}°C`;
    }
}


/* =========================================================
   5 FUTURE DAYS
   ========================================================= */

function displayFiveDayForecast(data) {

    if (!forecastContainer) {

        console.error(
            "forecastContainer not found in HTML."
        );

        return;
    }


    forecastContainer.innerHTML = "";


    /*
       IMPORTANT FIX

       We DO NOT simply use:

       daily[1]
       daily[2]
       daily[3]
       daily[4]
       daily[5]

       Instead we compare the actual date
       returned by the API with TODAY.

       This prevents TODAY from appearing.
    */


    if (
        !data.daily ||
        !data.daily.time
    ) {

        console.error(
            "Daily forecast data not found."
        );

        return;
    }


    /* Get TODAY in the forecast city's timezone */

    const today =
        getCityToday(data.timezone);


    console.log(
        "City timezone:",
        data.timezone
    );

    console.log(
        "Today in city:",
        today
    );


    const futureDays = [];


    /*
       Go through every date returned
       by the API.
    */

    for (
        let i = 0;
        i < data.daily.time.length;
        i++
    ) {

        const forecastDate =
            data.daily.time[i];


        /*
           THIS IS THE IMPORTANT PART.

           If:

           forecastDate <= today

           we skip it.

           Therefore TODAY can never
           appear in the forecast.
        */

        if (forecastDate <= today) {

            console.log(
                "Skipping:",
                forecastDate
            );

            continue;
        }


        futureDays.push({

            date: forecastDate,

            min:
                data.daily.temperature_2m_min[i],

            max:
                data.daily.temperature_2m_max[i],

            weatherCode:
                data.daily.weather_code[i]

        });


        /*
           Stop after exactly
           5 future days.
        */

        if (futureDays.length === 5) {

            break;
        }
    }


    console.log(
        "5 FUTURE DAYS:",
        futureDays
    );


    /* Display the five days */

    futureDays.forEach(day => {

        const weather =
            convertWeatherCode(
                day.weatherCode
            );


        const card =
            document.createElement("div");


        card.className =
            "forecast-card";


        card.innerHTML = `

            <h3>
                ${getDayName(day.date)}
            </h3>

            <div class="forecast-icon">
                ${weather.icon}
            </div>

            <div class="forecast-max">
                ${Math.round(day.max)}°C
            </div>

            <div class="forecast-min">
                Min ${Math.round(day.min)}°C
            </div>

        `;


        forecastContainer.appendChild(card);

    });


    /*
       If less than 5 future days are
       available, show a console message.
    */

    if (futureDays.length < 5) {

        console.warn(
            "The API returned only " +
            futureDays.length +
            " future days."
        );
    }
}


/* =========================================================
   HOURLY FORECAST
   ========================================================= */

function displayHourlyForecast(data) {

    if (!hourlyContainer) {
        return;
    }


    hourlyContainer.innerHTML = "";


    if (
        !data.hourly ||
        !data.hourly.time
    ) {

        return;
    }


    const timezone =
        data.timezone || "UTC";


    const now =
        new Date();


    /*
       Show approximately the next
       8 available hours.
    */

    let shown = 0;


    for (
        let i = 0;
        i < data.hourly.time.length &&
        shown < 8;
        i++
    ) {

        const timeString =
            data.hourly.time[i];


        const forecastTime =
            new Date(timeString);


        /*
           Skip forecast times that
           have already passed.
        */

        if (forecastTime < now) {
            continue;
        }


        const temp =
            data.hourly.temperature_2m[i];


        const code =
            data.hourly.weather_code[i];


        const weather =
            convertWeatherCode(code);


        const time =
            new Date(timeString)
                .toLocaleTimeString(
                    "en-US",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: timezone
                    }
                );


        const card =
            document.createElement("div");


        card.className =
            "hourly-card";


        card.innerHTML = `

            <h3>${time}</h3>

            <div class="hourly-icon">
                ${weather.icon}
            </div>

            <div class="hourly-temp">
                ${Math.round(temp)}°C
            </div>

            <div class="hourly-condition">
                ${weather.main}
            </div>

        `;


        hourlyContainer.appendChild(card);


        shown++;
    }
}


/* =========================================================
   EXTRA WEATHER DETAILS
   ========================================================= */

function displayExtraDetails(data) {

    if (!data) {
        return;
    }


    /* Sunrise */

    if (
        sunrise &&
        data.daily &&
        data.daily.sunrise &&
        data.daily.sunrise[0]
    ) {

        sunrise.textContent =
            formatTime(
                data.daily.sunrise[0],
                data.timezone
            );
    }


    /* Sunset */

    if (
        sunset &&
        data.daily &&
        data.daily.sunset &&
        data.daily.sunset[0]
    ) {

        sunset.textContent =
            formatTime(
                data.daily.sunset[0],
                data.timezone
            );
    }


    /* Visibility */

    if (
        visibility &&
        data.current &&
        data.current.visibility !== undefined
    ) {

        visibility.textContent =
            `${(
                data.current.visibility / 1000
            ).toFixed(1)} km`;
    }


    /*
       Pressure

       Open-Meteo normally gives
       surface_pressure.
    */

    if (
        pressure &&
        data.current &&
        data.current.surface_pressure !== undefined
    ) {

        pressure.textContent =
            `${Math.round(
                data.current.surface_pressure
            )} hPa`;
    }


    /* Cloudiness */

    if (
        cloudiness &&
        data.current &&
        data.current.cloud_cover !== undefined
    ) {

        cloudiness.textContent =
            `${Math.round(
                data.current.cloud_cover
            )}%`;
    }
}


/* =========================================================
   TIME FORMAT
   ========================================================= */

function formatTime(timeString, timezone) {

    if (!timeString) {
        return "--";
    }


    try {

        return new Date(timeString)
            .toLocaleTimeString(
                "en-US",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone:
                        timezone || "UTC"
                }
            );

    } catch (error) {

        return timeString;
    }
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


    /* Remove duplicate */

    searches =
        searches.filter(
            item =>
                item.toLowerCase() !==
                city.toLowerCase()
        );


    /* Add newest search first */

    searches.unshift(city);


    /* Keep only 5 */

    searches =
        searches.slice(0, 5);


    localStorage.setItem(
        "recentSearches",
        JSON.stringify(searches)
    );
}


/* =========================================================
   DISPLAY RECENT SEARCHES
   ========================================================= */

function displayRecentSearches() {

    if (!recentSearchesContainer) {
        return;
    }


    recentSearchesContainer.innerHTML = "";


    const searches =
        JSON.parse(
            localStorage.getItem(
                "recentSearches"
            )
        ) || [];


    searches.forEach(city => {

        const button =
            document.createElement("button");


        button.className =
            "recent-search";


        button.textContent =
            city;


        button.addEventListener(
            "click",
            () => {

                cityInput.value =
                    city;

                searchWeather();

            }
        );


        recentSearchesContainer
            .appendChild(button);

    });
}


/* =========================================================
   CLEAR RECENT SEARCHES
   ========================================================= */

if (clearSearchesBtn) {

    clearSearchesBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "recentSearches"
            );

            displayRecentSearches();

        }
    );
}


/* =========================================================
   DARK MODE
   ========================================================= */

if (darkModeBtn) {

    darkModeBtn.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark-mode"
            );


            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );


            localStorage.setItem(
                "darkMode",
                isDark
            );

        }
    );
}


/* =========================================================
   LOAD DARK MODE
   ========================================================= */

const savedDarkMode =
    localStorage.getItem("darkMode");


if (savedDarkMode === "true") {

    document.body.classList.add(
        "dark-mode"
    );
}


/* =========================================================
   SEARCH BUTTON
   ========================================================= */

if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        searchWeather
    );
}


/* =========================================================
   ENTER KEY SEARCH
   ========================================================= */

if (cityInput) {

    cityInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                searchWeather();

            }

        }
    );
}


/* =========================================================
   INITIAL RECENT SEARCHES
   ========================================================= */

displayRecentSearches();


/* =========================================================
   OPTIONAL DEFAULT CITY
   ========================================================= */

if (cityInput && cityInput.value.trim()) {

    // Uncomment this if you want
    // weather to load automatically.

    // searchWeather();
}