interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };

  // Browser detection (most specific first)
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
  else if (ua.includes("Brave")) browser = "Brave";
  else if (ua.includes("YaBrowser")) browser = "Yandex";
  else if (ua.includes("UCBrowser") || ua.includes("UCWEB")) browser = "UC Browser";
  else if (ua.includes("QQBrowser")) browser = "QQ Browser";
  else if (ua.includes("Vivaldi")) browser = "Vivaldi";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Opera Mini")) browser = "Opera Mini";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Trident/") || ua.includes("MSIE")) browser = "Internet Explorer";

  // OS detection
  let os = "Unknown";
  if (ua.includes("Windows NT 10")) os = "Windows 10/11";
  else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (ua.includes("Windows NT 6.2")) os = "Windows 8";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Windows NT 6.0")) os = "Windows Vista";
  else if (ua.includes("Windows NT 5.1")) os = "Windows XP";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("HarmonyOS")) os = "HarmonyOS";
  else if (ua.includes("Mac OS X")) {
    const version = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    os = version ? `macOS ${version[1].replace(/_/g, ".")}` : "macOS";
  }
  else if (ua.includes("Android")) {
    const version = ua.match(/Android (\d+[\.\d]*)/);
    os = version ? `Android ${version[1]}` : "Android";
  }
  else if (ua.includes("iPhone") || ua.includes("iPad")) {
    const version = ua.match(/OS (\d+_\d+)/);
    os = version ? `iOS ${version[1].replace("_", ".")}` : "iOS";
  }
  else if (ua.includes("Windows Phone")) os = "Windows Phone";
  else if (ua.includes("CrOS")) os = "Chrome OS";
  else if (ua.includes("Linux")) os = "Linux";

  // Device detection
  let device = "Desktop";
  if (ua.includes("iPad") || ua.includes("Tablet")) device = "Tablet";
  else if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) device = "Mobile";

  return { browser, os, device };
}
