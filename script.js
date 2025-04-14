document.addEventListener("DOMContentLoaded", function () {
  const API_KEY = "e9e16ef2b8cb444e862193056251404";
  const WEATHER_API_BASE = "https://api.weatherapi.com/v1";

  const citySearch = document.getElementById("city-search");
  const searchBtn = document.getElementById("search-btn");
  const cityName = document.getElementById("city-name");
  const currentTemp = document.getElementById("current-temp");
  const currentIcon = document.getElementById("current-icon");
  const weatherDescription = document.getElementById("weather-description");
  const forecastContainer = document.getElementById("forecast-container");
  const hourlyForecast = document.getElementById("hourly-forecast");
  const uvIndex = document.getElementById("uv-index");
  const humidity = document.getElementById("humidity");
  const windSpeed = document.getElementById("wind-speed");
  const sunrise = document.getElementById("sunrise");
  const sunset = document.getElementById("sunset");
  const feelsLike = document.getElementById("feels-like");
  const airQuality = document.getElementById("air-quality");
  const currentTime = document.getElementById("current-time");
  const weatherScene = document.getElementById("weather-scene");
  const dynamicBg = document.getElementById("dynamic-bg");

  let fullForecastData = [];

  const CONDITION_CODES = {
    CLEAR: [1000],
    PARTLY_CLOUDY: [1003],
    CLOUDY: [1006, 1009],
    RAIN: [
      1063, 1069, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192,
      1195, 1198, 1201, 1240, 1243, 1246,
    ],
    SNOW: [
      1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279,
      1282,
    ],
    STORM: [1087, 1273, 1276, 1279, 1282],
  };

  const DAY_COLORS = {
    TODAY: "#f9e076",
    TUE: "#f9e076",
    WED: "#f9e076",
    THU: "#f9e076",
    FRI: "#f9e076",
  };

  searchBtn.addEventListener("click", handleSearch);
  citySearch.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  function initApp() {
    updateClock();
    showLoading();
    const savedLocation = localStorage.getItem("weatherLocation");
    if (savedLocation) {
      fetchWeatherByCity(savedLocation);
    } else {
      getUserLocation();
    }
    makeHourlyForecastScrollable();
  }

  function makeHourlyForecastScrollable() {
    const scrollContainer = document.querySelector(".hourly-forecast");
    const scrollLeftBtn = document.createElement("button");
    scrollLeftBtn.className = "scroll-btn scroll-left";
    scrollLeftBtn.innerHTML = "◀";
    scrollLeftBtn.style.display = "none";
    const scrollRightBtn = document.createElement("button");
    scrollRightBtn.className = "scroll-btn scroll-right";
    scrollRightBtn.innerHTML = "▶";
    scrollLeftBtn.addEventListener("click", () => {
      scrollContainer.scrollBy({ left: -200, behavior: "smooth" });
    });
    scrollRightBtn.addEventListener("click", () => {
      scrollContainer.scrollBy({ left: 200, behavior: "smooth" });
    });
    scrollContainer.addEventListener("scroll", () => {
      if (scrollContainer.scrollLeft > 0) {
        scrollLeftBtn.style.display = "block";
      } else {
        scrollLeftBtn.style.display = "none";
      }
      if (
        scrollContainer.scrollLeft + scrollContainer.clientWidth >=
        scrollContainer.scrollWidth
      ) {
        scrollRightBtn.style.display = "none";
      } else {
        scrollRightBtn.style.display = "block";
      }
    });
    const hourlyContainer = document.querySelector(
      ".hourly-forecast-container"
    );
    hourlyContainer.appendChild(scrollLeftBtn);
    hourlyContainer.appendChild(scrollRightBtn);
    const style = document.createElement("style");
    style.textContent = `.hourly-forecast-container{position:relative}.scroll-btn{position:absolute;top:50%;transform:translateY(-50%);background-color:var(--panel-dark);color:var(--text-light);border:none;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;opacity:0.8}.scroll-btn:hover{opacity:1}.scroll-left{left:5px}.scroll-right{right:5px}`;
    document.head.appendChild(style);
  }

  function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    currentTime.textContent = `${hours}:${minutes}`;
  }

  function showLoading() {
    cityName.textContent = "Loading...";
    currentTemp.textContent = "--°C";
    weatherDescription.textContent = "Loading...";
    forecastContainer.innerHTML =
      '<div class="loading-text">Loading forecast data...</div>';
    hourlyForecast.innerHTML =
      '<div class="loading-text">Loading hourly data...</div>';
    uvIndex.textContent = "--";
    humidity.textContent = "--%";
    windSpeed.textContent = "-- km/h";
    sunrise.textContent = "--:--";
    sunset.textContent = "--:--";
    feelsLike.textContent = "--°C";
    airQuality.textContent = "--";
  }

  function handleSearch() {
    const city = citySearch.value.trim();
    if (city) {
      showLoading();
      fetchWeatherByCity(city);
    }
  }

  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          handleLocationError(error);
        },
        { timeout: 10000 }
      );
    } else {
      showError("Geolocation is not supported by this browser.");
      fetchWeatherByCity("Athens");
    }
  }

  function handleLocationError(error) {
    let errorMessage;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied. Using default city.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable. Using default city.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Using default city.";
        break;
      default:
        errorMessage = "Unknown location error. Using default city.";
    }
    showError(errorMessage);
    fetchWeatherByCity("Athens");
  }

  function showError(message) {
    console.error(message);
    weatherDescription.textContent = message;
    cityName.textContent = "Error";
    currentTemp.textContent = "--°C";
    forecastContainer.innerHTML =
      '<div class="loading-text">Unable to load forecast</div>';
    hourlyForecast.innerHTML =
      '<div class="loading-text">Unable to load hourly data</div>';
  }

  function fetchWeatherByCoords(lat, lon) {
    fetch(
      `${WEATHER_API_BASE}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=yes`
    )
      .then(handleResponse)
      .then((data) => {
        updateWeatherUI(data);
        localStorage.setItem("weatherLocation", data.location.name);
      })
      .catch((error) => {
        console.error("Error fetching weather data:", error);
        showError("Failed to fetch weather data. Please try again.");
      });
  }

  function fetchWeatherByCity(city) {
    fetch(
      `${WEATHER_API_BASE}/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=yes`
    )
      .then(handleResponse)
      .then((data) => {
        updateWeatherUI(data);
        localStorage.setItem("weatherLocation", city);
      })
      .catch((error) => {
        console.error("Error fetching weather data:", error);
        showError("City not found or weather data unavailable.");
      });
  }

  function handleResponse(response) {
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }

  function updateWeatherUI(data) {
    try {
      fullForecastData = data.forecast.forecastday;
      cityName.textContent = `${data.location.name}`;
      currentTemp.textContent = `${Math.round(data.current.temp_c)}°C`;
      weatherDescription.textContent = data.current.condition.text;
      const localTime = new Date(data.location.localtime);
      const hours = localTime.getHours().toString().padStart(2, "0");
      const minutes = localTime.getMinutes().toString().padStart(2, "0");
      currentTime.textContent = `${hours}:${minutes}`;
      updateWeatherIcon(
        currentIcon,
        data.current.condition.code,
        data.current.is_day
      );
      uvIndex.textContent = data.current.uv;
      humidity.textContent = `${data.current.humidity}%`;
      windSpeed.textContent = `${data.current.wind_kph} km/h`;
      feelsLike.textContent = `${Math.round(data.current.feelslike_c)}°C`;
      const astronomy = data.forecast.forecastday[0].astro;
      sunrise.textContent = astronomy.sunrise;
      sunset.textContent = astronomy.sunset;
      if (
        data.current.air_quality &&
        data.current.air_quality["us-epa-index"]
      ) {
        const aqiValue = data.current.air_quality["us-epa-index"];
        const aqiText = getAQIText(aqiValue);
        airQuality.textContent = aqiText;
      } else {
        airQuality.textContent = "N/A";
      }
      updateForecast(data.forecast.forecastday);
      updateHourlyForecast(data.forecast.forecastday[0].hour, true);
      updateDynamicBackground(data.current.condition.code, data.current.is_day);
    } catch (error) {
      console.error("Error updating UI:", error);
      showError("Error displaying weather data.");
    }
  }

  function getAQIText(value) {
    const aqiTexts = [
      "Good",
      "Moderate",
      "Unhealthy",
      "Bad",
      "Very Bad",
      "Hazardous",
    ];
    return aqiTexts[Math.min(value - 1, aqiTexts.length - 1)];
  }

  function updateWeatherIcon(element, code, isDay) {
    element.className = "weather-icon-display";
    element.innerHTML = "";

    if (CONDITION_CODES.CLEAR.includes(code)) {
      if (isDay) {
        element.classList.add("icon-sun");
      } else {
        element.classList.add("icon-moon");
      }
    } else if (CONDITION_CODES.PARTLY_CLOUDY.includes(code)) {
      if (isDay) {
        element.classList.add("icon-partly-cloudy-day");
      } else {
        element.classList.add("icon-partly-cloudy-night");
      }
    } else if (CONDITION_CODES.CLOUDY.includes(code)) {
      element.classList.add("icon-cloud");
    } else if (CONDITION_CODES.RAIN.includes(code)) {
      element.classList.add("icon-rain");
    } else if (CONDITION_CODES.SNOW.includes(code)) {
      element.classList.add("icon-snow");
    }
  }

  function updateDynamicBackground(code, isDay) {
    weatherScene.innerHTML = "";
    dynamicBg.className = "dynamic-bg";
    if (isDay) {
      dynamicBg.classList.add("bg-day");
    } else {
      dynamicBg.classList.add("bg-night");
      addStars(weatherScene, 50);
    }
    if (CONDITION_CODES.CLEAR.includes(code)) {
      if (isDay) {
        const sun = document.createElement("div");
        sun.className = "sun-large";
        weatherScene.appendChild(sun);
      } else {
        const moon = document.createElement("div");
        moon.className = "moon";
        weatherScene.appendChild(moon);
      }
    } else if (CONDITION_CODES.PARTLY_CLOUDY.includes(code)) {
      addClouds(weatherScene, 2);
      dynamicBg.classList.add("bg-cloudy");
    } else if (CONDITION_CODES.CLOUDY.includes(code)) {
      addClouds(weatherScene, 4);
      dynamicBg.classList.add("bg-cloudy");
    } else if (CONDITION_CODES.RAIN.includes(code)) {
      addClouds(weatherScene, 3);
      addRain(weatherScene, 40);
      dynamicBg.classList.add("bg-rainy");
    } else if (CONDITION_CODES.SNOW.includes(code)) {
      addClouds(weatherScene, 3);
      addSnow(weatherScene, 30);
      dynamicBg.classList.add("bg-cloudy");
    }
  }

  function addStars(container, count) {
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.width = "2px";
      star.style.height = "2px";
      star.style.backgroundColor = "white";
      star.style.borderRadius = "50%";
      star.style.position = "absolute";
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.animation = `twinkle ${
        2 + Math.random() * 3
      }s infinite alternate`;
      container.appendChild(star);
    }
  }

  function addClouds(container, count) {
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement("div");
      cloud.className = `cloud cloud-${i + 1}`;
      cloud.style.animation = `float ${
        5 + i * 2
      }s infinite alternate ease-in-out`;
      cloud.style.left = `${i * 30 + Math.random() * 10}%`;
      container.appendChild(cloud);
    }
  }

  function addRain(container, count) {
    for (let i = 0; i < count; i++) {
      const raindrop = document.createElement("div");
      raindrop.className = "raindrop";
      raindrop.style.left = `${Math.random() * 100}%`;
      raindrop.style.animationDelay = `${Math.random() * 2}s`;
      raindrop.style.animationDuration = `${0.5 + Math.random()}s`;
      container.appendChild(raindrop);
    }
  }

  function addSnow(container, count) {
    for (let i = 0; i < count; i++) {
      const snowflake = document.createElement("div");
      snowflake.className = "snowflake";
      snowflake.style.left = `${Math.random() * 100}%`;
      snowflake.style.animationDelay = `${Math.random() * 5}s`;
      snowflake.style.animationDuration = `${3 + Math.random() * 4}s`;
      container.appendChild(snowflake);
    }
  }

  function updateForecast(forecastData) {
    forecastContainer.innerHTML = "";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    forecastData.forEach((day, index) => {
      const date = new Date(day.date);
      const dayName = days[date.getDay()];
      const forecastDay = document.createElement("div");
      forecastDay.className = "forecast-day";
      forecastDay.setAttribute("data-date", day.date);
      forecastDay.addEventListener("click", () => {
        handleForecastDayClick(day, index);
      });
      forecastDay.style.cursor = "pointer";
      const dayIcon = document.createElement("div");
      dayIcon.className = "day-icon";
      if (index === 0) {
        dayIcon.style.backgroundColor = DAY_COLORS.TODAY;
      } else if (dayName === "Tue") {
        dayIcon.style.backgroundColor = DAY_COLORS.TUE;
      } else if (dayName === "Wed") {
        dayIcon.style.backgroundColor = DAY_COLORS.WED;
      } else if (dayName === "Thu") {
        dayIcon.style.backgroundColor = DAY_COLORS.THU;
      } else if (dayName === "Fri") {
        dayIcon.style.backgroundColor = DAY_COLORS.FRI;
      } else {
        dayIcon.style.backgroundColor = DAY_COLORS.TODAY;
      }
      const dayDetails = document.createElement("div");
      dayDetails.className = "day-details";
      const dayNameElement = document.createElement("span");
      dayNameElement.className = "day-name";
      dayNameElement.textContent = index === 0 ? "Today" : dayName;
      const dayTemp = document.createElement("span");
      dayTemp.className = "day-temp";
      dayTemp.textContent = `${Math.round(day.day.maxtemp_c)}°/${Math.round(
        day.day.mintemp_c
      )}°`;
      dayDetails.appendChild(dayNameElement);
      dayDetails.appendChild(dayTemp);
      forecastDay.appendChild(dayIcon);
      forecastDay.appendChild(dayDetails);
      forecastContainer.appendChild(forecastDay);
    });
  }

  function handleForecastDayClick(dayData, dayIndex) {
    if (dayData.hour && dayData.hour.length > 0) {
      const isToday = dayIndex === 0;
      const isDay = dayData.hour[0].is_day === 1;
      updateHourlyForecast(dayData.hour, isToday);
      updateDynamicBackground(dayData.day.condition.code, isDay);
      const date = new Date(dayData.date);
      const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const hourlyTitle = document.querySelector(
        ".hourly-forecast-container .section-title"
      );
      hourlyTitle.textContent = `HOURLY FORECAST - ${formattedDate}`;
      document.querySelector(".hourly-forecast-container").scrollIntoView({
        behavior: "smooth",
      });
    }
    const allDays = document.querySelectorAll(".forecast-day");
    allDays.forEach((day) => {
      if (day.getAttribute("data-date") === dayData.date) {
        day.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
      } else {
        day.style.backgroundColor = "";
      }
    });
  }

  function updateHourlyForecast(hourlyData, filterCurrentHour = false) {
    hourlyForecast.innerHTML = "";
    const currentHour = new Date().getHours();
    let filteredHours = hourlyData;
    if (filterCurrentHour) {
      filteredHours = hourlyData.filter((hour) => {
        const hourTime = new Date(hour.time).getHours();
        return hourTime >= currentHour;
      });
    }
    if (filteredHours.length === 0) {
      filteredHours = hourlyData;
    }
    filteredHours.forEach((hour, index) => {
      const hourTime = new Date(hour.time);
      const displayHour = hourTime.getHours();
      const hourItem = document.createElement("div");
      hourItem.className = "hour-item";
      const timeElement = document.createElement("div");
      timeElement.className = "hour-time";
      timeElement.textContent =
        filterCurrentHour && index === 0 && hourTime.getHours() === currentHour
          ? "NOW"
          : `${displayHour % 12 === 0 ? 12 : displayHour % 12}${
              displayHour < 12 ? "AM" : "PM"
            }`;
      const iconElement = document.createElement("div");
      iconElement.className = "hour-icon";
      updateWeatherIcon(iconElement, hour.condition.code, hour.is_day);
      const tempElement = document.createElement("div");
      tempElement.className = "hour-temp";
      tempElement.textContent = `${Math.round(hour.temp_c)}°`;
      hourItem.appendChild(timeElement);
      hourItem.appendChild(iconElement);
      hourItem.appendChild(tempElement);
      hourlyForecast.appendChild(hourItem);
    });
  }

  initApp();
});
