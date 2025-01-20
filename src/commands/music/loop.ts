import {
  Message,
  OmitPartialGroupDMChannel,
  SlashCommandBuilder,
} from "discord.js";
import { bot } from "../../services/client";
import { LoopOption } from "riffy";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Activa la repetición de, la queue o la canción")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("El modo de repetición")
        .addChoices(
          { name: "apagado", value: "none" },
          { name: "canción", value: "track" },
          { name: "queue", value: "queue" },
        ),
    ),
  inVoice: false,
  voiceCommand: ["loop", "repite"],
  queueDependent: true,
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    let [mode] = content;

    if (!message.guild) return;

    const player = bot.riffy.players.get(message.guild.id);

    if (!player) return;

    if (mode && mode !== "none" && mode !== "track" && mode !== "queue") {
      return {
        title: "Error",
        description:
          "Modo de repetición inválido, por favor, elige entre `none`, `track`, `queue` o ninguno para cambiar entre modos",
      };
    }

    const calculatedLoop = (
      !mode
        ? player.loop === "none"
          ? "track"
          : player.loop === "track"
            ? "queue"
            : "none"
        : mode
    ) as LoopOption;

    player.setLoop(calculatedLoop);

    return {
      title: "Loop",
      description: `Modo de repetición establecido: \`${calculatedLoop}\``,
    };
  },
};
