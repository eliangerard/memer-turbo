import { EmbedBuilder, Message, OmitPartialGroupDMChannel } from "discord.js";
import { bot } from "../../services/client";

export default {
  name: "messageCreate",
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!bot.client.user)
      return console.log("Hubo un error al inicializar el bot");

    if (!message.content.startsWith(bot.prefix) || message.author.bot) return;

    const args = message.content.split(" ");
    if (args.length <= 0) return;

    const commandCalledWithPrefix = args.shift();
    if (!commandCalledWithPrefix) return;

    const commandCalled = commandCalledWithPrefix.substring(bot.prefix.length);
    let command = bot.commands.get(commandCalled.toLowerCase());

    if (!command)
      command = bot.commands.find(
        (cmd) => cmd.alias && cmd.alias.includes(commandCalled.toLowerCase()),
      );

    if (!command) {
      if (bot.prefix.length > 0) return message.reply("No hay comando de esos");
      return;
    }

    if (command.deleteInvocation != false)
      setTimeout(() => message.delete(), 15000);

    if (!message.guild)
      return message.reply(
        "Por el momento solo funciono a través de servidores",
      );

    const player = bot.riffy.players.get(message.guild.id);

    const queue = player ? player.queue : null;

    if (command.queueDependent && !queue) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setColor("#FF0000")
        .setDescription("No se está reproduciendo nada")
        .setTimestamp()
        .setFooter({
          text: bot.client.user.username,
          iconURL: bot.imgUrl,
        });

      return message.reply({ embeds: [embed] }).then((msg) => {
        setTimeout(() => msg.delete(), 15000);
      });
    }

    try {
      const {
        title = null,
        description = null,
        fields = [],
        image = null,
        thumbnail = null,
        actionRows = null,
        reply = true,
        deleteResponse = true,
        content = null,
        noResponse = false,
      } = await command.execute(message, args);

      if (noResponse) return;

      if (!!content)
        return await message.channel.send(content).then((msg) => {
          setTimeout(() => msg.delete(), 15000);
        });

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(bot.accentColor)
        .setDescription(description)
        .addFields(...fields)
        .setImage(image)
        .setThumbnail(thumbnail)
        .setTimestamp()
        .setFooter({
          text: bot.client.user.username,
          iconURL: bot.imgUrl,
        });

      if (reply)
        await message
          .reply({ embeds: [embed], components: actionRows ?? undefined })
          .then((msg) => {
            setTimeout(() => msg.delete(), 15000);
          });
      else {
        await message.channel
          .send({ embeds: [embed], components: actionRows ?? undefined })
          .then((msg) => {
            setTimeout(() => msg.delete(), 15000);
          });
      }
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setColor("#FF0000")
        .setDescription("Descripción: " + error)
        .setTimestamp()
        .setFooter({ text: bot.client.user.username, iconURL: bot.imgUrl });
      await message.reply({ embeds: [embed] });
    }
  },
};
