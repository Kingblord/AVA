export async function getAIResponse(message) {
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
            content:
              "You are AVA, a sales assistant. Be short, natural, and helpful."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await res.json();

    console.log("AI RESPONSE:", data);

    return (
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't respond."
    );
  } catch (err) {
    console.error("AI ERROR:", err);
    return "AI unavailable";
  }
}
