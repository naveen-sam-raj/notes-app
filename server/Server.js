import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    "https://note-app-abff1.web.app",
    "https://note-app-abff1.firebaseapp.com",
    /^http:\/\/localhost:\d+$/,
  ],
}));
app.use(express.json());

app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided" });
    }

    console.log("🔵 Summarizing:", text.slice(0, 80) + "...");

    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          {
            role: "user",
            content: `Summarize the following note in exactly 2 short sentences. Be concise. Only output the summary, nothing else.\n\nNote:\n${text}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("✅ HF Response:", JSON.stringify(response.data).slice(0, 200));

    const summary =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "No summary generated.";

    res.json({ summary });
  } catch (error) {
    const errData = error.response?.data;
    const errStatus = error.response?.status;
    console.error("❌ ERROR status:", errStatus);
    console.error("❌ ERROR data:", JSON.stringify(errData));
    console.error("❌ ERROR message:", error.message);

    res
      .status(500)
      .json({ error: errData?.error?.message || error.message || "AI failed" });
  }
});

app.listen(5000, () => {
  console.log("✅ AI Server running http://localhost:5000");
});
