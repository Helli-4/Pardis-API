export const CONSTANTS = {
  LOGIN_URL: "https://www.helli4.ir/portal/user/login?destination=node/661",
  EXAMS_URL: "https://www.helli4.ir/pds/reportsview.php",
  EXAM_URL_BASE: "https://www.helli4.ir/pds/dmsworkbookview.php",
  DEFAULT_USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  DEFAULT_ACCEPT_HEADER:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  DEFAULT_ACCEPT_LANGUAGE: "en-US,en;q=0.5",
  DEFAULT_CONTENT_TYPE: "application/x-www-form-urlencoded",
  DEFAULT_ORIGIN: "https://www.helli4.ir",
  DEFAULT_REFERER: "https://www.helli4.ir/pds/reportsview.php",
  HOME_URL: "https://www.helli4.ir/pds/home.php",
};

export function normalizeCookie(cookiePair) {
  if (!cookiePair) {
    throw new Error("Cookie is required");
  }

  if (typeof cookiePair === "string") {
    if (!cookiePair.trim()) {
      throw new Error("Cookie string cannot be empty");
    }
    return cookiePair;
  }

  if (
    cookiePair &&
    typeof cookiePair === "object" &&
    cookiePair.name &&
    cookiePair.value
  ) {
    if (!cookiePair.name.trim() || !cookiePair.value.trim()) {
      throw new Error("Cookie name and value cannot be empty");
    }
    return `${cookiePair.name}=${cookiePair.value}`;
  }

  throw new Error(
    "Cookie format not recognized. Provide string 'name=value' or object {name, value}"
  );
}

export function createHeaders(cookieHeader, additionalHeaders = {}) {
  const baseHeaders = {
    "User-Agent": `${CONSTANTS.DEFAULT_USER_AGENT} (compatible; Exam Management System)`,
    Accept: CONSTANTS.DEFAULT_ACCEPT_HEADER,
    "Accept-Language": CONSTANTS.DEFAULT_ACCEPT_LANGUAGE,
    Cookie: cookieHeader,
  };

  return { ...baseHeaders, ...additionalHeaders };
}

export function validateRequired(params, required) {
  for (const param of required) {
    if (!params[param]) {
      throw new Error(`${param} is required`);
    }
  }
}

export function extractAttrValue(html, attrName) {
  if (!html || !attrName) {
    return null;
  }

  const re = new RegExp(
    `name=["']${attrName}["'][^>]*value=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];

  const re2 = new RegExp(
    `value=["']([^"']+)["'][^>]*name=["']${attrName}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}
