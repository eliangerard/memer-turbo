import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Detiene la reproducción y borra la cola"),
  inVoice: true,
  voiceCommand: ["cállate", "detente"],
  queueDependent: true,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    player.queue.clear();
    player.stop();

    return {
      noResponse: true,
    };
  },
};
