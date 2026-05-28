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
          "HTTP-Referer": "https://backend-jarvis.onrender.com",
          "X-Title": "Jarvis AI"
        },
        body: JSON.stringify({
          ...req.body,
          stream: true
        })
      }
    );

    // SSE HEADERS
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.(); // important for some servers

    if (!response.body) {
      throw new Error("No response body from OpenRouter");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // forward raw SSE chunks
      res.write(chunk);
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});


const axios = require("axios");

app.get("/news", async (req, res) => {
  try {
    const query = req.query.q || "";
    const category = req.query.category || "general";
    const lang = "en";

    let url = "";

    // IF SEARCH QUERY
    if (query) {
      url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&max=8&apikey=${process.env.GNEWS_API_KEY}`;
    }

    // DEFAULT TOP HEADLINES
    else {
      url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&max=8&apikey=${process.env.GNEWS_API_KEY}`;
    }

    const response = await axios.get(url);

    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source?.name,
      image: article.image,
      publishedAt: article.publishedAt
    }));

    res.json({
      success: true,
      articles
    });

  } catch (err) {
    console.error("NEWS ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});
