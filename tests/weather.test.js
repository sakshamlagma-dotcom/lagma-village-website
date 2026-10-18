import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const utilSource = await readFile(path.join(root, "weather-utils.js"), "utf8");
const pageSource = await readFile(path.join(root, "kissan-help", "mausam.js"), "utf8");
const homeSource = await readFile(path.join(root, "weather-home.js"), "utf8");
const requestedCodes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];

function createPageContext({ fetch = async () => { throw new Error("unexpected fetch"); }, storage = new Map() } = {}) {
  const nodes = new Map();
  const document = { querySelector: (selector) => nodes.get(selector) || null };
  const memoryStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  };
  const context = vm.createContext({
    document,
    window: { setTimeout, clearTimeout },
    navigator: {},
    fetch,
    localStorage: memoryStorage,
    URLSearchParams,
    AbortController,
    Intl,
    Date,
    Math,
    Number,
    Promise,
    setTimeout,
    clearTimeout,
    console
  });
  vm.runInContext(utilSource, context, { filename: "weather-utils.js" });
  const beforeStartup = pageSource.slice(0, pageSource.indexOf("elements.menu?.addEventListener"));
  vm.runInContext(`${beforeStartup}\nglobalThis.__weather = { DEFAULT_LOCATION, WEATHER_CODES, WEATHER_CACHE_MAX_AGE, validForecast, locationCacheKey, readWeatherCache, currentHourlyIndex, renderCurrent, renderHourly, renderDaily, buildAlerts, advisoryCards, buildForecastUrl, searchLocation, fetchJson, formatHour, windDirection };`, context, { filename: "mausam.js" });
  return { context, weather: context.__weather, storage, nodes, document };
}

function node() {
  return { textContent: "", innerHTML: "", hidden: false };
}

function validCurrent(overrides = {}) {
  return { current: { temperature_2m: 21, weather_code: 1, time: "2026-10-18T09:00" }, ...overrides };
}

function homeHarness({ fetch = async () => ({ ok: true, json: async () => ({ current: { temperature_2m: 16, weather_code: 3 } }) }), storage = new Map(), timerScale = 4 } = {}) {
  const badge = { dataset: {}, attributes: {}, children: [], states: new Set(), iconMarkup: "", scene: null };
  const temperature = { textContent: "—" };
  const condition = { textContent: "मौसम लोड हो रहा है…" };
  const icon = { set outerHTML(value) { badge.iconMarkup = value; } };
  const iconMap = new Map([["#home-weather-temp", temperature], ["#home-weather-condition", condition], ["[data-weather-icon]", icon]]);
  badge.querySelector = (selector) => selector === ".weather-scene" ? badge.scene : iconMap.get(selector) || null;
  badge.setAttribute = (name, value) => { badge.attributes[name] = value; };
  badge.prepend = (element) => { badge.scene = element; badge.children.unshift(element); };
  badge.classList = {
    remove(...names) { names.forEach((name) => badge.states.delete(name)); },
    add(name) { badge.states.add(name); }
  };
  const memoryStorage = {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); }
  };
  const context = vm.createContext({
    URLSearchParams,
    Date,
    Math,
    Number,
    Array,
    AbortController,
    Promise,
    fetch,
    localStorage: memoryStorage,
    document: { createElement: (tagName) => ({ tagName, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }) },
    lucide: { createIcons() {} },
    setTimeout: (callback, milliseconds) => setTimeout(callback, milliseconds >= 12000 ? timerScale : milliseconds),
    clearTimeout
  });
  context.window = context;
  vm.runInContext(utilSource, context, { filename: "weather-utils.js" });
  vm.runInContext(homeSource, context, { filename: "weather-home.js" });
  context.LagmaHomeWeather.init(badge);
  return { context, badge, temperature, condition, storage };
}

test("WMO weather codes have descriptions, symbols, moods, and icons", () => {
  const { context } = createPageContext();
  for (const code of requestedCodes) {
    const info = context.LagmaWeather.weatherInfo(code);
    assert.ok(info.label.length > 0, `code ${code} description`);
    assert.ok(info.symbol.length > 0, `code ${code} symbol`);
    assert.ok(["clear", "partly", "cloudy", "fog", "rain", "snow", "storm"].includes(info.mood), `code ${code} mood`);
    assert.ok(info.icon.length > 0, `code ${code} icon`);
  }
  assert.equal(context.LagmaWeather.weatherInfo(null).mood, "unknown");
  assert.equal(context.LagmaWeather.weatherInfo(1234).mood, "unknown");
  assert.equal(context.LagmaWeather.isWeatherCode("0"), true);
  assert.equal(context.LagmaWeather.isWeatherCode(""), false);
});

