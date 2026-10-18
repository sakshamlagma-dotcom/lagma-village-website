const DEFAULT_LOCATION = {
  name: "Lagma, Saharsa",
  latitude: 25.7489959,
  longitude: 86.6731798
};

const WEATHER_CODES = LagmaWeather.WEATHER_CODES;
const WEATHER_CACHE_MAX_AGE = 15 * 60 * 1000;
const WEATHER_TIMEOUT = 14000;
const SKY_FRAMES = Object.freeze([
  ["#061126", "#101d38", "#23324a", 0.96], ["#07152d", "#132342", "#29394f", 0.94],
  ["#091831", "#162943", "#2c3c50", 0.92], ["#101c37", "#202f48", "#414354", 0.88],
  ["#1c2947", "#3e4560", "#795367", 0.78], ["#344362", "#79748b", "#d27c69", 0.52],
  ["#557da5", "#d79b83", "#f2a15c", 0.18], ["#4b91c9", "#97c7e6", "#edc17f", 0.02],
  ["#328bca", "#87c4e7", "#eed5a0", 0], ["#2585c5", "#7dc0e5", "#c4ddeb", 0],
  ["#1d80c1", "#72b9e1", "#e8dfc4", 0], ["#1979bc", "#6bb5df", "#c9e0e9", 0],
  ["#167bc1", "#76bfe4", "#f0dfaf", 0], ["#1b81c2", "#80c1e2", "#ebd7a7", 0],
  ["#2785bd", "#88bbd7", "#e2c89e", 0], ["#3f83b2", "#9bb9cf", "#efc18c", 0],
  ["#687da0", "#bea1ad", "#f1ad75", 0.02], ["#9b5e70", "#dc916b", "#f28d4e", 0.12],
  ["#884c69", "#d57863", "#ed9561", 0.24], ["#58456d", "#986b7c", "#d18e72", 0.43],
  ["#293e65", "#555975", "#a17476", 0.62], ["#142b50", "#2a4269", "#686980", 0.79],
  ["#0c2146", "#1d365f", "#414f6c", 0.9], ["#081832", "#152b4b", "#293b54", 0.95],
  ["#061126", "#101d38", "#23324a", 0.96]
]);
const SKY_PHASE_MS = 29.530588853 * 86400000;
const SKY_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const CROP_NOTES = {
  "धान": "धान के खेत में पानी का स्तर और निकास दोनों देखें; केवल forecast देखकर खेत न भरें।",
  "गेहूँ": "बालियां या कटाई के करीब फसल हो तो बारिश से पहले सुरक्षित भंडारण और कटाई window देखें।",
  "मक्का": "तेज हवा की चेतावनी में lodging वाले खेत और कमजोर पौधों की मेड़ जांचें।",
  "दाल": "बारिश और अधिक नमी के बाद पत्ती, जड़ और फली में रोग के लक्षण जल्दी देखें।",
  "सब्जी": "नर्सरी, फूल और फल वाली फसल में जलभराव, धूप और तेज हवा से सुरक्षा जांचें।"
};

const elements = {
  menu: document.querySelector(".weather-menu"),
  nav: document.querySelector(".weather-nav"),
  form: document.querySelector("#location-form"),
  input: document.querySelector("#location-input"),
  results: document.querySelector("#location-results"),
  locate: document.querySelector("#current-location"),
  status: document.querySelector("#weather-status"),
  content: document.querySelector("#weather-content"),
  cropTabs: document.querySelector("#crop-tabs"),
  advisoryGrid: document.querySelector("#advisory-grid")
};

const state = {
  location: DEFAULT_LOCATION,
  weather: null,
  crop: "धान",
  requestId: 0,
  searchId: 0,
  skyTimer: null,
  weatherController: null,
  searchController: null,
  lastRequest: null
};

function weatherInfo(code) {
  return LagmaWeather.weatherInfo(code);
}

function finiteNumber(value) {
  return LagmaWeather.numberOrNull(value);
}

function rangedNumber(value, minimum, maximum) {
  const number = finiteNumber(value);
  return number !== null && number >= minimum && number <= maximum ? number : null;
}

function temperatureNumber(value) { return rangedNumber(value, -90, 70); }
function percentNumber(value) { return rangedNumber(value, 0, 100); }
function amountNumber(value) { return rangedNumber(value, 0, 100000); }
function windNumber(value) { return rangedNumber(value, 0, 600); }
function soilNumber(value) { return rangedNumber(value, 0, 1); }

function round(value) {
  const number = finiteNumber(value);
  return number === null ? "उपलब्ध नहीं" : Math.round(number);
}

function formatted(value, unit = "", digits = 0, validate = finiteNumber) {
  const number = validate(value);
  if (number === null) return "उपलब्ध नहीं";
  return `${digits ? number.toFixed(digits) : Math.round(number)}${unit}`;
}

