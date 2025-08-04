const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const { jsonrepair } = require("jsonrepair"); // ✅ Fix broken JSON

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Resume Analyzer + AI Mentor
app.post("/api/analyze", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages,
        temperature: 0.3,
        max_tokens: 400,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Analyze error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch from OpenRouter" });
  }
});

// ✅ Roadmap Generator
app.post("/api/roadmap", async (req, res) => {
  const { goal } = req.body;
  if (!goal || typeof goal !== "string") {
    return res.status(400).json({ error: "Goal is required." });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        temperature: 0.3,
        max_tokens: 700, // Increased to allow full 4-week roadmap
        messages: [
          {
            role: "system",
            content:
              "You are an expert roadmap planner. Respond with valid JSON array only. No explanation, no markdown.",
          },
          {
            role: "user",
            content: `Create a detailed 4-week learning roadmap for: ${goal}.
Each week must include:
- A week number
- A meaningful title
- 4 to 6 tasks (with short titles)
Respond ONLY with valid JSON, like:

[
  {
    "week": 1,
    "title": "Week Title",
    "completed": false,
    "tasks": [
      { "id": "1-1", "title": "Task title", "completed": false }
    ]
  }
]`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let raw = response.data?.choices?.[0]?.message?.content || "";

    // Remove Markdown-style ```json wrappers
    raw = raw
      .trim()
      .replace(/^```json\s*|```$/g, "")
      .trim();

    // ✅ Attempt to repair malformed JSON
    const repaired = jsonrepair(raw);
    const roadmap = JSON.parse(repaired);

    res.json(roadmap);
  } catch (err) {
    console.error("❌ Roadmap error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("EduMate Backend is running!");
});

// ✅ Vercel export
module.exports = (req, res) => app(req, res);
