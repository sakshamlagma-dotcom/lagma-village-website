const DEFAULT_LOCATION = {
  name: "Lagma, Saharsa",
  latitude: 25.7489959,
  longitude: 86.6731798
};

const WEATHER_CODES = {
  0: { label: "साफ मौसम", symbol: "☀" },
  1: { label: "ज्यादातर साफ", symbol: "☀" },
  2: { label: "हल्के बादल", symbol: "◒" },
  3: { label: "बादल", symbol: "☁" },
  45: { label: "कोहरा", symbol: "≋" },
  48: { label: "घना कोहरा", symbol: "≋" },
  51: { label: "हल्की बूंदाबांदी", symbol: "☂" },
  53: { label: "बूंदाबांदी", symbol: "☂" },
  55: { label: "तेज बूंदाबांदी", symbol: "☂" },
  61: { label: "हल्की बारिश", symbol: "☂" },
  63: { label: "बारिश", symbol: "☂" },
  65: { label: "तेज बारिश", symbol: "☂" },
  71: { label: "हल्की बर्फ", symbol: "❄" },
  73: { label: "बर्फबारी", symbol: "❄" },
  75: { label: "तेज बर्फबारी", symbol: "❄" },
  80: { label: "बारिश की बौछार", symbol: "☂" },
  81: { label: "तेज बौछार", symbol: "☂" },
  82: { label: "बहुत तेज बौछार", symbol: "☂" },
  95: { label: "आंधी-तूफान", symbol: "⚡" },
  96: { label: "ओले के साथ तूफान", symbol: "⚡" },
  99: { label: "तेज ओलावृष्टि", symbol: "⚡" }
};

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
  locate: document.querySelector("#current-location"),
  status: document.querySelector("#weather-status"),
  content: document.querySelector("#weather-content"),
  cropTabs: document.querySelector("#crop-tabs"),
  advisoryGrid: document.querySelector("#advisory-grid")
};

