import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { bot } from "../../services/client";

const { SlashCommandBuilder } = require("discord.js");

export default {
  data: new SlashCommandBuilder()
    .setName("grab")
    .setDescription("Te envía el link de la canción por privado"),
  inVoice: false,
  voiceCommand: ["agarrar", "grab"],
  queueDependent: true,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    if (message.author) {
      message.author.send(player.current.info.uri);
      return { title: "Tulún" };
    }
  },
};