test("missing and malformed numeric values stay unavailable while valid zero remains zero", () => {
  const { context, weather } = createPageContext();
  assert.equal(context.LagmaWeather.numberOrNull(null), null);
  assert.equal(context.LagmaWeather.numberOrNull(""), null);
  assert.equal(context.LagmaWeather.numberOrNull("NaN"), null);
  assert.equal(context.LagmaWeather.numberOrNull(0), 0);
  assert.equal(weather.windDirection(null), "दिशा उपलब्ध नहीं");
  assert.equal(weather.windDirection(0), "उत्तर");
});

test("forecast validation accepts only finite current temperature and a known code", () => {
  const { weather } = createPageContext();
  assert.equal(weather.validForecast(validCurrent()), true);
  assert.equal(weather.validForecast(validCurrent({ current: { temperature_2m: null, weather_code: 0 } })), false);
  assert.equal(weather.validForecast(validCurrent({ current: { temperature_2m: 12, weather_code: null } })), false);
  assert.equal(weather.validForecast(validCurrent({ current: { temperature_2m: 90, weather_code: 0 } })), false);
  assert.equal(weather.validForecast(validCurrent({ current: { temperature_2m: 0, weather_code: 0 } })), true);
});

test("Lagma stays the default and its coordinates match the documented village point", async () => {
  const { weather } = createPageContext();
  assert.deepEqual({ ...weather.DEFAULT_LOCATION }, { name: "Lagma, Saharsa", latitude: 25.7489959, longitude: 86.6731798 });
  assert.deepEqual({ ...await weather.searchLocation("Lagma, Saharsa, Bihar") }, { name: "Lagma, Saharsa", latitude: 25.7489959, longitude: 86.6731798 });
  const url = new URL(weather.buildForecastUrl(weather.DEFAULT_LOCATION));
  assert.equal(url.searchParams.get("latitude"), "25.7489959");
  assert.equal(url.searchParams.get("longitude"), "86.6731798");
  assert.equal(url.searchParams.get("timezone"), "Asia/Kolkata");
  assert.equal(url.searchParams.get("wind_speed_unit"), "kmh");
  assert.equal(url.searchParams.get("precipitation_unit"), "mm");
});

test("hourly selection matches local API timestamps and handles empty or past arrays", () => {
  const { weather } = createPageContext();
  const hours = ["2026-10-18T08:00", "2026-10-18T09:00", "2026-10-18T10:00"];
  assert.equal(weather.currentHourlyIndex({ current: { time: "2026-10-18T09:00" }, hourly: { time: hours } }), 1);
  assert.equal(weather.currentHourlyIndex({ current: { time: "2026-10-18T12:00" }, hourly: { time: hours } }), 2);
  assert.equal(weather.currentHourlyIndex({ current: {}, hourly: { time: hours } }), 0);
  assert.equal(weather.currentHourlyIndex({ current: {}, hourly: { time: [] } }), -1);
  assert.match(weather.formatHour("2026-10-18T09:00"), /9:00|०९:००/);
});

test("missing forecast series render unavailable labels instead of fabricated zeros", () => {
  const { context, weather, nodes } = createPageContext();
  for (const selector of ["#current-location-name", "#current-temperature", "#current-condition", "#condition-mark", "#weather-updated", "#today-high", "#today-low", "#today-rain", "#feels-like", "#humidity", "#wind-speed", "#wind-direction", "#wind-gust", "#rain-sum", "#soil-moisture", "#hourly-strip", "#daily-grid"]) nodes.set(selector, node());
  weather.renderCurrent({ current: { temperature_2m: 0, weather_code: 0 }, hourly: {}, daily: { temperature_2m_max: [null], temperature_2m_min: [null], precipitation_probability_max: [null], precipitation_sum: [null] } }, weather.DEFAULT_LOCATION);
  assert.equal(String(nodes.get("#current-temperature").textContent), "0");
  assert.equal(nodes.get("#today-rain").textContent, "उपलब्ध नहीं");
  assert.equal(nodes.get("#wind-speed").textContent, "उपलब्ध नहीं");
  assert.equal(nodes.get("#wind-direction").textContent, "दिशा उपलब्ध नहीं");
  assert.equal(nodes.get("#rain-sum").textContent, "उपलब्ध नहीं");
  assert.equal(nodes.get("#soil-moisture").textContent, "उपलब्ध नहीं");
  weather.renderCurrent({ current: { temperature_2m: 0, weather_code: 0 }, daily: { temperature_2m_max: [0], temperature_2m_min: [0], precipitation_probability_max: [0], precipitation_sum: [0] } }, weather.DEFAULT_LOCATION);
  assert.equal(nodes.get("#today-rain").textContent, "0%");
  assert.equal(nodes.get("#rain-sum").textContent, "0.0 mm");
  weather.renderHourly({ hourly: { time: ["2026-10-18T09:00"] } });
  assert.match(nodes.get("#hourly-strip").innerHTML, /उपलब्ध नहीं/);
  assert.doesNotMatch(nodes.get("#hourly-strip").innerHTML, />0°C|बारिश 0%|झोंका 0 km\/h/);
  weather.renderDaily({ daily: { time: ["2026-10-18"] } });
  assert.match(nodes.get("#daily-grid").innerHTML, /उपलब्ध नहीं/);
  assert.doesNotMatch(nodes.get("#daily-grid").innerHTML, />0°|बारिश 0%|0\.0 mm/);
  assert.ok(context.LagmaWeather);
});

