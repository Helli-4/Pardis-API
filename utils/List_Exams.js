import { load } from "cheerio";
import { CONSTANTS, normalizeCookie, createHeaders } from "./utils.js";

async function Get_Exams(cookiePair) {
  const cookieHeader = normalizeCookie(cookiePair);

  const headers = createHeaders(cookieHeader, {
    "Content-Type": CONSTANTS.DEFAULT_CONTENT_TYPE,
    Origin: CONSTANTS.DEFAULT_ORIGIN,
    Referer: CONSTANTS.DEFAULT_REFERER,
  });

  const body = new URLSearchParams();
  body.append("type", "کارنما");
  body.append("fromdate", "1400/06/11");
  body.append("todate", "1404/07/17");
  body.append("action", "view");
  body.append("submit", "نمایش");

  try {
    const res = await fetch(CONSTANTS.EXAMS_URL, {
      method: "POST",
      headers,
      body: body.toString(),
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(
        `HTTP request failed with status ${res.status}: ${res.statusText}`
      );
    }

    const status = res.status;
    const text = await res.text();

    if (/user\/login|portal\/user\/login|name="pass"/i.test(text)) {
      console.warn(
        `Response looks like the login page — authentication probably failed. Check cookie header & login step. Status: ${status}`
      );
    }

    const $ = load(text);
    const exams = [];

    $("#myTable tbody tr").each((i, row) => {
      const $row = $(row);
      const cells = $row.find("td");

      if (cells.length >= 7) {
        const date = $(cells[3]).text().trim();
        const subject = $(cells[4]).text().trim();
        const title = $(cells[5]).text().trim();
        const textCell = $(cells[6]);

        if (subject === "کارنما") {
          const link = textCell.find('a[href*="eid="]');
          if (link.length > 0) {
            const href = link.attr("href") || "";
            const eidMatch = href.match(/[?&]eid=(\d{1,8})/);

            if (eidMatch) {
              const eid = eidMatch[1];
              exams.push({
                eid: eid,
                date: date,
                title: title,
              });
            }
          }
        }
      }
    });

    console.log(`Extracted ${exams.length} exams:`, exams);
    return exams;
  } catch (err) {
    console.error("Error fetching or parsing exams:", err.message);
    throw new Error(`Failed to fetch exams: ${err.message}`);
  }
}

export { Get_Exams };
