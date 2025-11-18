import { CONSTANTS, extractAttrValue } from "./utils.js";

async function GetToken(username, password) {
  if (!username || typeof username !== "string") {
    throw new Error("Username is required and must be a string");
  }
  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }

  const getRes = await fetch(CONSTANTS.LOGIN_URL, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
  });

  const loginPageHtml = await getRes.text();

  const form_build_id = extractAttrValue(loginPageHtml, "form_build_id");
  if (!form_build_id) {
    throw new Error(
      `Could not extract form_build_id from login page. Status: ${getRes.status}`
    );
  }

  const postBody = new URLSearchParams();
  postBody.append("name", username);
  postBody.append("pass", password);
  postBody.append("form_build_id", form_build_id);
  postBody.append("form_id", "user_login");
  postBody.append("op", "ورود");

  const postRes = await fetch(CONSTANTS.LOGIN_URL, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: CONSTANTS.LOGIN_URL,
    },
    body: postBody.toString(),
    redirect: "manual",
  });

  const status = postRes.status;

  const scHeader = postRes.headers.get("set-cookie");
  let cookieHeader = null;

  if (scHeader) {
    try {
      const pairs = [];
      const re = /([^=;,\s]+)=([^;,\s]+)/g;
      let m;
      while ((m = re.exec(scHeader)) !== null) {
        pairs.push(`${m[1]}=${m[2]}`);
      }
      if (pairs.length > 0) {
        cookieHeader = pairs.join("; ");
      }
    } catch (error) {
      console.warn("Error parsing set-cookie header:", error.message);
    }
  }

  if (!cookieHeader) {
    try {
      const text = await postRes.text();

      if (/name=["']pass['"]|portal\/user\/login|حساب کاربری/i.test(text)) {
        throw new Error(
          `Login POST did not produce Set-Cookie header (login likely failed). Status: ${status}. ` +
            "Possible causes: wrong credentials, incorrect 'op' value, or server blocked automated requests. " +
            "If the site sets multiple cookies, consider using axios/undici to capture all Set-Cookie headers."
        );
      }

      const followRes = await fetch(CONSTANTS.LOGIN_URL, {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: CONSTANTS.LOGIN_URL,
        },
        body: postBody.toString(),
        redirect: "follow",
      });
      const sc2 = followRes.headers.get("set-cookie");
      if (sc2) {
        const pairs = [];
        const re = /([^=;,\s]+)=([^;,\s]+)/g;
        let m;
        while ((m = re.exec(sc2)) !== null) pairs.push(`${m[1]}=${m[2]}`);
        if (pairs.length) cookieHeader = pairs.join("; ");
      }
    } catch (error) {
      if (error.message.includes("login likely failed")) {
        throw error;
      }
      throw new Error(`Error processing login response: ${error.message}`);
    }
  }

  if (!cookieHeader) {
    throw new Error(
      `Login did not produce usable cookie header. Status: ${status}.`
    );
  }

  return cookieHeader;
}

export { GetToken };
