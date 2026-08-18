import "dotenv/config";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Check server/.env"
    );
  }

  return new OpenAI({
    apiKey
  });
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function transcribeAudio(
  audio: Buffer
): Promise<string> {

  const client = getOpenAIClient();

  const file = new File(
    [audio],
    "audio.webm",
    {
      type: "audio/webm"
    }
  );

  const result =
    await client.audio.transcriptions.create({
      file,
      model: "whisper-1"
    });

  return result.text;
}

export async function generateNextQuestion(
  conversation: ConversationMessage[]
): Promise<string> {

  const client = getOpenAIClient();

  const systemPrompt = `
You are an AI health screening assistant.

Conduct a short basic health intake conversation.

Collect:

1. Name
2. Main concern or symptom
3. How long it has been happening
4. Severity
5. Other related symptoms

Ask only ONE question at a time.

Remember information already provided.

Do not repeat questions that have already
been answered.

If an answer is vague, ask a useful
follow-up question.

Do not diagnose the patient.

Keep responses short and conversational.
`;

  const response =
    await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: systemPrompt,
      input: conversation.map((message) => ({
        role: message.role,
        content: message.content
      }))
    });

  return response.output_text;
}

export async function textToSpeech(
  text: string
): Promise<Buffer> {

  const client = getOpenAIClient();

  const response =
    await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      response_format: "mp3"
    });

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

export async function generateReport(
  conversation: ConversationMessage[]
) {

  const client = getOpenAIClient();

  const prompt = `
Create a structured health screening report
from this conversation.

Return JSON with exactly these fields:

{
  "patientName": "",
  "mainConcern": "",
  "keySymptoms": [],
  "duration": "",
  "severity": "",
  "followUp": ""
}

Rules:

- Only use information actually provided
  by the user.
- If information is missing, use
  "Not provided".
- Do not diagnose.
- If the conversation is incomplete,
  create a partial report.
`;

  const response =
    await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: prompt,
      input: JSON.stringify(conversation)
    });

  try {

    return JSON.parse(
      response.output_text
    );

  } catch {

    return {
      patientName: "Not provided",
      mainConcern: "Not provided",
      keySymptoms: [],
      duration: "Not provided",
      severity: "Not provided",
      followUp: response.output_text
    };
  }
}