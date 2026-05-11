require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const client = require("./redisClient");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    console.time("Response Time");
    let userChat = "";

    //  Chat history
    if (req.body.messages && Array.isArray(req.body.messages)) {
      userChat = req.body.messages
        .map((m) =>
          `${m.type === "user" ? "Human" : "Assistant"}: ${m.text}`
        )
        .join("\n");
    }

    // Single message
    else if (req.body.message) {
      userChat = `Human: ${req.body.message}`;
    }

    // Invalid request
    else {
      return res.status(400).json({
        error: "Invalid input",
      });
    }

    const cacheKey = req.body.message ? req.body.message.trim().toLowerCase() : userChat.trim().toLowerCase();;
    const cachedResponse = await client.get(cacheKey);

    if (cachedResponse) {
      console.log("Response from Redis Cache");

      console.timeEnd("Response Time")

      return res.json({
        reply: cachedResponse,
        source: "redis cache",
      });
    }

    // Strong Prompt
    const prompt = `
You are a smart AI assistant.

STRICT RULES:
- Reply ONLY in the user's language.
- English question → English answer only.
- Hindi question → Hindi answer only.
- Hinglish question → Hinglish answer only.
- Never mix multiple languages unnecessarily.
- Keep answers short, natural and clear.
- Never generate meaningless or random text.
- Answer only what the user asks.
- If you do not know the answer, say "I don't know".

Examples:

Human: what is javascript
Assistant: JavaScript is a programming language used to make websites interactive.

Human: जावास्क्रिप्ट क्या है
Assistant: JavaScript एक programming language है जिसका उपयोग websites को interactive बनाने के लिए किया जाता है।

Human: javascript kya h
Assistant: JavaScript ek programming language hai jo websites ko interactive banati hai.

Conversation:
${userChat}

Assistant:
`;

    // Ollama API
    const response = await axios.post(
      process.env.OLLAMA_URL,
      {
        model: process.env.MODEL_NAME,

        prompt: prompt,

        stream: false,

        options: {
          temperature: 0,
          num_predict: 200,
        },
      },
      {
        timeout: 180000,
      }
    );

    //  Clean response
    const aiReply = response.data.response.trim();

    await client.set(cacheKey, aiReply, {
      EX: 3600,
    });
    console.log("Response from Ollama API");
    console.timeEnd("Response Time");


    res.json({
      reply: aiReply,
      source: "api",
    });

  } catch (error) {
    console.log("Error:", error.message);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});