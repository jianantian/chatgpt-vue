import type { ChatMessage } from "@/types";
import {server, port } from "@/config/server";

export async function chat(messageList: ChatMessage[], apiKey: string) {
  try {
    const body: string = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messageList,
    });

    console.log(body);

    const url = `http://${server}:${port}/chat`;
    const result = await fetch(url, {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    console.log(result);
    return result;
  } catch (error) {
    throw error;
  }
}
