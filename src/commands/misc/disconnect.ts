import {
  Message,
  OmitPartialGroupDMChannel,
  SlashCommandBuilder,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("Desconecta el bot del canal de voz"),
  inVoice: true,
  alias: ["dc", "leave", "salte"],
  voiceCommand: ["salte", "desconéctate"],
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    player.disconnect();
    player.destroy();

    return { title: "Adiós" };
  },
};
