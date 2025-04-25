import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("jumpTo")
    .setDescription(
      "Salta a una canción en la lista y la canción actual se reproduce en seguida",
    )
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("Canción a la que saltar")
        .setRequired(true),
    ),
  alias: ["jt"],
  inVoice: false,
  voiceCommand: ["saltar", "salta"],
  queueDependent: true,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    const to = Number(content.shift());

    if (to === null) {
      return {
        title: "JumpTo",
        description: "Debes proporcionar una posición.",
      };
    }

    const queue = player.queue;
    const current = player.current;

    if (to < 1 || to > queue.length) {
      return {
        title: "JumpTo",
        description: "La posición debe estar dentro del rango de la cola.",
      };
    }

    const song = queue.splice(to - 1, 1)[0];
    queue.splice(0, 0, current);
    queue.splice(0, 0, song);
    player.stop();

    return {
      title: "JumpTo",
      description: `Se saltó a la canción #${to}`,
    };
  },
};
