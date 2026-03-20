const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city");
const weatherFeedback = document.querySelector("#weather-feedback");
const weatherPanel = document.querySelector("#weather-panel");
const quickCityButtons = document.querySelectorAll("[data-city]");

const weatherCodeMap = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

function setFeedback(message, tone = "neutral") {
  weatherFeedback.textContent = message;
  weatherFeedback.dataset.tone = tone;
}

function renderLoadingState() {
  weatherPanel.innerHTML = `
    <div class="loading-state">
      <span class="state-chip">Loading</span>
      <div class="loading-bar"></div>
      <div class="loading-bar short"></div>
      <div class="loading-bar medium"></div>
    </div>
  `;
}

function renderEmptyState(title, description, tag = "Ready") {
  weatherPanel.innerHTML = `
    <div class="empty-state">
      <span class="state-chip">${tag}</span>
      <h2>${title}</h2>
      <p>${description}</p>
    </div>
  `;
}

function formatDay(date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function describeWeather(code) {
  return weatherCodeMap[code] || "Weather update available";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather data could not be loaded right now.");
  }
  return response.json();
}

function renderWeather({ cityName, countryName, forecast }) {
  const current = forecast.current;
  const dailyCards = forecast.daily.time
    .slice(0, 3)
    .map((date, index) => {
      const min = Math.round(forecast.daily.temperature_2m_min[index]);
      const max = Math.round(forecast.daily.temperature_2m_max[index]);
      const code = forecast.daily.weather_code[index];

      return `
        <article class="forecast-card">
          <h3>${formatDay(date)}</h3>
          <p class="forecast-temp">${max}° / ${min}°</p>
          <p>${describeWeather(code)}</p>
        </article>
      `;
    })
    .join("");

  weatherPanel.innerHTML = `
    <div class="weather-hero">
      <article class="weather-main">
        <span class="state-chip">Live weather</span>
        <h2>${cityName}, ${countryName}</h2>
        <p class="weather-summary">${describeWeather(current.weather_code)}</p>
        <div class="temperature-line">
          <strong>${Math.round(current.temperature_2m)}°C</strong>
          <span>updated with current local forecast data</span>
        </div>
      </article>

      <article class="metric-card">
        <strong>${Math.round(current.wind_speed_10m)} km/h</strong>
        <span>wind speed</span>
      </article>
    </div>

    <div class="metrics-grid">
      <article class="metric-card">
        <strong>${Math.round(forecast.daily.temperature_2m_max[0])}°C</strong>
        <span>today high</span>
      </article>
      <article class="metric-card">
        <strong>${Math.round(forecast.daily.temperature_2m_min[0])}°C</strong>
        <span>today low</span>
      </article>
      <article class="metric-card">
        <strong>${forecast.timezone_abbreviation || forecast.timezone}</strong>
        <span>timezone</span>
      </article>
    </div>

    <h3 class="forecast-title">Next forecast steps</h3>
    <div class="forecast-grid">${dailyCards}</div>
  `;
}

async function searchWeather(city) {
  renderLoadingState();
  setFeedback(`Searching forecast for ${city}...`, "loading");

  try {
    const geocoding = await fetchJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    const location = geocoding.results?.[0];
    if (!location) {
      throw new Error("City not found. Try another city name.");
    }

    const forecast = await fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );

    renderWeather({
      cityName: location.name,
      countryName: location.country || "Forecast",
      forecast,
    });

    setFeedback(`Forecast loaded for ${location.name}.`, "success");
  } catch (error) {
    renderEmptyState("Could not load this forecast", error.message, "Error");
    setFeedback(error.message, "error");
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    renderEmptyState("Type a city first", "A city name is required before requesting the forecast.", "Input");
    setFeedback("Please enter a city name.", "error");
    cityInput.focus();
    return;
  }

  searchWeather(city);
});

quickCityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const city = button.dataset.city || "";
    cityInput.value = city;
    searchWeather(city);
  });
});
