(function () {
  try {
    var locales = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"];
    var p = window.location.pathname || "/";
    var seg = p.split("/").filter(Boolean)[0];
    var activeLang = locales.indexOf(seg) >= 0 ? seg : "en";
    document.documentElement.setAttribute("lang", activeLang);

    var t = localStorage.getItem("theme");
    if (!t) {
      var m = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/);
      t = m ? m[1] : null;
    }
    if (!t) t = "dark";
    if (t === "system") {
      t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;

    var manifestHref = activeLang === "en" ? "/manifest.json" : "/manifest." + activeLang + ".json";
    var manifestLink = document.getElementById("app-manifest");
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.id = "app-manifest";
      manifestLink.rel = "manifest";
      var currentScript = document.currentScript;
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(manifestLink, currentScript.nextSibling);
      } else {
        document.head.appendChild(manifestLink);
      }
    }
    manifestLink.href = manifestHref;

    var themeColor = t === "light" ? "#f6f8fa" : "#0a0a1a";
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", themeColor);
  } catch {}
})();
