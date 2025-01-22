import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Salta al segundo que indiques")
    .addIntegerOption((option) =>
      option
        .setName("segundos")
        .setDescription(
          "Segundos a los que se tiene que saltar la reproducción",
        )
        .setRequired(true),
    ),
  inVoice: true,
  voiceCommand: ["segundo"],
  queueDependent: true,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    const [seconds] = content;
    player.seek(parseInt(seconds));
    return {
      title: "Seek",
      description: `Saltando a ${seconds}!`,
    };
  },
};