function validForecast(data) {
  return Boolean(data && typeof data === "object" && data.current &&
    temperatureNumber(data.current.temperature_2m) !== null && LagmaWeather.isWeatherCode(data.current.weather_code));
}

function locationCacheKey(location) {
  return `lagma-weather-v2:${Number(location.latitude).toFixed(4)}:${Number(location.longitude).toFixed(4)}`;
}

function readWeatherCache(location) {
  try {
    const record = JSON.parse(localStorage.getItem(locationCacheKey(location)) || "null");
    if (!record || !Number.isFinite(record.savedAt) || record.savedAt > Date.now() || !validForecast(record.data)) return null;
    return { ...record, fresh: Date.now() - record.savedAt <= WEATHER_CACHE_MAX_AGE };
  } catch {
    return null;
  }
}

function saveWeatherCache(location, data) {
  try { localStorage.setItem(locationCacheKey(location), JSON.stringify({ savedAt: Date.now(), data })); } catch { /* Weather works without storage. */ }
}

function formatHour(value) {
  const date = parseWeatherTime(value);
  return date ? new Intl.DateTimeFormat("hi-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(date) : "समय उपलब्ध नहीं";
}

function formatDay(value, index) {
  if (index === 0) return "आज";
  if (index === 1) return "कल";
  const date = parseWeatherTime(`${value}T12:00:00`);
  return date ? new Intl.DateTimeFormat("hi-IN", { weekday: "short", timeZone: "Asia/Kolkata" }).format(date) : "दिन उपलब्ध नहीं";
}

function parseWeatherTime(value) {
  if (typeof value !== "string" || !value) return null;
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+05:30`;
  const date = new Date(zoned);
  return Number.isFinite(date.getTime()) ? date : null;
}

function skyLocalClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return { hour, minute, total: hour * 60 + minute };
}

function blendSkyColor(left, right, amount) {
  const t = Math.max(0, Math.min(1, amount));
  const a = left.match(/[\da-f]{2}/gi).map((part) => parseInt(part, 16));
  const b = right.match(/[\da-f]{2}/gi).map((part) => parseInt(part, 16));
  return `#${a.map((channel, index) => Math.round(channel + (b[index] - channel) * t).toString(16).padStart(2, "0")).join("")}`;
}

function renderSky(data = state.weather, now = new Date()) {
  const sky = document.querySelector("#sky-animation");
  if (!sky) return;
  const skyData = data || { current: {}, daily: {} };
  const clock = skyLocalClock(now);
  const hour = clock.hour + clock.minute / 60;
  const frameIndex = Math.floor(hour);
  const nextIndex = (frameIndex + 1) % SKY_FRAMES.length;
  const blend = hour - frameIndex;
  const frame = SKY_FRAMES[frameIndex];
  const next = SKY_FRAMES[nextIndex];
  const mood = data ? weatherInfo(skyData.current?.weather_code).mood : "unknown";
  const weatherTint = mood === "storm" ? ["#263449", 0.65]
    : mood === "rain" ? ["#43566c", 0.48]
      : mood === "cloudy" ? ["#8292a0", 0.28]
        : mood === "fog" ? ["#bac8cc", 0.36] : null;
  const interpolate = (index) => {
    const color = blendSkyColor(frame[index], next[index], blend);
    return weatherTint ? blendSkyColor(color, weatherTint[0], weatherTint[1]) : color;
  };
  const stars = frame[3] + (next[3] - frame[3]) * blend;
  const sunrise = minutesOfDay(skyData.daily?.sunrise?.[0]) ?? 345;
  const sunset = minutesOfDay(skyData.daily?.sunset?.[0]) ?? 1040;
  const current = clock.total;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let sunProgress = sunrise !== null && sunset !== null ? (current - sunrise) / Math.max(1, sunset - sunrise) : (hour - 6) / 12;
  const sunArc = clamp(sunProgress);
  const sunX = 7 + sunArc * 86;
  const sunY = 70 - Math.sin(Math.PI * sunArc) * 48;
  let sunOpacity = sunrise !== null && sunset !== null
    ? clamp(Math.min((current - (sunrise - 32)) / 32, ((sunset + 24) - current) / 24))
    : clamp(Math.min((hour - 5.5) / 0.5, (18.5 - hour) / 0.5));
  const nightLength = sunrise !== null && sunset !== null ? 1440 - (sunset - sunrise) : 12 * 60;
  let nightProgress = sunrise !== null && sunset !== null
    ? (current < sunrise ? (current + 1440 - sunset) / nightLength : (current - sunset) / nightLength)
    : ((hour + 6) % 24) / 12;
  const moonArc = clamp(nightProgress);
  const moonX = 8 + moonArc * 84;
  const moonY = 68 - Math.sin(Math.PI * moonArc) * 43;
  let moonOpacity = sunrise !== null && sunset !== null
    ? (current >= sunset - 22 || current <= sunrise + 25 ? clamp(current >= sunset ? (current - sunset + 1) / 20 : (sunrise + 25 - current) / 25) : current < sunrise ? 1 : 0)
    : (hour >= 19 || hour < 6 ? 1 : 0);
  if (sunOpacity > 0.65) moonOpacity = 0;
  const phase = ((now.getTime() - SKY_NEW_MOON) % SKY_PHASE_MS + SKY_PHASE_MS) % SKY_PHASE_MS / SKY_PHASE_MS;
  const illumination = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  const moonFrame = Math.max(0, Math.min(4, Math.round(illumination * 4)));
  const period = sunrise !== null && sunset !== null
    ? current >= sunrise - 45 && current <= sunrise + 50 ? "dawn"
      : current >= sunset - 55 && current <= sunset + 80 ? "dusk"
        : current >= sunrise && current < sunset ? "day" : "night"
    : hour >= 5.5 && hour < 7 ? "dawn" : hour >= 17.5 && hour < 19 ? "dusk" : hour >= 6 && hour < 18 ? "day" : "night";

  sky.dataset.frame = String(frameIndex + 1);
  sky.dataset.nextFrame = String(nextIndex + 1);
  sky.dataset.period = period;
  sky.dataset.mood = mood;
  sky.style.setProperty("--sky-top", interpolate(0));
  sky.style.setProperty("--sky-middle", interpolate(1));
  sky.style.setProperty("--sky-horizon-color", interpolate(2));
  sky.style.setProperty("--sky-stars-opacity", stars.toFixed(3));
  sky.style.setProperty("--sky-sun-x", `${sunX.toFixed(2)}%`);
  sky.style.setProperty("--sky-sun-y", `${sunY.toFixed(2)}%`);
  sky.style.setProperty("--sky-sun-opacity", sunOpacity.toFixed(3));
  sky.style.setProperty("--sky-moon-x", `${moonX.toFixed(2)}%`);
  sky.style.setProperty("--sky-moon-y", `${moonY.toFixed(2)}%`);
  sky.style.setProperty("--sky-moon-opacity", moonOpacity.toFixed(3));
  sky.style.setProperty("--sky-haze", period === "dawn" || period === "dusk" ? "0.72" : "0.22");
  sky.querySelector(".sky-moon")?.style.setProperty("background-image", `url("../assets/weather/moon-phase-${moonFrame}.webp")`);
  const clockNode = sky.querySelector(".sky-clock");
  if (clockNode) clockNode.textContent = `लगमा का आसमान · ${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")} IST · ${frameIndex + 1}/25`;
}

function minutesOfDay(value) {
  const match = typeof value === "string" ? value.match(/T(\d{2}):(\d{2})/) : null;
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function windDirection(degrees) {
  const number = finiteNumber(degrees);
  if (number === null) return "दिशा उपलब्ध नहीं";
  const labels = ["उत्तर", "उत्तर-पूर्व", "पूर्व", "दक्षिण-पूर्व", "दक्षिण", "दक्षिण-पश्चिम", "पश्चिम", "उत्तर-पश्चिम"];
  const normalized = ((number % 360) + 360) % 360;
  return labels[Math.round(normalized / 45) % labels.length];
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setStatus(message, type = "loading", retry = false) {
  elements.status.hidden = false;
  elements.status.classList.toggle("is-error", type === "error");
  elements.status.classList.toggle("is-warning", type === "warning");
  elements.status.replaceChildren();
  if (type === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "status-spinner";
    spinner.setAttribute("aria-hidden", "true");
    elements.status.append(spinner);
  }
  const messageNode = document.createElement("strong");
  messageNode.textContent = message;
  elements.status.append(messageNode);
  if (retry && state.lastRequest) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "retry-weather";
    button.className = "weather-retry";
    button.textContent = "फिर कोशिश करें";
    button.setAttribute("aria-label", "मौसम जानकारी फिर से लोड करें");
    elements.status.append(button);
  }
}

function hideStatus() {
  elements.status.hidden = true;
  elements.status.classList.remove("is-error");
  elements.status.classList.remove("is-warning");
}

async function fetchJson(url, timeout = WEATHER_TIMEOUT, signal = null) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      controller?.abort();
      const timeoutError = new Error("मौसम सेवा ने समय पर जवाब नहीं दिया।");
      timeoutError.name = "TimeoutError";
      reject(timeoutError);
    }, timeout);
  });
  const abortRequest = () => controller?.abort();
  if (signal?.aborted) abortRequest();
  else signal?.addEventListener("abort", abortRequest, { once: true });

  try {
    const request = fetch(url, { ...(controller ? { signal: controller.signal } : {}), cache: "no-store" });
    const response = await Promise.race([request, timeoutPromise]);
    if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}`);
    const data = await response.json();
    if (data?.error) throw new Error(data.reason || "Weather service error");
    return data;
  } catch (error) {
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortRequest);
  }
}

function buildForecastUrl(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "surface_pressure"
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
      "soil_moisture_9_to_27cm"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "uv_index_max",
      "sunrise",
      "sunset"
    ].join(","),
    timezone: "Asia/Kolkata",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm"
  });

  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

async function searchLocation(query, signal = null) {
  const normalized = query.trim().toLocaleLowerCase("hi").replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ");
  if (["lagma", "lagma saharsa", "lagma, saharsa", "lagma, saharsa, bihar", "लगमा"].includes(normalized)) {
    return DEFAULT_LOCATION;
  }

  const params = new URLSearchParams({
    name: query.trim(),
    count: "10",
    language: "hi",
    format: "json",
    countryCode: "IN"
  });
  const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`, WEATHER_TIMEOUT, signal);
  const results = Array.isArray(data.results) ? data.results.filter((item) => {
    const latitude = LagmaWeather.numberOrNull(item.latitude);
    const longitude = LagmaWeather.numberOrNull(item.longitude);
    return item.country_code === "IN" && latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  }) : [];

  if (!results.length) throw new Error("यह जगह नहीं मिली। बिहार या जिले का नाम जोड़कर फिर खोजें।");
  const clean = (value) => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("hi");
  const exact = results.filter((item) => [item.name, item.admin2, item.admin1].some((value) => clean(value) === clean(query)));
  const candidates = exact.length ? exact : results;
  const toLocation = (item) => ({
    name: [...new Set([item.name, item.admin2 || item.admin1, item.admin2 && item.admin1 !== item.admin2 ? item.admin1 : ""].filter(Boolean))].join(", "),
    latitude: Number(item.latitude),
    longitude: Number(item.longitude)
  });
  if (candidates.length === 1) return toLocation(candidates[0]);
  return { choices: candidates.slice(0, 5).map(toLocation) };
}

