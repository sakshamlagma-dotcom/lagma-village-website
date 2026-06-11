(function () {
  const measurementId = document.querySelector('meta[name="google-analytics-id"]')?.content?.trim();

  if (!measurementId || measurementId === "G-XXXXXXXXXX") {
    window.lagmaAnalyticsReady = false;
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  window.gtag = gtag;
  window.lagmaAnalyticsReady = true;
  gtag("js", new Date());
  gtag("config", measurementId, {
    anonymize_ip: true,
    page_title: document.title,
    page_location: window.location.href
  });
})();
