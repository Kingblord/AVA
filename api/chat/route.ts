// 2. app/api/chat/route.ts
import { OpenRouter } from "@openrouter/sdk";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { handleAvaAction } from "@/lib/ava-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "https://nukuai.vercel.app",
    "X-OpenRouter-Title": "Nuku-AI Platform",
  },
});

// ====================== MODEL CONFIG ======================
const MODEL_CONFIG = {
  Duru: {
    name: "Duru",
    description: "Deep thinker — breaks down complex problems carefully",
    systemPrompt: `You are Duru, Nuku-AI's master deep thinker.
Think carefully and explain your reasoning step-by-step in a clear and structured way.
Avoid exposing internal hidden thoughts. Provide only the final structured explanation.`,
    model: "openrouter/free",
  },

  "Duru-mini": {
    name: "Duru mini",
    description: "Fast, smart everyday assistant",
    systemPrompt: `You are Duru-mini, Nuku-AI's friendly and efficient everyday assistant.
You are fast, practical, and helpful for normal daily tasks.`,
    model: "openrouter/free",
  },

  Agwu: {
    name: "Agwu",
    description: "Best in coding — clean, production-ready code",
    systemPrompt: `You are Agwu, Nuku-AI's world-class coding specialist.
First give a very short plan (1-2 lines), then output ONLY the full clean production-ready code.`,
    model: "openrouter/free",
  },

  AVA: {
    name: "AVA",
    description: "AI Virtual Agent — automation, negotiation, payments",
    systemPrompt: `You are AVA, an AI business agent.

You do NOT just chat. You decide actions.

At every step:
1. Understand the user's intent
2. If an action is required, respond ONLY in JSON
3. If no action is required, respond normally

Available actions:
- create_payment_link
- verify_payment
- create_order
- get_customer_history

STRICT RULES:
- NEVER mix text and JSON
- If action is needed, output ONLY JSON
- JSON format:

{
  "action": "tool_name",
  "parameters": { ... }
}

If no action is needed:
Respond normally as a professional assistant.`,
    model: "openrouter/free",
  },
} as const;

// ====================== OPTIONAL GLOBAL RATE LIMIT ======================
async function checkRateLimit() {
  const rateKey = "global:rate";
  const count = (await kv.get<number>(rateKey)) || 0;

  if (count > 100) {
    return false;
  }

  await kv.incr(rateKey);
  await kv.expire(rateKey, 60);

  return true;
}

// ====================== MAIN CHAT ENDPOINT ======================
export async function POST(req: NextRequest) {
  // Optional protection (prevents abuse)
  const allowed = await checkRateLimit();
  if (!allowed) {
    return NextResponse.json(
      { error: "Server busy. Try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { model, messages, temperature = 0.7, max_tokens } = await req.json();

    if (!model || !MODEL_CONFIG[model as keyof typeof MODEL_CONFIG]) {
      return NextResponse.json(
        { error: "Invalid model. Available: Duru, Duru-mini, Agwu, AVA" },
        { status: 400 }
      );
    }

    const config = MODEL_CONFIG[model as keyof typeof MODEL_CONFIG];

    const fullMessages = [
      { role: "system", content: config.systemPrompt },
      ...messages,
    ];

    const stream = await openrouter.chat.send({
      model: config.model,
      messages: fullMessages,
      temperature,
      max_tokens: max_tokens || undefined,
      stream: true,
    });

    // ====================== AVA SPECIAL HANDLING ======================
   if (model === "AVA") {
  let fullText = "";

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) fullText += content;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(fullText);
  } catch {}

  if (parsed?.action) {
    const result = await handleAvaAction(parsed);

    return NextResponse.json({
      type: "action_result",
      action: parsed.action,
      result
    });
  }

  return NextResponse.json({
    type: "message",
    content: fullText
  });
}

    // ====================== NORMAL STREAM (OTHER MODELS) ======================
    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(streamResponse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