function currentHourlyIndex(data) {
  const times = Array.isArray(data.hourly?.time) ? data.hourly.time : [];
  if (!times.length) return -1;
  const current = typeof data.current?.time === "string" ? data.current.time : "";
  const nextIndex = current ? times.findIndex((time) => typeof time === "string" && time >= current) : -1;
  if (nextIndex >= 0) return nextIndex;
  if (!current) return 0;
  for (let index = times.length - 1; index >= 0; index -= 1) if (times[index] <= current) return index;
  return 0;
}

function renderCurrent(data, location) {
  const current = data.current || {};
  const daily = data.daily || {};
  const info = weatherInfo(current.weather_code);
  const hourlyIndex = currentHourlyIndex(data);
  const soil = hourlyIndex >= 0 ? data.hourly?.soil_moisture_9_to_27cm?.[hourlyIndex] : null;
  document.querySelector(".current-weather")?.setAttribute("data-mood", info.mood);

  setText("#current-location-name", location.name);
  setText("#current-temperature", round(temperatureNumber(current.temperature_2m)));
  setText("#current-condition", info.label);
  setText("#condition-mark", info.symbol);
  setText("#weather-updated", current.time ? `पूर्वानुमान ${formatHour(current.time)} • Asia/Kolkata` : "पूर्वानुमान का समय उपलब्ध नहीं");
  setText("#today-high", formatted(daily.temperature_2m_max?.[0], "°", 0, temperatureNumber));
  setText("#today-low", formatted(daily.temperature_2m_min?.[0], "°", 0, temperatureNumber));
  setText("#today-rain", formatted(daily.precipitation_probability_max?.[0], "%", 0, percentNumber));
  setText("#feels-like", formatted(current.apparent_temperature, "°C", 0, temperatureNumber));
  setText("#humidity", formatted(current.relative_humidity_2m, "%", 0, percentNumber));
  setText("#wind-speed", formatted(current.wind_speed_10m, " km/h", 0, windNumber));
  setText("#wind-direction", windDirection(current.wind_direction_10m));
  setText("#wind-gust", formatted(current.wind_gusts_10m, " km/h", 0, windNumber));
  setText("#rain-sum", formatted(daily.precipitation_sum?.[0], " mm", 1, amountNumber));
  const soilValue = soilNumber(soil);
  setText("#soil-moisture", soilValue === null ? "उपलब्ध नहीं" : `${Math.round(soilValue * 100)}%`);
}

