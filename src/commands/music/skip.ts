import { SlashCommandBuilder } from "discord.js";
import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Saltea la canción que se esté reproduciendo"),
  inVoice: true,
  alias: ["s"],
  voiceCommand: ["siguiente", "skip"],
  queueDependent: true,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    player.stop();

    return {
      title: "Skip",
      color: bot.accentColor,
    };
  },
};
