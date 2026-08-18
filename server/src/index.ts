import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

import {
  transcribeAudio,
  generateNextQuestion,
  textToSpeech,
  generateReport
} from "./openai.js";

import {
  createSession,
  getSession,
  addMessage,
  deleteSession
} from "./session.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage()
});

/* START CALL */
app.post("/api/call/start", async (_req, res) => {
  try {
    const sessionId = randomUUID();

    createSession(sessionId);

    const greeting =
      "Hello! I am your health screening assistant. What is your name?";

    addMessage(sessionId, {
      role: "assistant",
      content: greeting
    });

    const audio = await textToSpeech(greeting);

    res.json({
      sessionId,
      text: greeting,
      audio: audio.toString("base64")
    });
  } catch (error) {
    console.error("START CALL ERROR:", error);

    res.status(500).json({
      message: "Unable to start call",
      error:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
});

/* PROCESS USER AUDIO */
app.post(
  "/api/call/:sessionId/message",
  upload.single("audio"),
  async (req, res) => {
    try {
      const sessionId = req.params.sessionId;

      if (!req.file) {
        return res.status(400).json({
          message: "Audio file is required"
        });
      }

      const userText = await transcribeAudio(
        req.file.buffer
      );

      if (!userText.trim()) {
        return res.json({
          text:
            "I couldn't hear that clearly. Could you please repeat?",
          audio: null
        });
      }

      addMessage(sessionId, {
        role: "user",
        content: userText
      });

      const assistantText =
        await generateNextQuestion(
          getSession(sessionId)
        );

      addMessage(sessionId, {
        role: "assistant",
        content: assistantText
      });

      const audio =
        await textToSpeech(assistantText);

      res.json({
        userText,
        text: assistantText,
        audio: audio.toString("base64")
      });
    } catch (error) {
      console.error("MESSAGE ERROR:", error);

      res.status(500).json({
        message: "Failed to process audio",
        error:
          error instanceof Error
            ? error.message
            : String(error)
      });
    }
  }
);

/* END CALL */
app.post(
  "/api/call/:sessionId/end",
  async (req, res) => {
    try {
      const sessionId = req.params.sessionId;

      const conversation =
        getSession(sessionId);

      const report =
        await generateReport(conversation);

      deleteSession(sessionId);

      res.json({
        report,
        conversation
      });
    } catch (error) {
      console.error("END CALL ERROR:", error);

      res.status(500).json({
        message: "Failed to generate report",
        error:
          error instanceof Error
            ? error.message
            : String(error)
      });
    }
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});