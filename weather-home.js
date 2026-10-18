(function exposeHomeWeather(root) {
  "use strict";

  const CACHE_KEY = "lagma-home-weather-v3";
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
    if (weather?.isDay === 0 || weather?.isDay === 1) return weather.isDay === 1;
    const hour = localHour(weather?.time, now);
    return !Number.isFinite(hour) ? true : hour >= 6 && hour < 18;
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

  function init(badge) {
    if (!badge) return;
    const temperatureNode = badge.querySelector("#home-weather-temp");
    const conditionNode = badge.querySelector("#home-weather-condition");
    const weatherIconNode = badge.querySelector("[data-weather-icon]");
    let currentIcon = weatherIconNode;
    let currentIconName = null;

    const setState = (name, label) => {
      badge.dataset.weatherState = name;
      conditionNode.textContent = label;
      badge.setAttribute("aria-label", `Lagma ka mausam: ${label}. Naya mausam dekhne ke liye kholen.`);
    };

    const render = (weather, freshness = "live") => {
      if (!validWeather(weather)) return false;
      const info = LagmaWeather.weatherInfo(weather.code);
      const day = isDaytime(weather);
      const hour = localHour(weather.time);
      const goldenHour = day && [5, 6, 17, 18].includes(hour) && ["clear", "partly"].includes(info.mood);
      const moon = lunarAppearance();
      const icon = !day && ["clear", "partly"].includes(info.mood) ? "moon" : info.icon;
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
        <i class="weather-star star-a"></i><i class="weather-star star-b"></i><i class="weather-star star-c"></i>`;
      if (scene.dataset) scene.dataset.initialized = "true";
      const moonPhoto = scene.querySelector(".weather-moon-photo");
      if (moonPhoto) {
        moonPhoto.style.backgroundImage = `url("assets/weather/moon-phase-${moon.index}.webp")`;
        moonPhoto.dataset.direction = moon.waxing ? "waxing" : "waning";
      }
      badge.dataset.dayPeriod = day ? "day" : "night";
      badge.classList.remove("weather-clear", "weather-partly", "weather-cloudy", "weather-fog", "weather-rain", "weather-snow", "weather-storm", "weather-unknown", "weather-day", "weather-night", "weather-golden-hour");
      badge.classList.add(`weather-${info.mood}`);
      badge.classList.add(day ? "weather-day" : "weather-night");
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
          time: typeof data?.current?.time === "string" ? data.current.time : null
        };
        if (!validWeather(weather)) throw new Error("Weather response is incomplete");
        return weather;
      } finally {
        root.clearTimeout(timeoutId);
      }
    };

    const storage = (() => { try { return root.localStorage; } catch { return null; } })();
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

  root.LagmaHomeWeather = Object.freeze({ init, isDaytime, localHour, lunarAppearance, CACHE_KEY, CACHE_MAX_AGE, REQUEST_TIMEOUT });
})(typeof window === "undefined" ? globalThis : window);
