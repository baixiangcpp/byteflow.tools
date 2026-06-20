(function () {
  var supported = ["en","zh-CN","zh-TW","ja","ko","de","fr"];
  var lang = "en";

  function detectBrowserLocale() {
    var raw = (navigator.language || "en").toLowerCase();
    if (raw === "zh-cn" || raw === "zh-sg") return "zh-CN";
    if (raw === "zh-tw" || raw === "zh-hk" || raw === "zh-mo") return "zh-TW";
    if (raw === "zh" || raw.indexOf("zh-") === 0) return "zh-CN";
    if (raw.indexOf("ja") === 0) return "ja";
    if (raw.indexOf("ko") === 0) return "ko";
    if (raw.indexOf("de") === 0) return "de";
    if (raw.indexOf("fr") === 0) return "fr";
    return "en";
  }

  try {
    var saved = localStorage.getItem("byteflow:preferred-locale");
    lang = saved && supported.indexOf(saved) >= 0 ? saved : detectBrowserLocale();
  } catch {
    lang = detectBrowserLocale();
  }

  if (supported.indexOf(lang) < 0) lang = "en";

  var search = window.location.search || "";
  var hash = window.location.hash || "";
  if (search.indexOf("handoff=") >= 0 || search.indexOf("handoff_ref=") >= 0) {
    hash = "#" + search.slice(1);
    search = "";
  }

  window.location.replace("/" + lang + search + hash);
})();
