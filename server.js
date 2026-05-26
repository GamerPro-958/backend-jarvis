require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY in .env file");
}

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {

  try {

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://your-site-name.com",
          "X-Title": "Jarvis AI"
        },

        body: JSON.stringify({
          ...req.body,
          stream: true
        })
      }
    );

    // STREAMING HEADERS
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // SEND STREAM
    response.body.on("data", (chunk) => {
      res.write(chunk);
    });

    response.body.on("end", () => {
      res.end();
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
