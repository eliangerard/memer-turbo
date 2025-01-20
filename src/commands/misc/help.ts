import {
  Message,
  OmitPartialGroupDMChannel,
  SlashCommandBuilder,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra los comandos del bot")
    .addStringOption((option) =>
      option
        .setName("comando")
        .setDescription("El comando a mostrar")
        .setRequired(false),
    ),
  inVoice: false,
  alias: ["h"],
  voiceCommand: ["ayuda", "comandos"],
  async execute(
    message: OmitPartialGroupDMChannel<Message>,
    content: string[],
  ) {
    const [commandResolvable] = content;
    if (commandResolvable) {
      let command = bot.commands.get(commandResolvable);
      if (!command)
        command = bot.commands.find(
          (cmd) => cmd.alias && cmd.alias.includes(commandResolvable),
        );
      if (!command) return { title: "Comando no encontrado" };

      const fields = [
        {
          name: " ",
          value: command.data.description,
        },
      ];

      if (command.alias)
        fields.push({
          name: "Alias para texto",
          value: "`" + (command.alias ? command.alias.join(", ") : "N/A") + "`",
        });

      if (command.voiceCommand)
        fields.push({
          name: "Comando por voz",
          value: "`" + command.voiceCommand.join(", ") + "`",
        });

      return {
        title: bot.prefix + command.data.name,
        fields,
      };
    }
    const fields = bot.commands.map((command) => ({
      name: " ",
      value:
        "`" +
        bot.prefix +
        command.data.name +
        "` - " +
        command.data.description,
    }));

    fields.push({
      name: "Por comando",
      value:
        "Usa `" +
        bot.prefix +
        "help <comando>` para ver sus alias y su activación por voz",
    });

    return {
      title: "Comandos disponibles",
      fields,
    };
  },
};
