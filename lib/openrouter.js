import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

export async function getAIResponse(userMessage) {
  const completion = await openrouter.chat.send({
    model: "openrouter/free",
    messages: [
      {
        role: "system",
        content: `
You are AVA, an AI sales assistant.

Rules:
- Sound human and natural
- Help users buy products
- Ask questions when needed
- Keep replies short
- Never hallucinate prices or products
`
      },
      {
        role: "user",
        content: userMessage
      }
    ]
  });

  return (
    completion.choices?.[0]?.message?.content ||
    "Sorry, I couldn't process that."
  );
}