function displayFiveDayForecast(data) {

    if (!forecastContainer) {
        console.error("forecastContainer not found.");
        return;
    }

    forecastContainer.innerHTML = "";

    if (
        !data.daily ||
        !Array.isArray(data.daily.time)
    ) {
        showForecastError();
        return;
    }

    const daily = data.daily;

    /*
        IMPORTANT:

        daily[0] = TODAY
        daily[1] = TOMORROW
        daily[2] = FUTURE DAY 2
        daily[3] = FUTURE DAY 3
        daily[4] = FUTURE DAY 4
        daily[5] = FUTURE DAY 5

        Therefore we ALWAYS skip index 0
        and display indexes 1 to 5.
    */

    for (let i = 1; i <= 5; i++) {

        if (
            !daily.time[i] ||
            daily.temperature_2m_max[i] === undefined ||
            daily.temperature_2m_min[i] === undefined ||
            daily.weather_code[i] === undefined
        ) {
            console.error(
                "Missing forecast data for index:",
                i
            );
            continue;
        }

        /*
            Parse YYYY-MM-DD manually.

            This prevents timezone problems where
            a date can accidentally become the
            previous day.
        */

        const parts =
            daily.time[i].split("-");

        const date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2]),
            12,
            0,
            0
        );

        const dayName =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );

        const weather =
            convertWeatherCode(
                daily.weather_code[i]
            );

        const card =
            document.createElement("div");

        card.className =
            "forecast-card";

        card.innerHTML = `
            <h3>${dayName}</h3>

            <div class="forecast-icon">
                ${weather.icon}
            </div>

            <div class="forecast-max">
                ${Math.round(
                    daily.temperature_2m_max[i]
                )}°C
            </div>

            <div class="forecast-min">
                Min ${Math.round(
                    daily.temperature_2m_min[i]
                )}°C
            </div>
        `;

        forecastContainer.appendChild(card);
    }
}