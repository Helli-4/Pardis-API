import { load } from "cheerio";
import { CONSTANTS, normalizeCookie, createHeaders } from "./utils.js";

async function Get_Exam(eid, cookiePair, selectedUser = "") {
  if (!eid || (typeof eid !== "string" && typeof eid !== "number")) {
    throw new Error("eid is required and must be a string or number");
  }

  const cookieHeader = normalizeCookie(cookiePair);

  const url = `${CONSTANTS.EXAM_URL_BASE}?eid=${encodeURIComponent(
    String(eid)
  )}${
    selectedUser
      ? `&selectedUser=${encodeURIComponent(String(selectedUser))}`
      : ""
  }`;

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
      `HTTP request failed with status ${res.status}: ${res.statusText}`
    );
  }

  const status = res.status;
  const text = await res.text();

  if (
    /user\/login|portal\/user\/login|name="pass"|ورود به سیستم|login/i.test(
      text
    )
  ) {
    console.warn(
      `Warning: response looks like a login page — authentication may have failed. Check cookie token. Status: ${status}`
    );
  }

  const $ = load(text);

  const out = {
    meta: {},
    courses: [],
    overall: {},
    participants: {},
    questionGrid: {
      questionNumbers: [],
      yourAnswers: [],
      correctAnswers: [],
      statuses: [],
      rawCells: [],
    },
    chartData: null,
    httpStatus: status,
    rawHtmlSaved: true,
  };

  try {
    const badges = [];
    $("#printPart .badge").each((i, el) => {
      badges.push($(el).text().trim());
    });
    if (badges.length >= 1) out.meta.student = badges[0] || "";
    if (badges.length >= 2) out.meta.exam = badges[1] || "";
    if (badges.length >= 3) out.meta.class = badges[2] || "";
    if (badges.length >= 4) out.meta.school = badges[3] || "";
  } catch {}

  try {
    const table = $("table.tablesorter").first();
    const rows = table.find("tbody tr");
    rows.each((ri, row) => {
      const $row = $(row);
      const tds = [];
      $row.find("td").each((ci, td) => {
        tds.push($(td).text().trim());
      });

      const c = {};
      if (tds.length > 0) c.index = tds[0] || "";
      if (tds.length > 1) c.name = tds[1] || "";
      if (tds.length > 2) c.score = tds[2] || "";
      if (tds.length > 3) c.type = tds[3] || "";
      if (tds.length > 4) c.tscore = tds[4] || "";
      if (tds.length > 5) c.q_from = tds[5] || "";
      if (tds.length > 6) c.q_to = tds[6] || "";
      if (tds.length > 7) c.coefficient = tds[7] || "";
      if (tds.length > 8) c.avg_class = tds[8] || "";
      if (tds.length > 9) c.avg_school = tds[9] || "";
      if (tds.length > 10) c.avg_total = tds[10] || "";
      if (tds.length > 11) c.rank_class = tds[11] || "";
      if (tds.length > 12) c.rank_school = tds[12] || "";
      if (tds.length > 13) c.rank_total = tds[13] || "";
      if (tds.length > 14) c.maxScore = tds[14] || "";
      if (tds.length > 15) c.firstScore = tds[15] || "";
      if (tds.length > 16) c.correct = tds[16] || "";
      if (tds.length > 17) c.wrong = tds[17] || "";
      if (tds.length > 18) c.unanswered = tds[18] || "";
      if (tds.length > 19) c.deleted = tds[19] || "";

      const links = [];
      $row.find("a[href]").each((i, a) => {
        links.push($(a).attr("href"));
      });
      if (links.length) c.links = links;

      out.courses.push(c);
    });
  } catch {}

  try {
    const table1 = $("#table1 table").first();
    if (table1 && table1.length) {
      const rows = [];
      table1.find("tbody tr").each((i, r) => {
        const cells = [];
        $(r)
          .find("td")
          .each((j, c) => {
            cells.push($(c).text().trim());
          });
        rows.push(cells);
      });
      if (rows.length >= 1) {
        out.overall.score = {
          total: rows[0][1] || "",
          public: rows[0][2] || "",
          private: rows[0][3] || "",
        };
      }
      if (rows.length >= 2) {
        out.overall.tscore = {
          total: rows[1][1] || "",
          public: rows[1][2] || "",
          private: rows[1][3] || "",
        };
      }
    }
  } catch {}

  try {
    const table2 = $("#table2 table").first();
    if (table2 && table2.length) {
      const tableObj = {};
      table2.find("tbody tr").each((ri, rr) => {
        const $rr = $(rr);
        const cells = [];
        $rr.find("td").each((ci, td) => {
          cells.push($(td).text().trim());
        });
        if (/تعداد شرکت کنندگان/.test(cells[0] || "")) {
          tableObj.participants = {
            total: cells[1] || "",
            school: cells[2] || "",
            class: cells[3] || "",
          };
        } else if ((cells[0] || "").includes("نمره کل")) {
        }
      });

      const txt = table2.text();
      const findNumber = (label) => {
        const re = new RegExp(label + "[\\s\\S]{0,40}?([\\d\\.-]+)", "m");
        const m = txt.match(re);
        return m ? m[1] : null;
      };
      tableObj.participants = tableObj.participants || {};
      if (!tableObj.participants.total) {
        const p = findNumber("تعداد شرکت کنندگان");
        if (p) tableObj.participants.total = p;
      }
      out.participants = tableObj.participants || {};
    }
  } catch {}

  try {
    const qTable = $(".tableresults table").first();
    if (qTable && qTable.length) {
      const $rows = qTable.find("tbody tr");
      const headerRow = $rows.first();
      const qNumbers = [];
      headerRow.find("th").each((i, th) => {
        const txt = $(th).text().trim();
        if (i > 0) qNumbers.push(txt);
      });
      out.questionGrid.questionNumbers = qNumbers;

      $rows.slice(1).each((ri, r) => {
        const $r = $(r);
        const label = $r.find("td").first().text().trim();
        const cells = [];
        const raw = [];
        $r.find("td")
          .slice(1)
          .each((ci, td) => {
            const $td = $(td);
            raw.push({
              html: $td.html(),
              text: $td.text().trim(),
              style: $td.attr("style") || "",
              bgcolor: $td.attr("style") || "",
            });
            cells.push($td.text().trim());
          });

        if (/پاسخ شما/.test(label)) {
          out.questionGrid.yourAnswers = cells;
        } else if (/پاسخ صحیح/.test(label)) {
          out.questionGrid.correctAnswers = cells;
        } else if (/وضعیت/.test(label)) {
          out.questionGrid.statuses = cells;
        } else {
          out.questionGrid.rawCells.push({ label, cells, raw });
        }
      });

      const qCount = out.questionGrid.questionNumbers.length;
      const makeLen = (arr) => {
        if (!arr) return Array(qCount).fill("");
        if (arr.length < qCount)
          return arr.concat(Array(qCount - arr.length).fill(""));
        return arr.slice(0, qCount);
      };
      out.questionGrid.yourAnswers = makeLen(
        out.questionGrid.yourAnswers || []
      );
      out.questionGrid.correctAnswers = makeLen(
        out.questionGrid.correctAnswers || []
      );
      out.questionGrid.statuses = makeLen(out.questionGrid.statuses || []);
    }
  } catch {}

  try {
    const jsMatch = text.match(/var\s+barChartData\w*\s*=\s*({[\s\S]*?});/);
    if (jsMatch) {
      const jsObjText = jsMatch[1];

      const labelsMatch = jsObjText.match(/labels\s*:\s*\[([^\]]*)\]/);
      const labels = labelsMatch
        ? labelsMatch[1]
            .split(",")
            .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        : [];

      const dataMatches = [...jsObjText.matchAll(/data\s*:\s*\[([^\]]*)\]/g)];
      const datasets = dataMatches.map((dm) =>
        dm[1].split(",").map((v) => {
          const n = v.trim();
          const parsed = Number(n);
          return Number.isNaN(parsed) ? n.replace(/^['"]|['"]$/g, "") : parsed;
        })
      );

      out.chartData = { labels, datasets };
    }
  } catch {}

  return out;
}

export { Get_Exam };
export default Get_Exam;