function buildAlerts(data) {
  const daily = data.daily || {};
  const todayCode = daily.weather_code?.[0];
  const rainProbability = percentNumber(daily.precipitation_probability_max?.[0]);
  const rainSum = amountNumber(daily.precipitation_sum?.[0]);
  const maxTemperature = temperatureNumber(daily.temperature_2m_max?.[0]);
  const gust = windNumber(daily.wind_gusts_10m_max?.[0]);
  const uv = rangedNumber(daily.uv_index_max?.[0], 0, 25);
  const alerts = [];

  if (LagmaWeather.isWeatherCode(todayCode) && todayCode >= 95) {
    alerts.push({ level: "danger", title: "आंधी या बिजली की संभावना", text: "खुले खेत, पेड़ और बिजली के खंभों से दूर सुरक्षित जगह लें।" });
  }
  if ((rainSum !== null && rainSum >= 20) || (rainProbability !== null && rainProbability >= 80)) {
    const level = rainSum !== null && rainSum >= 35 ? "danger" : "warn";
    alerts.push({ level, title: "भारी बारिश पर नजर", text: `आज की संभावना ${formatted(rainProbability, "%")} और वर्षा ${formatted(rainSum, " mm", 1)} का forecast है। खेत का निकास देखें।` });
  }
  if (gust !== null && gust >= 40) {
    alerts.push({ level: gust >= 55 ? "danger" : "warn", title: "तेज हवा", text: `हवा के झोंके ${round(gust)} km/h तक जा सकते हैं। spray और खुले ढांचे रोकें।` });
  }
  if (maxTemperature !== null && maxTemperature >= 39) {
    alerts.push({ level: maxTemperature >= 42 ? "danger" : "warn", title: "गर्मी का दबाव", text: `अधिकतम तापमान ${round(maxTemperature)}°C है। दोपहर का खेत काम कम रखें।` });
  }
  if (uv !== null && uv >= 8) {
    alerts.push({ level: "warn", title: "तेज धूप", text: `UV index ${round(uv)} तक है। सुबह या शाम का समय चुनें और पानी साथ रखें।` });
  }

  const incomplete = !LagmaWeather.isWeatherCode(todayCode) || rainProbability === null || rainSum === null || maxTemperature === null || gust === null;
  if (incomplete) alerts.push({ level: "warn", title: "जोखिम जांच अधूरी", text: "कुछ पूर्वानुमान आंकड़े उपलब्ध नहीं हैं; सभी मौसम जोखिमों की जांच नहीं हो सकी। खेत देखकर और आधिकारिक सलाह लेकर निर्णय लें।" });

  return alerts;
}

