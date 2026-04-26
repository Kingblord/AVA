import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

export async function getAIResponse(userMessage) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // optional but recommended by OpenRouter
        "HTTP-Referer": "https://your-domain.vercel.app",
        "X-Title": "AVA"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: `
You are AVA, an AI sales assistant.

Rules:
- Sound human and natural
- Help users buy products
- Ask clarifying questions when needed
- Keep replies short and actionable
- Never hallucinate prices or products
`
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenRouter HTTP Error:", res.status, text);
      return "AI service error. Try again.";
    }

    const data = await res.json();

    return (
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't process that."
    );

  } catch (err) {
    console.error("OpenRouter Error:", err);
    return "AI is currently unavailable.";
  }
}