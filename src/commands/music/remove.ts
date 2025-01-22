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

    if (content[0]) return;

    const song = Number(content[0]);

    if (song < 1 || song > player.queue.size) {
      return {
        title: "Error",
        description: "La canción no existe",
      };
    }

    const removedSong = player.queue.remove(song - 1);

    return {
      title: "Canción eliminada",
      description: `La canción #${song} - ${removedSong.info.title} ha sido removida de la lista.`,
    };
  },
};
