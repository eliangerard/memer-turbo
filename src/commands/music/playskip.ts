import { SlashCommandBuilder } from "discord.js";
import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { bot } from "../../services/client";
import { Command } from "../../../types/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("playskip")
    .setDescription("Reproduce una canción y saltea la canción actual")
    .addStringOption((option) =>
      option
        .setName("canción")
        .setDescription(
          "Lo que quieras reproducir, puede ser una búsqueda o un link",
        )
        .setRequired(true),
    ),
  inVoice: true,
  alias: ["ps"],
  voiceCommand: ["reproduce ahora"],
  queueDependent: false,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    if (!message.guild) return;
    const play = bot.commands.get("play") as Command;

    await play.execute(message, content);

    const player = bot.riffy.players.get(message.guild.id);

    if (player && player?.queue.length > 0) {
      player.stop();
      return {
        title: "Skip",
        description: `Reproduciendo ${content.join(" ")}`,
        color: bot.accentColor,
      };
    }

    return {
      noResponse: true,
    };
  },
};
