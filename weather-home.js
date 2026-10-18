(function exposeHomeWeather(root) {
  "use strict";

  const CACHE_KEY = "lagma-home-weather-v7";
  const CACHE_MAX_AGE = 15 * 60 * 1000;
  const REQUEST_TIMEOUT = 12000;
  const LOCATION = Object.freeze({ latitude: 25.7489959, longitude: 86.6731798 });
  const LUNAR_CYCLE_DAYS = 29.530588853;
  const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

  function lunarAppearance(now = Date.now()) {
    const cycle = LUNAR_CYCLE_DAYS * 24 * 60 * 60 * 1000;
    const phase = ((now - REFERENCE_NEW_MOON) % cycle + cycle) % cycle / cycle;
    const waxing = phase < 0.5;
    const illumination = waxing ? phase * 2 : (1 - phase) * 2;
    return { index: Math.max(0, Math.min(4, Math.round(illumination * 4))), waxing };
  }

  function validWeather(weather) {
    return weather && LagmaWeather.numberOrNull(weather.temperature) !== null && LagmaWeather.isWeatherCode(weather.code);
  }

  function localHour(weatherTime, now = new Date()) {
    const apiHour = typeof weatherTime === "string" ? weatherTime.match(/T(\d{2}):\d{2}/) : null;
    if (apiHour) return Number(apiHour[1]);
    try {
      return Number(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23"
      }).formatToParts(now).find((part) => part.type === "hour")?.value);
    } catch {
      return null;
    }
  }

  function isDaytime(weather, now = new Date()) {
    const current = minutesOfDay(weather?.time);
    const sunrise = minutesOfDay(weather?.sunrise);
    const sunset = minutesOfDay(weather?.sunset);
    if (current !== null && sunrise !== null && sunset !== null) return current >= sunrise && current < sunset;
    if (weather?.isDay === 0 || weather?.isDay === 1) return weather.isDay === 1;
    const hour = localHour(weather?.time, now);
    return !Number.isFinite(hour) ? true : hour >= 6 && hour < 18;
  }

  function minutesOfDay(value) {
    const match = typeof value === "string" ? value.match(/T(\d{2}):(\d{2})/) : null;
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function currentLocalTime(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(now).reduce((values, part) => {
      if (part.type !== "literal") values[part.type] = part.value;
      return values;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function skyPosition(weather, now = new Date()) {
    const current = minutesOfDay(weather?.time) ?? localHour(weather?.time, now) * 60 + now.getMinutes();
    const sunrise = minutesOfDay(weather?.sunrise);
    const sunset = minutesOfDay(weather?.sunset);
    if (sunrise === null || sunset === null) return { sun: [50, 50], moon: [50, 42] };
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const position = (progress, fromRight = false) => {
      const arc = clamp(progress);
      return [
        fromRight ? 94 - 88 * arc : 6 + 88 * arc,
        59 - 37 * Math.sin(Math.PI * arc)
      ];
    };
    const dayLength = Math.max(1, sunset - sunrise);
    const dayProgress = (current - sunrise) / dayLength;
    let nightProgress;
    if (current < sunrise) nightProgress = (current + 1440 - sunset) / (sunrise + 1440 - sunset);
    else nightProgress = (current - sunset) / (1440 + sunrise - sunset);
    return {
      sun: position(dayProgress),
      moon: position(nightProgress, true)
    };
  }

  function skyPeriod(weather, now = new Date()) {
    const current = minutesOfDay(weather?.time);
    let sunrise = minutesOfDay(weather?.sunrise);
    let sunset = minutesOfDay(weather?.sunset);
    if (current !== null && sunrise !== null && current >= sunrise - 45 && current <= sunrise + 75) return "dawn";
    if (current !== null && sunset !== null && current >= sunset - 75 && current <= sunset + 75) return "dusk";
    if (current === null) {
      const hour = localHour(weather?.time, now);
      if (hour >= 5 && hour < 7) return "dawn";
      if (hour >= 17 && hour < 19) return "dusk";
    }
    return isDaytime(weather, now) ? "day" : "night";
  }

  function readCache(storage, now) {
    try {
      const cached = JSON.parse(storage.getItem(CACHE_KEY) || "null");
      if (!validWeather(cached) || !Number.isFinite(cached.savedAt) || cached.savedAt > now) return null;
      return { weather: cached, fresh: now - cached.savedAt <= CACHE_MAX_AGE };
    } catch {
      return null;
    }
  }

  function refreshedWeatherTime(weather, now = new Date()) {
    const time = currentLocalTime(now);
    const currentDay = time.slice(0, 10);
    const sourceDay = weather?.time?.slice(0, 10);
    if (!sourceDay || sourceDay === currentDay) return { ...weather, time };
    return {
      ...weather,
      time,
      sunrise: weather.sunrise ? `${currentDay}${weather.sunrise.slice(10)}` : weather.sunrise,
      sunset: weather.sunset ? `${currentDay}${weather.sunset.slice(10)}` : weather.sunset
    };
  }

  function init(badge) {
    if (!badge) return;
    const temperatureNode = badge.querySelector("#home-weather-temp");
    const conditionNode = badge.querySelector("#home-weather-condition");
    const weatherIconNode = badge.querySelector("[data-weather-icon]");
    let currentIcon = weatherIconNode;
    let currentIconName = null;
    let lastWeather = null;
    let lastFreshness = "live";

    const setState = (name, label) => {
      badge.dataset.weatherState = name;
      conditionNode.textContent = label;
      badge.setAttribute("aria-label", `Lagma ka mausam: ${label}. Naya mausam dekhne ke liye kholen.`);
    };

    const render = (weather, freshness = "live") => {
      if (!validWeather(weather)) return false;
      lastWeather = weather;
      lastFreshness = freshness;
      weather = refreshedWeatherTime(weather);
      const info = LagmaWeather.weatherInfo(weather.code);
      const day = isDaytime(weather);
      const period = skyPeriod(weather);
      const goldenHour = ["dawn", "dusk"].includes(period) && ["clear", "partly", "cloudy"].includes(info.mood);
      const moon = lunarAppearance();
      const moonVisible = ["night", "dusk"].includes(period) && ["clear", "partly", "cloudy", "fog"].includes(info.mood);
      const icon = moonVisible ? "moon" : info.icon;
      const temperature = Math.round(Number(weather.temperature));
      if (currentIcon && currentIconName !== icon) {
        currentIcon.outerHTML = `<i class="home-weather-icon" data-lucide="${icon}" data-weather-icon aria-hidden="true"></i>`;
        currentIcon = badge.querySelector("[data-weather-icon]");
        currentIconName = icon;
        root.lucide?.createIcons({ attrs: { "stroke-width": 1.9 } });
      }
      let scene = badge.querySelector(".weather-scene");
      if (!scene) {
        scene = document.createElement("span");
        scene.className = "weather-scene";
        scene.setAttribute("aria-hidden", "true");
        badge.prepend(scene);
      }
      if (!scene.dataset?.initialized) scene.innerHTML = `
        <i class="weather-sunset-film"></i><i class="weather-moon-photo"></i><i class="weather-sun"></i><i class="weather-cloud cloud-a"></i><i class="weather-cloud cloud-b"></i>
        <i class="weather-fog-line fog-a"></i><i class="weather-fog-line fog-b"></i><i class="weather-bolt"></i>
        ${Array.from({ length: 5 }, (_, index) => `<i class="weather-drop drop-${index + 1}"></i>`).join("")}
        ${Array.from({ length: 5 }, (_, index) => `<i class="weather-flake flake-${index + 1}"></i>`).join("")}
        <i class="weather-star star-a"></i><i class="weather-star star-b"></i><i class="weather-star star-c"></i>
        <i class="weather-star star-d"></i><i class="weather-star star-e"></i>`;
      if (scene.dataset) scene.dataset.initialized = "true";
      const moonPhoto = scene.querySelector(".weather-moon-photo");
      const sun = scene.querySelector(".weather-sun");
      const positions = skyPosition(weather);
      if (sun) {
        sun.style.setProperty("--sky-body-x", `${positions.sun[0]}%`);
        sun.style.setProperty("--sky-body-y", `${positions.sun[1]}%`);
      }
      if (moonPhoto) {
        moonPhoto.style.setProperty("--sky-body-x", `${positions.moon[0]}%`);
        moonPhoto.style.setProperty("--sky-body-y", `${positions.moon[1]}%`);
        moonPhoto.style.backgroundImage = `url("assets/weather/moon-phase-${moon.index}.webp")`;
        moonPhoto.dataset.direction = moon.waxing ? "waxing" : "waning";
        moonPhoto.dataset.visible = String(moonVisible);
      }
      badge.dataset.dayPeriod = day ? "day" : "night";
      badge.classList.remove("weather-clear", "weather-partly", "weather-cloudy", "weather-fog", "weather-rain", "weather-snow", "weather-storm", "weather-unknown", "weather-day", "weather-night", "weather-golden-hour", "weather-sky-dawn", "weather-sky-day", "weather-sky-dusk", "weather-sky-night", "weather-show-moon");
      badge.classList.add(`weather-${info.mood}`);
      badge.classList.add(day ? "weather-day" : "weather-night");
      badge.classList.add(`weather-sky-${period}`);
      if (moonVisible) badge.classList.add("weather-show-moon");
      if (goldenHour) badge.classList.add("weather-golden-hour");
      temperatureNode.textContent = `${temperature}°C`;
      setState(freshness === "stale" ? "stale" : "loaded", freshness === "stale" ? `${info.label} · पुराना डेटा` : info.label);
      return true;
    };

    const fetchWeather = async () => {
      const controller = typeof root.AbortController === "function" ? new root.AbortController() : null;
      const timeoutId = root.setTimeout(() => controller?.abort(), REQUEST_TIMEOUT);
      const params = new URLSearchParams({
        latitude: String(LOCATION.latitude),
        longitude: String(LOCATION.longitude),
        current: "temperature_2m,weather_code,is_day",
        daily: "sunrise,sunset",
        forecast_days: "1",
        timezone: "Asia/Kolkata",
        temperature_unit: "celsius"
      });
      try {
        const response = await root.fetch(`https://api.open-meteo.com/v1/forecast?${params}`, controller ? { signal: controller.signal, cache: "no-store" } : { cache: "no-store" });
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        const weather = {
          temperature: LagmaWeather.numberOrNull(data?.current?.temperature_2m),
          code: data?.current?.weather_code,
          isDay: data?.current?.is_day === 0 || data?.current?.is_day === 1 ? data.current.is_day : null,
          time: typeof data?.current?.time === "string" ? data.current.time : null,
          sunrise: typeof data?.daily?.sunrise?.[0] === "string" ? data.daily.sunrise[0] : null,
          sunset: typeof data?.daily?.sunset?.[0] === "string" ? data.daily.sunset[0] : null
        };
        if (!validWeather(weather)) throw new Error("Weather response is incomplete");
        return weather;
      } finally {
        root.clearTimeout(timeoutId);
      }
    };

    const storage = (() => { try { return root.localStorage; } catch { return null; } })();
    root.setInterval(() => {
      if (!lastWeather) return;
      render(refreshedWeatherTime(lastWeather), lastFreshness);
    }, 60 * 1000);
    const now = Date.now();
    const cached = readCache(storage, now);
    if (cached && render(cached.weather, cached.fresh ? "live" : "stale") && cached.fresh) return;
    if (!cached) {
      temperatureNode.textContent = "—";
      setState("loading", "मौसम लोड हो रहा है…");
    }

    let settled = false;
    const timeoutGuard = root.setTimeout(() => {
      if (settled) return;
      settled = true;
      setState(cached ? "stale" : "error", cached ? "पुराना डेटा · ताज़ा मौसम नहीं मिला · दोबारा खोलें" : "मौसम नहीं मिला · फिर से खोलें");
    }, REQUEST_TIMEOUT + 500);

    fetchWeather().then((weather) => {
      if (settled) return;
      settled = true;
      root.clearTimeout(timeoutGuard);
      render(weather);
      try { storage?.setItem(CACHE_KEY, JSON.stringify({ ...weather, savedAt: Date.now() })); } catch { /* Storage is optional. */ }
    }).catch(() => {
      if (settled) return;
      settled = true;
      root.clearTimeout(timeoutGuard);
      setState(cached ? "stale" : "error", cached ? "पुराना डेटा · अपडेट नहीं हुआ · फिर से खोलें" : "मौसम नहीं मिला · फिर से खोलें");
    });

  }

  root.LagmaHomeWeather = Object.freeze({ init, isDaytime, localHour, minutesOfDay, skyPeriod, skyPosition, currentLocalTime, refreshedWeatherTime, lunarAppearance, CACHE_KEY, CACHE_MAX_AGE, REQUEST_TIMEOUT });
})(typeof window === "undefined" ? globalThis : window);
