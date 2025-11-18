import express from "express";
import cors from "cors";
import { GetToken } from "./utils/Get_Token.js";
import { Get_Exams } from "./utils/List_Exams.js";
import { Get_Exam } from "./utils/Get_Exam.js";
import { Get_User_Data } from "./utils/Get_User_Data.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/get-cookie", async (req, res) => {
  try {
    const { name, pass } = req.query;

    if (!name || !pass) {
      return res.status(400).json({
        error: "Missing required parameters: name and pass are required",
      });
    }

    console.log(`Getting token for user: ${name}`);
    const token = await GetToken(name, pass);

    res.json({
      success: true,
      token: token,
    });
  } catch (error) {
    console.error("Error getting token:", error.message);
    res.status(500).json({
      error: "Failed to get token: " + error.message,
    });
  }
});

app.get("/get-exams", async (req, res) => {
  try {
    const { cookie } = req.query;

    if (!cookie) {
      return res.status(400).json({
        error: "Missing required parameter: cookie is required",
      });
    }

    console.log("Getting exams list");
    const exams = await Get_Exams(cookie);

    res.json({
      success: true,
      exams: exams,
    });
  } catch (error) {
    console.error("Error getting exams:", error.message);
    res.status(500).json({
      error: "Failed to get exams: " + error.message,
    });
  }
});

app.get("/get-exam", async (req, res) => {
  try {
    const { cookie, eid } = req.query;

    if (!cookie || !eid) {
      return res.status(400).json({
        error: "Missing required parameters: cookie and eid are required",
      });
    }

    console.log(`Getting exam data for EID: ${eid}`);
    const examData = await Get_Exam(eid, cookie);

    res.json({
      success: true,
      exam: examData,
    });
  } catch (error) {
    console.error("Error getting exam:", error.message);
    res.status(500).json({
      error: "Failed to get exam: " + error.message,
    });
  }
});

app.get("/user-data", async (req, res) => {
  try {
    const { cookie } = req.query;

    if (!cookie) {
      return res.status(400).json({
        error: "Missing required parameter: cookie is required",
      });
    }

    console.log("Fetching user dashboard data...");
    const userData = await Get_User_Data(cookie);

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user data:", error.message);
    res.status(500).json({
      error: "Failed to fetch user data: " + error.message,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Pardis API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    availableRoutes: {
      "GET /get-cookie": "Get authentication token (params: name, pass)",
      "GET /get-exams": "Get list of exams (param: cookie)",
      "GET /get-exam": "Get specific exam data (params: cookie, eid)",
      "GET /user-data": "Get user dashboard info (param: cookie)",
      "GET /health": "Health check",
    },
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Listening on all network interfaces`);
  console.log(`Available routes:`);
  console.log(`  GET /get-cookie - Get authentication token`);
  console.log(`  GET /get-exams - Get list of exams`);
  console.log(`  GET /get-exam - Get specific exam data`);
  console.log(`  GET /user-data - Get user dashboard info`);
  console.log(`  GET /health - Health check`);
});