function renderAlerts(data) {
  const alerts = buildAlerts(data);
  const section = document.querySelector("#weather-alerts");
  const list = document.querySelector("#alert-list");
  section.hidden = !alerts.length;
  list.innerHTML = alerts.map((alert) => `
    <article class="alert-item ${alert.level}">
      <strong>${alert.title}</strong>
      <span>${alert.text}</span>
    </article>
  `).join("");
}

function renderHourly(data) {
  const hourly = data.hourly || {};
  const start = currentHourlyIndex(data);
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const end = Math.min((start < 0 ? 0 : start) + 12, times.length);
  const items = [];

  for (let index = Math.max(0, start); index < end; index += 1) {
    const info = weatherInfo(hourly.weather_code?.[index]);
    items.push(`
      <article class="hour-card">
        <time datetime="${escapeAttribute(times[index])}">${index === start ? "अब" : formatHour(times[index])}</time>
        <span class="weather-symbol weather-${info.mood}" aria-hidden="true">${info.symbol}</span>
        <strong>${formatted(hourly.temperature_2m?.[index], "°C", 0, temperatureNumber)}</strong>
        <span class="rain-value">बारिश ${formatted(hourly.precipitation_probability?.[index], "%", 0, percentNumber)}</span>
        <small>झोंका ${formatted(hourly.wind_gusts_10m?.[index], " km/h", 0, windNumber)}</small>
      </article>
    `);
  }

  document.querySelector("#hourly-strip").innerHTML = items.length ? items.join("") : '<p class="forecast-unavailable">घंटेवार पूर्वानुमान उपलब्ध नहीं है।</p>';
}

function renderDaily(data) {
  const daily = data.daily || {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  const cards = dates.map((date, index) => {
    const info = weatherInfo(daily.weather_code?.[index]);
    return `
      <article class="day-card${index === 0 ? " is-today" : ""}">
        <time datetime="${escapeAttribute(date)}">${formatDay(date, index)}</time>
        <span class="weather-symbol weather-${info.mood}" aria-hidden="true">${info.symbol}</span>
        <strong>${formatted(daily.temperature_2m_max?.[index], "°", 0, temperatureNumber)} / ${formatted(daily.temperature_2m_min?.[index], "°", 0, temperatureNumber)}</strong>
        <span class="rain-value">बारिश ${formatted(daily.precipitation_probability_max?.[index], "%", 0, percentNumber)}</span>
        <small>${formatted(daily.precipitation_sum?.[index], " mm", 1, amountNumber)} • हवा ${formatted(daily.wind_speed_10m_max?.[index], " km/h", 0, windNumber)}</small>
      </article>
    `;
  });
  document.querySelector("#daily-grid").innerHTML = cards.length ? cards.join("") : '<p class="forecast-unavailable">सात दिन का पूर्वानुमान उपलब्ध नहीं है।</p>';
}

function escapeAttribute(value) {
  return String(value || "").replace(/[&"<>']/g, (character) => ({ "&": "&amp;", "\"": "&quot;", "<": "&lt;", ">": "&gt;", "'": "&#39;" })[character]);
}

