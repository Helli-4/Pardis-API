import { load } from "cheerio";
import { CONSTANTS, normalizeCookie, createHeaders } from "./utils.js";

async function Get_User_Data(cookiePair) {
  const cookieHeader = normalizeCookie(cookiePair);
  const url = `${CONSTANTS.DEFAULT_ORIGIN}/pds/home.php`;

  const headers = createHeaders(cookieHeader, {
    Referer: CONSTANTS.DEFAULT_REFERER,
  });

  const res = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(
      `Failed to load home page: ${res.status} ${res.statusText}`
    );
  }

  const html = await res.text();
  if (/user\/login|portal\/user\/login|name="pass"/i.test(html)) {
    throw new Error("Authentication failed — invalid or expired cookie");
  }

  const $ = load(html);
  const data = {};

  const imgEl = $(".mainblock img[src*='image.php']").first();
  if (imgEl.length) {
    let imgSrc = imgEl.attr("src").trim();
    if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;
    if (imgSrc.startsWith("/")) imgSrc = `${CONSTANTS.DEFAULT_ORIGIN}${imgSrc}`;
    data.profileImage = imgSrc;
  }

  const info = {};
  $(".mainblock table.table-condensed:first tr").each((i, row) => {
    const key = $(row).find("th").text().trim();
    const val = $(row).find("td").text().trim();
    if (key && val) info[key] = val;
  });

  data.userId = info["شناسه کاربری:"] || null;
  data.fullName = info["نام:"] || null;
  data.role = info["سمت:"] || null;
  data.group = info["گروه:"] || null;

  return data;
}

export { Get_User_Data };
