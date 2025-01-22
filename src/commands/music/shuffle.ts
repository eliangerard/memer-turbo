import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Aleatoriza la queue"),
  inVoice: false,
  voiceCommand: ["aleatoriza", "revuelve"],
  queueDependent: true,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    player.queue.shuffle();

    return {
      title: "Shuffle",
      description: "¡Queue revuelta!",
    };
  },
};