const state = {
  location: DEFAULT_LOCATION,
  weather: null,
  crop: "धान"
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || { label: "मौसम जानकारी", symbol: "◌" };
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, fallback = "--") {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function formatHour(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("hi-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDay(value, index) {
  if (index === 0) return "आज";
  if (index === 1) return "कल";
  return new Intl.DateTimeFormat("hi-IN", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

function windDirection(degrees) {
  const labels = ["उत्तर", "उत्तर-पूर्व", "पूर्व", "दक्षिण-पूर्व", "दक्षिण", "दक्षिण-पश्चिम", "पश्चिम", "उत्तर-पश्चिम"];
  const normalized = ((finiteNumber(degrees) % 360) + 360) % 360;
  return labels[Math.round(normalized / 45) % labels.length];
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setStatus(message, type = "loading") {
  elements.status.hidden = false;
  elements.status.classList.toggle("is-error", type === "error");
  const messageNode = elements.status.querySelector("strong");
  if (messageNode) messageNode.textContent = message;
}

function hideStatus() {
  elements.status.hidden = true;
  elements.status.classList.remove("is-error");
}

async function fetchJson(url, timeout = 14000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const data = await response.json();
    if (data?.error) throw new Error(data.reason || "Weather service error");
    return data;
  } finally {
    window.clearTimeout(timeoutId);
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
    forecast_days: "7"
  });

  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

async function searchLocation(query) {
  const normalized = query.trim().toLowerCase();
  if (["lagma", "lagma saharsa", "lagma, saharsa", "लगमा"].includes(normalized)) {
    return DEFAULT_LOCATION;
  }

  const params = new URLSearchParams({
    name: query.trim(),
    count: "10",
    language: "hi",
    format: "json"
  });
  const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  const results = Array.isArray(data.results) ? data.results : [];
  const result = results.find((item) => item.country_code === "IN") || results[0];

  if (!result) throw new Error("यह जगह नहीं मिली। जिला या शहर का सही नाम लिखें।");

  const area = [result.name, result.admin2 || result.admin1].filter(Boolean).join(", ");
  return {
    name: area,
    latitude: result.latitude,
    longitude: result.longitude
  };
}

function currentHourlyIndex(data) {
  const times = data.hourly?.time || [];
  const current = new Date(data.current?.time || Date.now()).getTime();
  const nextIndex = times.findIndex((time) => new Date(time).getTime() >= current);
  return nextIndex >= 0 ? nextIndex : 0;
}

function renderCurrent(data, location) {
  const current = data.current || {};
  const daily = data.daily || {};
  const info = weatherInfo(current.weather_code);
  const hourlyIndex = currentHourlyIndex(data);
  const soil = data.hourly?.soil_moisture_9_to_27cm?.[hourlyIndex];

  setText("#current-location-name", location.name);
  setText("#current-temperature", round(current.temperature_2m));
  setText("#current-condition", info.label);
  setText("#condition-mark", info.symbol);
  setText("#weather-updated", `अपडेट ${formatHour(current.time || new Date())} • Asia/Kolkata`);
  setText("#today-high", `${round(daily.temperature_2m_max?.[0])}°`);
  setText("#today-low", `${round(daily.temperature_2m_min?.[0])}°`);
  setText("#today-rain", `${round(daily.precipitation_probability_max?.[0])}%`);
  setText("#feels-like", `${round(current.apparent_temperature)}°C`);
  setText("#humidity", `${round(current.relative_humidity_2m)}%`);
  setText("#wind-speed", `${round(current.wind_speed_10m)} km/h`);
  setText("#wind-direction", windDirection(current.wind_direction_10m));
  setText("#wind-gust", `${round(current.wind_gusts_10m)} km/h`);
  setText("#rain-sum", `${finiteNumber(daily.precipitation_sum?.[0]).toFixed(1)} mm`);
  setText("#soil-moisture", Number.isFinite(Number(soil)) ? `${Math.round(Number(soil) * 100)}%` : "उपलब्ध नहीं");
}

function buildAlerts(data) {
  const daily = data.daily || {};
  const todayCode = finiteNumber(daily.weather_code?.[0]);
  const rainProbability = finiteNumber(daily.precipitation_probability_max?.[0]);
  const rainSum = finiteNumber(daily.precipitation_sum?.[0]);
  const maxTemperature = finiteNumber(daily.temperature_2m_max?.[0]);
  const gust = finiteNumber(daily.wind_gusts_10m_max?.[0]);
  const uv = finiteNumber(daily.uv_index_max?.[0]);
  const alerts = [];

  if (todayCode >= 95) {
    alerts.push({ level: "danger", title: "आंधी या बिजली की संभावना", text: "खुले खेत, पेड़ और बिजली के खंभों से दूर सुरक्षित जगह लें।" });
  }
  if (rainSum >= 20 || rainProbability >= 80) {
    alerts.push({ level: rainSum >= 35 ? "danger" : "warn", title: "भारी बारिश पर नजर", text: `${rainProbability}% संभावना और लगभग ${rainSum.toFixed(1)} mm वर्षा का forecast है। निकास देखें।` });
  }
  if (gust >= 40) {
    alerts.push({ level: gust >= 55 ? "danger" : "warn", title: "तेज हवा", text: `हवा के झोंके ${round(gust)} km/h तक जा सकते हैं। spray और खुले ढांचे रोकें।` });
  }
  if (maxTemperature >= 39) {
    alerts.push({ level: maxTemperature >= 42 ? "danger" : "warn", title: "गर्मी का दबाव", text: `अधिकतम तापमान ${round(maxTemperature)}°C है। दोपहर का खेत काम कम रखें।` });
  }
  if (uv >= 8) {
    alerts.push({ level: "warn", title: "तेज धूप", text: `UV index ${round(uv)} तक है। सुबह या शाम का समय चुनें और पानी साथ रखें।` });
  }

  return alerts;
}

function renderAlerts(data) {
  const alerts = buildAlerts(data);
  const section = document.querySelector("#weather-alerts");
  const list = document.querySelector("#alert-list");
  section.hidden = alerts.length === 0;
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
  const end = Math.min(start + 12, hourly.time?.length || 0);
  const items = [];

  for (let index = start; index < end; index += 1) {
    const info = weatherInfo(hourly.weather_code?.[index]);
    items.push(`
      <article class="hour-card">
        <time datetime="${hourly.time[index]}">${index === start ? "अब" : formatHour(hourly.time[index])}</time>
        <span class="weather-symbol" aria-hidden="true">${info.symbol}</span>
        <strong>${round(hourly.temperature_2m?.[index])}°C</strong>
        <span class="rain-value">बारिश ${round(hourly.precipitation_probability?.[index])}%</span>
        <small>झोंका ${round(hourly.wind_gusts_10m?.[index])} km/h</small>
      </article>
    `);
  }

  document.querySelector("#hourly-strip").innerHTML = items.join("");
}

function renderDaily(data) {
  const daily = data.daily || {};
  const cards = (daily.time || []).map((date, index) => {
    const info = weatherInfo(daily.weather_code?.[index]);
    return `
      <article class="day-card${index === 0 ? " is-today" : ""}">
        <time datetime="${date}">${formatDay(date, index)}</time>
        <span class="weather-symbol" aria-hidden="true">${info.symbol}</span>
        <strong>${round(daily.temperature_2m_max?.[index])}° / ${round(daily.temperature_2m_min?.[index])}°</strong>
        <span class="rain-value">बारिश ${round(daily.precipitation_probability_max?.[index])}%</span>
        <small>${finiteNumber(daily.precipitation_sum?.[index]).toFixed(1)} mm • हवा ${round(daily.wind_speed_10m_max?.[index])} km/h</small>
      </article>
    `;
  });
  document.querySelector("#daily-grid").innerHTML = cards.join("");
}

function advisoryCards(data, crop) {
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const start = currentHourlyIndex(data);
  const end = Math.min(start + 6, hourly.time?.length || 0);
  const nextRain = (hourly.precipitation_probability || []).slice(start, end).map(finiteNumber);
  const nextGusts = (hourly.wind_gusts_10m || []).slice(start, end).map(finiteNumber);
  const nextCodes = (hourly.weather_code || []).slice(start, end).map(finiteNumber);
  const maxRainSoon = Math.max(0, ...nextRain);
  const maxGustSoon = Math.max(0, ...nextGusts);
  const thunderSoon = nextCodes.some((code) => code >= 95);
  const rainToday = finiteNumber(daily.precipitation_sum?.[0]);
  const rainChance = finiteNumber(daily.precipitation_probability_max?.[0]);
  const maxTemperature = finiteNumber(daily.temperature_2m_max?.[0]);
  const hourlyIndex = currentHourlyIndex(data);
  const soil = Number(hourly.soil_moisture_9_to_27cm?.[hourlyIndex]);

  let spray;
  if (thunderSoon || maxRainSoon >= 45 || maxGustSoon >= 25) {
    spray = { type: "stop", label: "अभी रोकें", title: "छिड़काव का समय ठीक नहीं", text: `अगले 6 घंटे में बारिश ${round(maxRainSoon)}% और झोंका ${round(maxGustSoon)} km/h तक है।` };
  } else if (maxRainSoon >= 25 || maxGustSoon >= 18) {
    spray = { type: "warn", label: "सावधानी", title: "छोटी सुरक्षित window चुनें", text: "दवा label का rain-free और wind limit देखें; हवा बढ़े तो spray बंद करें।" };
  } else {
    spray = { type: "good", label: "Field check", title: "मौसम अपेक्षाकृत अनुकूल", text: "पत्ती सूखी, हवा शांत और अगले घंटों में बारिश कम हो तभी label के अनुसार spray करें।" };
  }

  let irrigation;
  if (rainToday >= 5 || rainChance >= 65) {
    irrigation = { type: "good", label: "प्रतीक्षा", title: "सिंचाई टालकर बारिश देखें", text: `${rainChance}% बारिश की संभावना है। खेत का निकास और वास्तविक नमी जांचें।` };
  } else if (Number.isFinite(soil) && soil < 0.2) {
    irrigation = { type: "warn", label: "नमी जांचें", title: "मिट्टी सूखी दिख सकती है", text: "Model में जड़ क्षेत्र की नमी कम है। 5-10 cm मिट्टी हाथ से देखकर जरूरत अनुसार सिंचाई करें।" };
  } else {
    irrigation = { type: "good", label: "Field check", title: "पहले खेत की नमी देखें", text: "Forecast अकेले सिंचाई तय नहीं करता। जड़ क्षेत्र और फसल stage देखकर पानी दें।" };
  }

  const heat = maxTemperature >= 39
    ? { type: "stop", label: "गर्मी", title: "दोपहर का काम कम रखें", text: `${round(maxTemperature)}°C तक तापमान है। सुबह/शाम काम करें और पौधों में stress देखें।` }
    : maxTemperature >= 35
      ? { type: "warn", label: "धूप", title: "गर्मी पर नजर रखें", text: "नर्सरी और नई रोपाई में नमी व पत्तियों का झुलसाव देखें।" }
      : { type: "good", label: "तापमान", title: "तापमान सामान्य दायरे में", text: "फिर भी फसल stage और खेत की स्थानीय स्थिति देखकर काम करें।" };

  const disease = finiteNumber(data.current?.relative_humidity_2m) >= 80 && rainChance >= 45
    ? { type: "warn", label: crop, title: "रोग की निगरानी बढ़ाएं", text: `${crop} में अधिक नमी के बाद पत्ती, तना और जड़ पर शुरुआती लक्षण देखें।` }
    : { type: "good", label: crop, title: "फसल की नियमित निगरानी", text: CROP_NOTES[crop] || CROP_NOTES["धान"] };

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

function renderWeather(data, location) {
  state.weather = data;
  state.location = location;
  renderCurrent(data, location);
  renderAlerts(data);
  renderHourly(data);
  renderDaily(data);
  renderAdvisory();
  elements.content.hidden = false;
  hideStatus();
}

async function loadWeather(location) {
  setStatus(`${location.name} का मौसम लाया जा रहा है...`);
  elements.content.hidden = true;

  try {
    const data = await fetchJson(buildForecastUrl(location));
    if (!data.current || !data.hourly || !data.daily) throw new Error("मौसम डेटा पूरा नहीं मिला।");
    renderWeather(data, location);
  } catch (error) {
    const message = error.name === "AbortError"
      ? "मौसम सेवा ने समय पर जवाब नहीं दिया। दोबारा कोशिश करें।"
      : error.message || "मौसम जानकारी नहीं मिल सकी।";
    setStatus(message, "error");
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

elements.form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = elements.input.value.trim();
  if (!query) return;
  setStatus("जगह खोजी जा रही है...");
  elements.content.hidden = true;

  try {
    const location = await searchLocation(query);
    elements.input.value = location.name;
    await loadWeather(location);
  } catch (error) {
    setStatus(error.message || "जगह नहीं मिली।", "error");
  }
});

elements.locate?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("इस browser में location सुविधा उपलब्ध नहीं है।", "error");
    return;
  }

  setStatus("आपकी जगह ली जा रही है...");
  elements.content.hidden = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        name: "मेरी वर्तमान जगह",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      elements.input.value = location.name;
      loadWeather(location);
    },
    () => setStatus("Location अनुमति नहीं मिली। जगह का नाम लिखकर खोजें।", "error"),
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

loadWeather(DEFAULT_LOCATION);
