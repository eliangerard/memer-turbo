import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Cambia el volumen de la reproducción")
    .addIntegerOption((option) =>
      option
        .setName("porcentaje")
        .setDescription("Porcentaje del volumen")
        .setRequired(true),
    ),
  inVoice: true,
  alias: ["v"],
  voiceCommand: ["volumen"],
  queueDependent: true,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    const volume = Number(content.shift());
    player.setVolume(volume > 1000 ? 1000 : volume < 0 ? 0 : volume);

    return {
      title: "Volumen actualizado",
      description: `Establecido en: \`${volume}\``,
    };
  },
};
