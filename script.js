/* =========================================================
   WEATHER DASHBOARD - COMPLETE SCRIPT (CORRECTED)
   ========================================================= */

/* =========================================================
   GLOBAL VARIABLES & CONFIGURATION
   ========================================================= */

let currentCity = "";
let midnightTimer = null;

const API_ENDPOINT = "/api/weather";

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const currentCityElement = document.getElementById("city");
const currentTemperature = document.getElementById("temperature");
const currentCondition = document.getElementById("condition");
const humidityElement = document.getElementById("humidity");
const windElement = document.getElementById("wind");
const feelsLikeElement = document.getElementById("feelsLike");
const sunriseElement = document.getElementById("sunrise");
const sunsetElement = document.getElementById("sunset");
const visibilityElement = document.getElementById("visibility");
const pressureElement = document.getElementById("pressure");
const cloudinessElement = document.getElementById("cloudiness");
const forecastContainer = document.getElementById("forecastContainer");
const hourlyContainer = document.getElementById("hourlyContainer");
const recentSearchesContainer = document.getElementById("recentSearches");
const clearSearchesButton = document.getElementById("clearSearches");
const darkModeButton = document.getElementById("darkModeToggle");

/* =========================================================
   PAGE LOAD & LIFECYCLE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadRecentSearches();
    setupSearch();
    setupDarkMode();
    scheduleMidnightRefresh();

    // Auto-refresh if the user revisits a stale tab the next day
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && currentCity) {
            searchWeather(currentCity, false);
        }
    });

    const savedCity = localStorage.getItem("lastCity");
    if (savedCity) {
        if (searchInput) searchInput.value = savedCity;
        searchWeather(savedCity);
    } else {
        searchWeather("Pune");
    }
});

/* =========================================================
   SEARCH SETUP
   ========================================================= */

function setupSearch() {
    const executeSearch = () => {
        const city = searchInput ? searchInput.value.trim() : "";
        if (!city) {
            alert("Please enter a city name.");
            return;
        }
        searchWeather(city);
    };

    if (searchButton) {
        searchButton.addEventListener("click", executeSearch);
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                executeSearch();
            }
        });
    }
}

/* =========================================================
   MAIN WEATHER FUNCTION
   ========================================================= */

