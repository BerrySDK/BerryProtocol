import BerryProtocol from "berryprotocol";
import OpenAI from "openai";

const client = new BerryProtocol({
  sessionId: "ai-agent-example",
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.on("message.received", async (message) => {
  if (message.type !== "text" || !message.from) {
    return;
  }

  const response = await ai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are BerryAgent, the official AI assistant for BerryProtocol.",
      },
      {
        role: "user",
        content: message.text,
      },
    ],
  });

  const answer = response.choices[0]?.message?.content ?? "I could not generate a reply.";
  const chatId = message.chatId ?? message.from;

  await client.sendMessage(chatId, {
    text: answer,
    ai: true,
  });
});

await client.connectWithQr();