function advisoryCards(data, crop) {
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const start = currentHourlyIndex(data);
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const windowStart = Math.max(0, start);
  const end = Math.min(windowStart + 6, times.length);
  const indexes = start >= 0 ? Array.from({ length: end - windowStart }, (_, index) => windowStart + index) : [];
  const nextRain = indexes.map((index) => percentNumber(hourly.precipitation_probability?.[index]));
  const nextGusts = indexes.map((index) => windNumber(hourly.wind_gusts_10m?.[index]));
  const nextCodes = indexes.map((index) => hourly.weather_code?.[index]);
  const completeWindow = indexes.length === 6 && nextRain.every((value) => value !== null) &&
    nextGusts.every((value) => value !== null) && nextCodes.every(LagmaWeather.isWeatherCode);
  const maxRainSoon = completeWindow ? Math.max(...nextRain) : null;
  const maxGustSoon = completeWindow ? Math.max(...nextGusts) : null;
  const thunderSoon = completeWindow && nextCodes.some((code) => Number(code) >= 95);
  const rainToday = amountNumber(daily.precipitation_sum?.[0]);
  const rainChance = percentNumber(daily.precipitation_probability_max?.[0]);
  const maxTemperature = temperatureNumber(daily.temperature_2m_max?.[0]);
  const hourlyIndex = start;
  const soil = hourlyIndex >= 0 ? soilNumber(hourly.soil_moisture_9_to_27cm?.[hourlyIndex]) : null;
  const humidity = percentNumber(data.current?.relative_humidity_2m);

  let spray;
  if (!completeWindow) {
    spray = { type: "warn", label: "डेटा अधूरा", title: "छिड़काव सलाह उपलब्ध नहीं", text: "अगले 6 घंटे के बारिश, हवा और गरज-चमक के सभी आंकड़े नहीं मिले। खेत, दवा का label और कृषि अधिकारी की सलाह देखें।" };
  } else if (thunderSoon || maxRainSoon >= 45 || maxGustSoon >= 25) {
    spray = { type: "stop", label: "सावधानी", title: "छिड़काव की स्थिति प्रतिकूल हो सकती है", text: `अगले 6 घंटों में बारिश की संभावना ${round(maxRainSoon)}% और झोंका ${round(maxGustSoon)} km/h तक forecast है। दवा का label और स्थानीय हालात जांचें।` };
  } else if (maxRainSoon >= 25 || maxGustSoon >= 18) {
    spray = { type: "warn", label: "सावधानी", title: "छोटी सुरक्षित window चुनें", text: "दवा label का rain-free और wind limit देखें; हवा बढ़े तो spray बंद करें।" };
  } else {
    spray = { type: "good", label: "Field check", title: "पूर्वानुमान में जोखिम कम", text: "यह model forecast है, गारंटी नहीं। पत्ती सूखी और हवा कम होने की पुष्टि करके ही label/KVK सलाह मानें।" };
  }

  let irrigation;
  if (rainToday !== null && rainChance !== null && (rainToday >= 5 || rainChance >= 65)) {
    irrigation = { type: "good", label: "खेत जांचें", title: "बारिश के forecast को ध्यान में रखें", text: `${formatted(rainChance, "%")} संभावना और ${formatted(rainToday, " mm", 1)} वर्षा forecast है। जलनिकास और असली मिट्टी की नमी देखकर फैसला करें।` };
  } else if (Number.isFinite(soil) && soil < 0.2) {
    irrigation = { type: "warn", label: "नमी जांचें", title: "मॉडल में जड़ क्षेत्र की नमी कम", text: "यह मिट्टी की model estimate है, खेत का माप नहीं। हाथ से नमी जांचें और स्थानीय सलाह के अनुसार फैसला करें।" };
  } else if (rainToday === null || rainChance === null || soil === null) {
    irrigation = { type: "warn", label: "डेटा अधूरा", title: "सिंचाई सलाह उपलब्ध नहीं", text: "बारिश या मिट्टी की नमी के जरूरी आंकड़े नहीं मिले। खेत की असली नमी और कृषि सलाह देखें।" };
  } else {
    irrigation = { type: "good", label: "Field check", title: "पहले खेत की नमी देखें", text: "Forecast अकेले सिंचाई तय नहीं करता। जड़ क्षेत्र और फसल stage देखकर कृषि सलाह अनुसार फैसला करें।" };
  }

  const heat = maxTemperature === null
    ? { type: "warn", label: "डेटा अधूरा", title: "तापमान सलाह उपलब्ध नहीं", text: "आज का अधिकतम तापमान नहीं मिला। स्थानीय मौसम और खेत की स्थिति देखकर काम तय करें।" }
    : maxTemperature >= 39
    ? { type: "stop", label: "गर्मी", title: "दोपहर का काम कम रखें", text: `${round(maxTemperature)}°C तक तापमान है। सुबह/शाम काम करें और पौधों में stress देखें।` }
    : maxTemperature >= 35
      ? { type: "warn", label: "धूप", title: "गर्मी पर नजर रखें", text: "नर्सरी और नई रोपाई में नमी व पत्तियों का झुलसाव देखें।" }
      : { type: "good", label: "तापमान", title: "तापमान सामान्य दायरे में", text: "फिर भी फसल stage और खेत की स्थानीय स्थिति देखकर काम करें।" };

  const disease = humidity !== null && rainChance !== null && humidity >= 80 && rainChance >= 45
    ? { type: "warn", label: crop, title: "रोग की निगरानी बढ़ाएं", text: `${crop} में अधिक नमी के बाद पत्ती, तना और जड़ पर शुरुआती लक्षण देखें।` }
    : humidity === null || rainChance === null
      ? { type: "warn", label: "डेटा अधूरा", title: `${crop} रोग-जोखिम की जांच अधूरी`, text: "नमी और बारिश की जरूरी जानकारी नहीं मिली। फसल के लक्षण देखें और KVK/कृषि अधिकारी से सलाह लें।" }
      : { type: "good", label: crop, title: "फसल की नियमित निगरानी", text: `${CROP_NOTES[crop] || CROP_NOTES["धान"]} Forecast गारंटी नहीं है।` };

  return [irrigation, spray, heat, disease];
}