async function searchWeather(city, showLoader = true) {
    if (!city) return;

    currentCity = city;
    localStorage.setItem("lastCity", city);

    if (showLoader) {
        showLoading();
    }

    try {
        const response = await fetch(
            `${API_ENDPOINT}?city=${encodeURIComponent(city)}`
        );

        if (!response.ok) {
            let errorMessage = "Unable to fetch weather.";
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (_) {
                // Response was not JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data || (!data.current && !data.daily)) {
            throw new Error("Invalid or empty weather data received.");
        }

        displayCurrentWeather(data);
        displayFiveDayForecast(data);
        displayHourlyForecast(data);
        displayAdditionalDetails(data);
        saveRecentSearch(city);

    } catch (error) {
        console.error("Weather request failed:", error);
        showError(error.message || "Unable to fetch weather.");
    }
}

/* =========================================================
   CURRENT WEATHER
   ========================================================= */

function displayCurrentWeather(data) {
    const current = data.current || {};
    const location = data.location || {};

    let cityName = location.name || data.city || currentCity;

    if (currentCityElement) {
        currentCityElement.textContent = cityName;
    }

    if (currentTemperature) {
        currentTemperature.textContent = current.temperature_2m !== undefined 
            ? `${Math.round(current.temperature_2m)}°C` 
            : "--°C";
    }

    const weather = convertWeatherCode(current.weather_code);

    if (currentCondition) {
        currentCondition.textContent = weather.main;
    }

    const mainIcon = document.getElementById("weatherIcon");
    if (mainIcon) {
        mainIcon.textContent = weather.icon;
    }

    if (humidityElement) {
        humidityElement.textContent = current.relative_humidity_2m !== undefined 
            ? `${Math.round(current.relative_humidity_2m)}%` 
            : "--%";
    }

    if (windElement) {
        windElement.textContent = current.wind_speed_10m !== undefined 
            ? `${Math.round(current.wind_speed_10m)} km/h` 
            : "-- km/h";
    }

    if (feelsLikeElement) {
        feelsLikeElement.textContent = current.apparent_temperature !== undefined 
            ? `${Math.round(current.apparent_temperature)}°C` 
            : "--°C";
    }
}

/* =========================================================
   5-DAY FUTURE FORECAST (ROBUST DATE FILTERING)
   ========================================================= */

function displayFiveDayForecast(data) {
    if (!forecastContainer) return;
    forecastContainer.innerHTML = "";

    if (!data.daily || !Array.isArray(data.daily.time)) {
        showForecastError();
        return;
    }

    const daily = data.daily;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDays = [];

    // Filter by calendar day to avoid timezone desync or index assumption bugs
    for (let i = 0; i < daily.time.length; i++) {
        const itemDate = parseLocalDate(daily.time[i]);
        itemDate.setHours(0, 0, 0, 0);

        // Accept only future days (strictly after today)
        if (itemDate > today) {
            futureDays.push({
                date: daily.time[i],
                max: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
                min: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
                weatherCode: daily.weather_code ? daily.weather_code[i] : null
            });
        }

        if (futureDays.length === 5) break;
    }

    if (futureDays.length === 0) {
        showForecastError();
        return;
    }

    futureDays.forEach((day) => {
        const date = parseLocalDate(day.date);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const weather = convertWeatherCode(day.weatherCode);

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <h3>${dayName}</h3>
            <div class="forecast-icon">${weather.icon}</div>
            <div class="forecast-max">${day.max !== null ? Math.round(day.max) : "--"}°C</div>
            <div class="forecast-min">Min ${day.min !== null ? Math.round(day.min) : "--"}°C</div>
        `;

        forecastContainer.appendChild(card);
    });
}

/* =========================================================
   HOURLY FORECAST
   ========================================================= */

function displayHourlyForecast(data) {
    if (!hourlyContainer) return;
    hourlyContainer.innerHTML = "";

    if (!data.hourly || !Array.isArray(data.hourly.time)) {
        return;
    }

    const hourly = data.hourly;
    const now = new Date();

    // Locate the current hour index
    let startIndex = hourly.time.findIndex(timeStr => new Date(timeStr) >= now);
    if (startIndex === -1) startIndex = 0;

    const numberOfHours = 8;
    const endIndex = Math.min(startIndex + numberOfHours, hourly.time.length);

    for (let i = startIndex; i < endIndex; i++) {
        const time = new Date(hourly.time[i]);
        const temperature = hourly.temperature_2m ? hourly.temperature_2m[i] : null;
        const weather = convertWeatherCode(hourly.weather_code ? hourly.weather_code[i] : null);

        const timeText = time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
            <h3>${timeText}</h3>
            <div class="hourly-icon">${weather.icon}</div>
            <div class="hourly-temperature">${temperature !== null ? Math.round(temperature) : "--"}°C</div>
            <div class="hourly-condition">${weather.main}</div>
        `;

        hourlyContainer.appendChild(card);
    }
}

/* =========================================================
   ADDITIONAL DETAILS
   ========================================================= */

function displayAdditionalDetails(data) {
    const current = data.current || {};
    const daily = data.daily || {};

    if (sunriseElement && daily.sunrise && daily.sunrise[0]) {
        sunriseElement.textContent = formatTime(daily.sunrise[0]);
    }

    if (sunsetElement && daily.sunset && daily.sunset[0]) {
        sunsetElement.textContent = formatTime(daily.sunset[0]);
    }

    if (visibilityElement) {
        const visMeters = current.visibility !== undefined 
            ? current.visibility 
            : (data.hourly && data.hourly.visibility ? data.hourly.visibility[0] : null);

        visibilityElement.textContent = visMeters !== null 
            ? `${(visMeters / 1000).toFixed(1)} km` 
            : "-- km";
    }

    if (pressureElement) {
        pressureElement.textContent = current.surface_pressure !== undefined 
            ? `${Math.round(current.surface_pressure)} hPa` 
            : "-- hPa";
    }

    if (cloudinessElement) {
        cloudinessElement.textContent = current.cloud_cover !== undefined 
            ? `${Math.round(current.cloud_cover)}%` 
            : "--%";
    }
}

/* =========================================================
   WEATHER CODE CONVERSION
   ========================================================= */

function convertWeatherCode(code) {
    if (code === undefined || code === null) {
        return { icon: "🌤️", main: "Weather" };
    }

    switch (code) {
        case 0:
            return { icon: "☀️", main: "Clear Sky" };
        case 1:
            return { icon: "🌤️", main: "Mainly Clear" };
        case 2:
            return { icon: "⛅", main: "Partly Cloudy" };
        case 3:
            return { icon: "☁️", main: "Overcast" };
        case 45:
        case 48:
            return { icon: "🌫️", main: "Fog" };
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
            return { icon: "🌦️", main: "Drizzle" };
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
            return { icon: "🌧️", main: "Rain" };
        case 71:
        case 73:
        case 75:
        case 77:
            return { icon: "❄️", main: "Snow" };
        case 80:
        case 81:
        case 82:
            return { icon: "🌦️", main: "Rain Showers" };
        case 85:
        case 86:
            return { icon: "🌨️", main: "Snow Showers" };
        case 95:
        case 96:
        case 99:
            return { icon: "⛈️", main: "Thunderstorm" };
        default:
            return { icon: "🌤️", main: "Variable" };
    }
}

/* =========================================================
   DATE & TIME HELPERS
   ========================================================= */

function parseLocalDate(dateString) {
    if (!dateString) return new Date();
    const parts = dateString.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
}

function formatTime(dateTimeString) {
    if (!dateTimeString) return "--";
    const date = new Date(dateTimeString);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function scheduleMidnightRefresh() {
    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 10);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    midnightTimer = setTimeout(() => {
        if (currentCity) {
            searchWeather(currentCity, false);
        }
        scheduleMidnightRefresh();
    }, msUntilMidnight);
}

/* =========================================================
   RECENT SEARCHES & STORAGE
   ========================================================= */

function saveRecentSearch(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    searches = searches.filter(item => item.toLowerCase() !== city.toLowerCase());
    searches.unshift(city);
    searches = searches.slice(0, 5);

    localStorage.setItem("recentSearches", JSON.stringify(searches));
    loadRecentSearches();
}

function loadRecentSearches() {
    if (!recentSearchesContainer) return;

    const searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    recentSearchesContainer.innerHTML = "";

    searches.forEach(city => {
        const button = document.createElement("button");
        button.className = "recent-search";
        button.textContent = city;
        button.addEventListener("click", () => {
            if (searchInput) searchInput.value = city;
            searchWeather(city);
        });
        recentSearchesContainer.appendChild(button);
    });
}

if (clearSearchesButton) {
    clearSearchesButton.addEventListener("click", () => {
        localStorage.removeItem("recentSearches");
        loadRecentSearches();
    });
}

/* =========================================================
   THEME TOGGLE
   ========================================================= */

function setupDarkMode() {
    if (!darkModeButton) return;

    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
        document.body.classList.add("dark-mode");
    }

    darkModeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("darkMode", isDark.toString());
    });
}

/* =========================================================
   UI FEEDBACK (LOADING / ERROR)
   ========================================================= */

function showLoading() {
    if (currentTemperature) currentTemperature.textContent = "--°C";
    if (currentCondition) currentCondition.textContent = "Loading...";
}

function showError(message) {
    if (currentCondition) currentCondition.textContent = "Error";
    if (currentTemperature) currentTemperature.textContent = "--°C";
    if (forecastContainer) {
        forecastContainer.innerHTML = `
            <p style="color:white; text-align:center; width:100%; font-size:16px;">
                ${message}
            </p>
        `;
    }
}

function showForecastError() {
    if (!forecastContainer) return;
    forecastContainer.innerHTML = `
        <p style="color:white; text-align:center; width:100%; font-size:16px;">
            Unable to load 5-day forecast.
        </p>
    `;
}