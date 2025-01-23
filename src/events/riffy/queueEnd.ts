import { EmbedBuilder, TextChannel } from "discord.js";
import { Player } from "riffy";
import { bot } from "../../services/client";
import { io } from "../../services/socket";

export default {
  name: "queueEnd",
  async execute(player: Player) {
    io.emit("queueUpdate", []);

    const channel =
      (bot.client.channels.cache.get(player.textChannel) as TextChannel) ?? "";

    if (!channel)
      return console.log("No se pudo encontrar el canal de texto de la sesión");

    if (bot.autoPlay) {
      player.autoplay(player);
    } else {
      player.destroy();
      const embed = new EmbedBuilder()
        .setTitle(` Finished`)
        .setDescription("Cola terminada")
        .setColor(bot.accentColor)
        .setTimestamp()
        .setFooter({ text: "Memer", iconURL: bot.imgUrl });

      channel.send({ embeds: [embed] }).then((msg) => {
        setTimeout(() => msg.delete(), 15000);
      });
    }
  },
};