function renderAdvisory() {
  if (!state.weather) return;
  const cards = advisoryCards(state.weather, state.crop);
  elements.advisoryGrid.innerHTML = cards.map((card) => `
    <article class="advice-card ${card.type}">
      <span>${card.label}</span>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
    </article>
  `).join("");
}

function renderWeather(data, location, freshness = "fresh") {
  if (!validForecast(data)) throw new Error("मौसम के जरूरी आंकड़े अधूरे हैं।");
  state.weather = data;
  state.location = location;
  renderSky(data);
  renderCurrent(data, location);
  renderAlerts(data);
  renderHourly(data);
  renderDaily(data);
  renderAdvisory();
  elements.content.hidden = false;
  if (freshness === "stale") {
    setStatus("पुराना forecast दिख रहा है; नेटवर्क नहीं मिला। ताज़ा जानकारी के लिए फिर कोशिश करें।", "error", true);
  } else if (!Array.isArray(data.hourly?.time) || !Array.isArray(data.daily?.time)) {
    setStatus("कुछ पूर्वानुमान उपलब्ध नहीं हैं; अधूरे आंकड़े अलग से दिखाए गए हैं।", "warning");
  } else {
    hideStatus();
  }
}

async function loadWeather(location, { force = false } = {}) {
  const requestId = ++state.requestId;
  state.weatherController?.abort();
  state.weatherController = typeof AbortController === "function" ? new AbortController() : null;
  state.lastRequest = () => loadWeather(location, { force: true });
  const cached = readWeatherCache(location);
  if (cached && cached.fresh && !force) {
    renderWeather(cached.data, location);
    return;
  }
  if (cached && !state.weather) renderWeather(cached.data, location, "stale");
  setStatus(`${location.name} का forecast लाया जा रहा है...`);
  try {
    const data = await fetchJson(buildForecastUrl(location), WEATHER_TIMEOUT, state.weatherController?.signal);
    if (requestId !== state.requestId) return;
    if (!validForecast(data)) throw new Error("मौसम के जरूरी आंकड़े नहीं मिले।");
    saveWeatherCache(location, data);
    renderWeather(data, location);
  } catch (error) {
    if (requestId !== state.requestId || error.name === "AbortError") return;
    const stale = cached && !cached.fresh ? cached : readWeatherCache(location);
    if (stale && validForecast(stale.data)) {
      renderWeather(stale.data, location, "stale");
      return;
    }
    const message = error.name === "TimeoutError"
      ? "मौसम सेवा ने समय पर जवाब नहीं दिया।"
      : error instanceof SyntaxError
        ? "मौसम सेवा से अधूरा जवाब मिला।"
        : error.message?.startsWith("मौसम के जरूरी")
          ? error.message
          : "मौसम जानकारी नहीं मिल सकी। इंटरनेट जांचकर फिर कोशिश करें।";
    setStatus(message, "error", true);
  } finally {
    if (requestId === state.requestId) state.weatherController = null;
  }
}

