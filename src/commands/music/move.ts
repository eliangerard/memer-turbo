import { SlashCommandBuilder } from "discord.js";
import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Mueve la canción en la cola")
    .addIntegerOption((option) =>
      option
        .setName("from")
        .setDescription("La canción que vas a mover")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("La posición a la que lo harás")
        .setRequired(true),
    ),
  inVoice: false,
  voiceCommand: ["mover", "mueve"],
  queueDependent: true,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    const from = Number(content.shift());
    const to = Number(content.shift());

    if (from === null || to === null) {
      return {
        title: "Move",
        description: "Debes proporcionar ambas posiciones.",
      };
    }

    const queue = player.queue;

    if (from < 1 || from > queue.length || to < 1 || to > queue.length) {
      return {
        title: "Move",
        description: "Las posiciones deben estar dentro del rango de la cola.",
      };
    }

    const song = queue.splice(from - 1, 1)[0];
    queue.splice(to - 1, 0, song);

    return {
      title: "Move",
      description: `Se movió la canción #${from} a la posición #${to}`,
    };
  },
};
