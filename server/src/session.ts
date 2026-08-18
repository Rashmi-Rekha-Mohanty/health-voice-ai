import {ConversationMessage} from "./openai.js";

const sessions = new Map<string, ConversationMessage[]>();

export function createSession(id: string) {
  sessions.set(id, []);
}

export function getSession(id: string): ConversationMessage[] {
  return sessions.get(id) || [];
}

export function addMessage(
  id: string,
  message: ConversationMessage
) {
  const conversation = getSession(id);

  conversation.push(message);

  sessions.set(id, conversation);
}

export function deleteSession(id: string) {
  sessions.delete(id);
}