elements.menu?.addEventListener("click", () => {
  const isOpen = elements.nav.classList.toggle("is-open");
  elements.menu.setAttribute("aria-expanded", String(isOpen));
});

elements.nav?.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  elements.nav.classList.remove("is-open");
  elements.menu?.setAttribute("aria-expanded", "false");
});

function clearLocationChoices() {
  if (!elements.results) return;
  elements.results.hidden = true;
  elements.results.replaceChildren();
  state.locationChoices = [];
}

function showLocationChoices(choices) {
  state.locationChoices = choices;
  elements.results.replaceChildren();
  const prompt = document.createElement("p");
  prompt.className = "location-results-prompt";
  prompt.textContent = "एक से अधिक मिलती-जुलती जगहें मिलीं। सही जिला चुनें:";
  elements.results.append(prompt);
  choices.forEach((location, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "location-choice";
    button.setAttribute("role", "option");
    button.dataset.locationIndex = String(index);
    button.textContent = location.name;
    elements.results.append(button);
  });
  elements.results.hidden = false;
}

elements.results?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-location-index]");
  if (!button) return;
  const location = state.locationChoices?.[Number(button.dataset.locationIndex)];
  if (!location) return;
  clearLocationChoices();
  elements.input.value = location.name;
  loadWeather(location);
});

elements.status?.addEventListener("click", (event) => {
  if (event.target.closest("#retry-weather")) state.lastRequest?.();
});

elements.form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = elements.input.value.trim();
  if (!query) {
    clearLocationChoices();
    state.lastRequest = () => elements.input.focus();
    setStatus("जगह का नाम लिखकर खोजें।", "error", false);
    elements.input.focus();
    return;
  }
  const searchId = ++state.searchId;
  state.searchController?.abort();
  state.weatherController?.abort();
  state.requestId += 1;
  state.searchController = typeof AbortController === "function" ? new AbortController() : null;
  clearLocationChoices();
  setStatus("जगह खोजी जा रही है...");

  try {
    const result = await searchLocation(query, state.searchController?.signal);
    if (searchId !== state.searchId) return;
    if (result.choices) {
      showLocationChoices(result.choices);
      setStatus("कई जगहें मिलीं। सूची से सही जगह चुनें।", "warning");
      return;
    }
    elements.input.value = result.name;
    await loadWeather(result);
  } catch (error) {
    if (searchId !== state.searchId || error.name === "AbortError") return;
    state.lastRequest = () => elements.form.requestSubmit();
    setStatus(error.name === "TimeoutError" ? "जगह खोजने में समय लगा।" : error.message?.includes("जगह नहीं मिली") ? error.message : "जगह खोजी नहीं जा सकी। इंटरनेट जांचकर फिर कोशिश करें।", "error", true);
  } finally {
    if (searchId === state.searchId) state.searchController = null;
  }
});

elements.locate?.addEventListener("click", () => {
  const searchId = ++state.searchId;
  state.searchController?.abort();
  state.weatherController?.abort();
  state.requestId += 1;
  clearLocationChoices();
  if (!navigator.geolocation) {
    setStatus("इस browser में location सुविधा उपलब्ध नहीं है।", "error");
    return;
  }

  state.lastRequest = () => elements.locate.click();
  setStatus("आपकी जगह ली जा रही है...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (searchId !== state.searchId) return;
      const location = {
        name: "मेरी वर्तमान जगह",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
        setStatus("आपकी जगह का मान्य निर्देशांक नहीं मिला।", "error", true);
        return;
      }
      elements.input.value = location.name;
      loadWeather(location);
    },
    (error) => {
      if (searchId !== state.searchId) return;
      const message = error.code === 1
        ? "Location अनुमति नहीं मिली। या तो अनुमति दें या जगह का नाम खोजें।"
        : error.code === 3
          ? "आपकी जगह ढूंढने में समय लगा। फिर कोशिश करें या जगह का नाम खोजें।"
          : "वर्तमान जगह नहीं मिल सकी। जगह का नाम खोजें।";
      setStatus(message, "error", true);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
});

elements.cropTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-crop]");
  if (!button) return;
  state.crop = button.dataset.crop;
  elements.cropTabs.querySelectorAll("button").forEach((item) => {
    item.setAttribute("aria-selected", String(item === button));
  });
  renderAdvisory();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("../sw.js"));
}

renderSky();
state.skyTimer = window.setInterval(() => renderSky(), 30 * 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderSky();
});
loadWeather(DEFAULT_LOCATION);