test("missing alerts and advisory inputs produce uncertainty, not false safe readings", () => {
  const { weather } = createPageContext();
  const alerts = weather.buildAlerts({ current: validCurrent().current, daily: {} });
  assert.deepEqual(Array.from(alerts, (alert) => alert.title), ["जोखिम जांच अधूरी"]);
  const cards = weather.advisoryCards({ current: { relative_humidity_2m: null }, daily: {}, hourly: {} }, "धान");
  assert.equal(cards.length, 4);
  assert.match(cards[0].title, /सलाह उपलब्ध नहीं/);
  assert.match(cards[1].title, /सलाह उपलब्ध नहीं/);
  assert.match(cards[2].title, /सलाह उपलब्ध नहीं/);
  assert.match(cards[3].title, /जांच अधूरी/);
  const zeroRain = weather.advisoryCards({ current: { relative_humidity_2m: 0 }, daily: { precipitation_sum: [0], precipitation_probability_max: [0], temperature_2m_max: [0] }, hourly: { time: ["2026-10-18T09:00", "2026-10-18T10:00", "2026-10-18T11:00", "2026-10-18T12:00", "2026-10-18T13:00", "2026-10-18T14:00"], precipitation_probability: [0, 0, 0, 0, 0, 0], wind_gusts_10m: [0, 0, 0, 0, 0, 0], weather_code: [0, 0, 0, 0, 0, 0], soil_moisture_9_to_27cm: [0] } }, "धान");
  assert.match(zeroRain[0].text, /model estimate/);
  assert.match(zeroRain[1].title, /जोखिम कम/);
  assert.match(zeroRain[1].text, /गारंटी नहीं/);
});

