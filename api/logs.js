import { getLogs } from "../logs.js";

export default function handler(req, res) {
  // -------------------------
  // CORS HEADERS
  // -------------------------
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // -------------------------
  // RETURN LOGS
  // -------------------------
  return res.status(200).json(getLogs());
}


let logs = [];
let conversations = {};

export function addLog(entry) {
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
}

export function getLogs() {
  return logs;
}

export function getConversation(user) {
  if (!conversations[user]) {
    conversations[user] = [];
  }
  return conversations[user];
}

export function addToConversation(user, role, content) {
  if (!conversations[user]) {
    conversations[user] = [];
  }

  conversations[user].push({ role, content });

  // keep last 10 messages only
  if (conversations[user].length > 10) {
    conversations[user].shift();
  }
}
