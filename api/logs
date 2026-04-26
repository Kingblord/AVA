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