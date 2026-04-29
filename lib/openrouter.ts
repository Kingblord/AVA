export async function getAIResponse(message: string) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: `
You are AVA, a sales assistant.

Rules:
- Be short and natural
- Help users buy products
- Ask questions when needed
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await res.json();

    console.log("AI RESPONSE:", JSON.stringify(data, null, 2));

    return (
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't respond."
    );

  } catch (err) {
    console.error("AI ERROR:", err);
    return "AI unavailable";
  }
}
