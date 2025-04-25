import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Quita la canción de la cola")
    .addIntegerOption((option) =>
      option
        .setName("song")
        .setDescription("La canción que vas a quitar")
        .setRequired(true),
    ),
  alias: ["rm"],
  inVoice: true,
  voiceCommand: ["quita la canción", "quita", "elimina"],
  queueDependent: true,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    const toRemove = Number(content.shift());

    if (toRemove === null) {
      return {
        title: "Remove",
        description: "Debes proporcionar una posición.",
      };
    }

    const queue = player.queue;

    if (toRemove < 1 || toRemove > queue.length) {
      return {
        title: "Error",
        description: "La canción no existe",
      };
    }

    const removedSong = queue.remove(toRemove - 1);

    return {
      title: "Canción eliminada",
      description: `La canción #${toRemove} - ${removedSong.info.title} ha sido removida de la lista.`,
    };
  },
};
