const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

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

// ✅ Roadmap Generator (Final Fix)
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
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You are an expert roadmap planner. Respond ONLY with clean JSON. No explanation, no markdown.",
          },
          {
            role: "user",
            content: `Create a 4-week learning roadmap for: ${goal}.
Each week must include:
- a short title (max 5 words, no quotes)
- 4 simple task titles (avoid quotes)
Respond ONLY with raw JSON using this format:

[
  {
    "week": 1,
    "title": "Week title",
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

    const rawReply = response.data?.choices?.[0]?.message?.content;
    if (!rawReply) throw new Error("No content received from OpenRouter");

    const cleaned = rawReply
      .replace(/```json|```/g, "") // remove markdown ticks
      .trim();

    let roadmap;
    try {
      roadmap = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr.message);
      console.error("❌ Raw content:", cleaned);
      return res
        .status(500)
        .json({ error: "Invalid JSON format returned from AI." });
    }

    res.json(roadmap);
  } catch (err) {
    console.error("Roadmap error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("EduMate Backend is running!");
});

// ✅ Export for Vercel
module.exports = (req, res) => app(req, res);
