import { CohereClientV2 } from "cohere-ai";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chatea con Memer"),
  inVoice: false,
  deleteInvocation: false,
  voiceCommand: ["chat", "busca", "dime"],
  async execute(_: any, content: string[]) {
    const cohere = new CohereClientV2({
      token: process.env.COHERE_TOKEN,
    });

    const text = content.join(" ");
    const response = await cohere.chat({
      model: process.env.COHERE_MODEL ?? "",
      messages: [{ role: "user", content: text }],
      temperature: 0.3,
      citationOptions: { mode: "ACCURATE" },
    });
    if (!response) return;
    return {
      content: response.message.content,
    };
  },
};
