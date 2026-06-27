(function () {
  const placeholderId = "G-XXXXXXXXXX";
  const defaultMeasurementId = "G-PZQ45J2B8G";
  const metaMeasurementId = document.querySelector('meta[name="google-analytics-id"]')?.content?.trim();
  const configuredMeasurementId = window.LAGMA_SITE_OPTIONS?.analyticsMeasurementId?.trim();

  const measurementId =
    (metaMeasurementId && metaMeasurementId !== placeholderId && metaMeasurementId) ||
    configuredMeasurementId ||
    defaultMeasurementId;

  if (!/^G-[A-Z0-9]+$/i.test(measurementId)) {
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
    page_location: window.location.href,
    send_page_view: true
  });
})();
