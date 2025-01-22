import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pausa o continua la reproducción de la música"),
  inVoice: true,
  voiceCommand: ["pausa", "pausar", "resume"],
  queueDependent: true,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    player.pause(!player.paused);

    return {
      title: "Pause",
      description: player.paused
        ? "Pausando reproducción"
        : "Reanudando reproducción",
    };
  },
};
