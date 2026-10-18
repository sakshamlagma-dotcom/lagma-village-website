(function exposeLagmaWeather(root) {
  "use strict";

  const WEATHER_CODES = Object.freeze({
    0: Object.freeze({ label: "साफ आसमान", symbol: "☀", mood: "clear", icon: "sun" }),
    1: Object.freeze({ label: "मुख्यतः साफ", symbol: "🌤", mood: "partly", icon: "cloud-sun" }),
    2: Object.freeze({ label: "आंशिक बादल", symbol: "🌤", mood: "partly", icon: "cloud-sun" }),
    3: Object.freeze({ label: "घने बादल", symbol: "☁", mood: "cloudy", icon: "cloud" }),
    45: Object.freeze({ label: "कोहरा", symbol: "≋", mood: "fog", icon: "cloud-fog" }),
    48: Object.freeze({ label: "पाला जमाने वाला कोहरा", symbol: "≋", mood: "fog", icon: "cloud-fog" }),
    51: Object.freeze({ label: "हल्की बूंदाबांदी", symbol: "🌦", mood: "rain", icon: "cloud-drizzle" }),
    53: Object.freeze({ label: "मध्यम बूंदाबांदी", symbol: "🌦", mood: "rain", icon: "cloud-drizzle" }),
    55: Object.freeze({ label: "घनी बूंदाबांदी", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    56: Object.freeze({ label: "हल्की जमने वाली बूंदाबांदी", symbol: "🌧", mood: "rain", icon: "cloud-drizzle" }),
    57: Object.freeze({ label: "घनी जमने वाली बूंदाबांदी", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    61: Object.freeze({ label: "हल्की बारिश", symbol: "🌦", mood: "rain", icon: "cloud-rain" }),
    63: Object.freeze({ label: "मध्यम बारिश", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    65: Object.freeze({ label: "तेज बारिश", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    66: Object.freeze({ label: "हल्की जमने वाली बारिश", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    67: Object.freeze({ label: "तेज जमने वाली बारिश", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    71: Object.freeze({ label: "हल्की बर्फबारी", symbol: "❄", mood: "snow", icon: "cloud-snow" }),
    73: Object.freeze({ label: "मध्यम बर्फबारी", symbol: "❄", mood: "snow", icon: "cloud-snow" }),
    75: Object.freeze({ label: "तेज बर्फबारी", symbol: "❄", mood: "snow", icon: "cloud-snow" }),
    77: Object.freeze({ label: "बर्फ के दाने", symbol: "❄", mood: "snow", icon: "cloud-snow" }),
    80: Object.freeze({ label: "हल्की बारिश की बौछार", symbol: "🌦", mood: "rain", icon: "cloud-rain" }),
    81: Object.freeze({ label: "मध्यम बारिश की बौछार", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    82: Object.freeze({ label: "बहुत तेज बारिश की बौछार", symbol: "🌧", mood: "rain", icon: "cloud-rain" }),
    85: Object.freeze({ label: "हल्की बर्फीली बौछार", symbol: "🌨", mood: "snow", icon: "cloud-snow" }),
    86: Object.freeze({ label: "तेज बर्फीली बौछार", symbol: "🌨", mood: "snow", icon: "cloud-snow" }),
    95: Object.freeze({ label: "गरज-चमक के साथ तूफान", symbol: "⛈", mood: "storm", icon: "cloud-lightning" }),
    96: Object.freeze({ label: "हल्के ओलों के साथ तूफान", symbol: "⛈", mood: "storm", icon: "cloud-lightning" }),
    97: Object.freeze({ label: "तेज गरज-चमक वाला तूफान", symbol: "⛈", mood: "storm", icon: "cloud-lightning" }),
    99: Object.freeze({ label: "तेज ओलों के साथ तूफान", symbol: "⛈", mood: "storm", icon: "cloud-lightning" })
  });

  function numberOrNull(value) {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function weatherInfo(code) {
    const number = numberOrNull(code);
    return Number.isInteger(number) && WEATHER_CODES[number]
      ? WEATHER_CODES[number]
      : Object.freeze({ label: "मौसम जानकारी उपलब्ध नहीं", symbol: "◌", mood: "unknown", icon: "help-circle" });
  }

  function isWeatherCode(code) {
    const number = numberOrNull(code);
    return Number.isInteger(number) && Object.hasOwn(WEATHER_CODES, number);
  }

  const api = Object.freeze({
    WEATHER_CODES,
    numberOrNull,
    weatherInfo,
    isWeatherCode,
    formatValue(value, unit = "", digits = 0) {
      const number = numberOrNull(value);
      return number === null ? "उपलब्ध नहीं" : `${digits ? number.toFixed(digits) : Math.round(number)}${unit}`;
    }
  });

  root.LagmaWeather = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis === "undefined" ? window : globalThis);
