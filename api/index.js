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
        model: "gpt-3.5-turbo",
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
        model: "gpt-3.5-turbo",
        temperature: 0.4,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: "You are an expert learning path designer AI.",
          },
          {
            role: "user",
            content: `Create a detailed 4-week learning roadmap for the goal: "${goal}". Each week should include:
- A clear and meaningful title
- 4 to 6 specific tasks
Use this exact JSON format (no markdown, no explanation):

[
  {
    "week": 1,
    "title": "string",
    "completed": false,
    "tasks": [
      { "id": "1-1", "title": "task title", "completed": false }
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
      .trim()
      .replace(/^```json\s*|```$/g, "")
      .trim();

    const roadmap = JSON.parse(cleaned);
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
// ✅ Export as handler for Vercel
module.exports = (req, res) => app(req, res);
