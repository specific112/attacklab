interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };

  // Browser detection
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";

  // OS detection
  let os = "Unknown";
  if (ua.includes("Windows NT 10")) os = "Windows 10/11";
  else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (ua.includes("Windows NT 6.2")) os = "Windows 8";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Windows")) os = "Windows";
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
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("CrOS")) os = "Chrome OS";

  // Device detection
  let device = "Desktop";
  if (ua.includes("Mobile") || ua.includes("Android") && !ua.includes("Tablet")) device = "Mobile";
  else if (ua.includes("iPad") || ua.includes("Tablet")) device = "Tablet";

  return { browser, os, device };
}