test("weather cache accepts only valid, recent, non-future records", () => {
  const now = Date.now();
  const location = { latitude: 25.7489959, longitude: 86.6731798 };
  const key = `lagma-weather-v2:${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
  const valid = { data: validCurrent({ hourly: {}, daily: {} }), savedAt: now - 1000 };
  const store = new Map([[key, JSON.stringify(valid)]]);
  let { weather } = createPageContext({ storage: store });
  assert.equal(weather.readWeatherCache(location).fresh, true);
  store.set(key, "{");
  assert.equal(weather.readWeatherCache(location), null);
  store.set(key, JSON.stringify({ ...valid, savedAt: now + 10000 }));
  assert.equal(weather.readWeatherCache(location), null);
  store.set(key, JSON.stringify({ ...valid, savedAt: now - weather.WEATHER_CACHE_MAX_AGE - 1 }));
  assert.equal(weather.readWeatherCache(location).fresh, false);
  store.set(key, JSON.stringify({ ...valid, data: validCurrent({ current: { temperature_2m: null, weather_code: 0 } }) }));
  assert.equal(weather.readWeatherCache(location), null);
});

test("geocoding prefers Indian results, returns ambiguity for user choice, and handles no matches", async () => {
  let requestedUrl = "";
  const response = (payload) => ({ ok: true, json: async () => payload });
  const single = createPageContext({ fetch: async (url) => { requestedUrl = url; return response({ results: [
    { name: "Delhi", country_code: "IN", latitude: 28.6, longitude: 77.2 },
    { name: "Delhi", country_code: "US", latitude: 39.7, longitude: -75.5 }
  ] }); } });
  assert.equal((await single.weather.searchLocation("Delhi")).name, "Delhi");
  assert.equal(new URL(requestedUrl).searchParams.get("countryCode"), "IN");
  const ambiguous = createPageContext({ fetch: async () => response({ results: [
    { name: "Lagma", admin2: "Saharsa", admin1: "Bihar", country_code: "IN", latitude: 25.749, longitude: 86.673 },
    { name: "Lagma Patti", admin2: "Saharsa", admin1: "Bihar", country_code: "IN", latitude: 25.75, longitude: 86.67 }
  ] }) });
  const choices = await ambiguous.weather.searchLocation("Lagma village");
  assert.equal(choices.choices.length, 2);
  const missing = createPageContext({ fetch: async () => response({ results: [] }) });
  await assert.rejects(missing.weather.searchLocation("No Such Place"), /यह जगह नहीं मिली/);
});

test("forecast requests handle HTTP errors, malformed JSON, and timeouts", async () => {
  const httpError = createPageContext({ fetch: async () => ({ ok: false, status: 503 }) });
  await assert.rejects(httpError.weather.fetchJson("https://example.test", 100), /HTTP 503/);
  const malformed = createPageContext({ fetch: async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } }) });
  await assert.rejects(malformed.weather.fetchJson("https://example.test", 100), SyntaxError);
  const timeout = createPageContext({ fetch: () => new Promise(() => {}) });
  await assert.rejects(timeout.weather.fetchJson("https://example.test", 10), { name: "TimeoutError" });
});

test("homepage weather succeeds, maps icons, and saves a valid cache record", async () => {
  const app = homeHarness();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(app.temperature.textContent, "16°C");
  assert.match(app.condition.textContent, /बादल/);
  assert.match(app.badge.iconMarkup, /data-lucide="cloud"/);
  assert.equal(app.badge.dataset.weatherState, "loaded");
  assert.ok(app.storage.has("lagma-home-weather-v2"));
});

test("homepage weather failure, HTTP error, malformed JSON, missing fields, and timeout show a usable fallback", async (t) => {
  const cases = [
    ["network error", async () => { throw new Error("offline"); }],
    ["HTTP error", async () => ({ ok: false, status: 500 })],
    ["malformed JSON", async () => ({ ok: true, json: async () => { throw new SyntaxError("bad JSON"); } })],
    ["missing temperature", async () => ({ ok: true, json: async () => ({ current: { weather_code: 0 } }) })],
    ["missing weather code", async () => ({ ok: true, json: async () => ({ current: { temperature_2m: 20 } }) })]
  ];
  for (const [name, fetch] of cases) await t.test(name, async () => {
    const app = homeHarness({ fetch });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(app.temperature.textContent, "—");
    assert.equal(app.badge.dataset.weatherState, "error");
    assert.match(app.condition.textContent, /फिर से खोलें/);
    assert.match(app.badge.attributes["aria-label"], /फिर से खोलें/);
  });
  const timed = homeHarness({ fetch: () => new Promise(() => {}), timerScale: 8 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(timed.badge.dataset.weatherState, "error");
  assert.match(timed.condition.textContent, /फिर से खोलें/);
});

test("homepage cache validates freshness, expiry, future dates, and malformed storage", async (t) => {
  const now = Date.now();
  const current = { temperature: 0, code: 0, savedAt: now - 1000 };
  const cases = [
    ["fresh valid zero", JSON.stringify(current), "loaded", false],
    ["invalid JSON", "{", "error", true],
    ["missing temperature", JSON.stringify({ code: 0, savedAt: now }), "error", true],
    ["missing weather code", JSON.stringify({ temperature: 12, savedAt: now }), "error", true],
    ["future timestamp", JSON.stringify({ ...current, savedAt: now + 5000 }), "error", true],
    ["expired record", JSON.stringify({ ...current, savedAt: now - 16 * 60 * 1000 }), "stale", true]
  ];
  for (const [name, record, expectedState, shouldFetch] of cases) await t.test(name, async () => {
    let requests = 0;
    const cache = new Map([["lagma-home-weather-v2", record]]);
    const fetch = async () => { requests += 1; throw new Error("offline"); };
    const app = homeHarness({ fetch, storage: cache });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(app.badge.dataset.weatherState, expectedState);
    assert.equal(requests > 0, shouldFetch);
    if (name === "fresh valid zero") assert.equal(app.temperature.textContent, "0°C");
    if (name === "expired record") assert.match(app.condition.textContent, /पुराना डेटा/);
  });
});

test("weather page CSS retains narrow layouts, visible focus, and reduced-motion support", async () => {
  const css = await readFile(path.join(root, "kissan-help", "mausam.css"), "utf8");
  const homeCss = await readFile(path.join(root, "style.css"), "utf8");
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /\.location-choice:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(homeCss, /\.home-weather-badge:focus-visible/);
  const page = await readFile(path.join(root, "kissan-help", "mausam.html"), "utf8");
  const script = await readFile(path.join(root, "kissan-help", "mausam.js"), "utf8");
  assert.match(script, /id = "retry-weather"/);
  assert.match(page, /id="location-results"/);
});
