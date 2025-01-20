import { Classic } from "musicard";
import { Player, Track } from "riffy";
import { bot } from "../../services/client";
import { TextChannel } from "discord.js";

export default {
  name: "trackStart",
  execute: async (player: Player, track: Track) => {
    const channel =
      (bot.client.channels.cache.get(player.textChannel) as TextChannel) ??
      undefined;

    if (!channel)
      return console.log("No se pudo encontrar el canal de texto de la sesión");

    function formatTime(time: number) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }

    const musicLength = track.info.length;
    const formattedLength = formatTime(Math.round(musicLength / 1000));

    const musicard = await Classic({
      thumbnailImage: track.info.thumbnail ?? "",
      backgroundColor: "#2B2D31",
      progress: 0,
      progressColor: bot.accentColor.toString(),
      progressBarColor: "#1F2022",
      name: track.info.title,
      nameColor: bot.accentColor.toString(),
      author: track.info.author,
      authorColor: "#9E9E9E",
      startTime: "0:00",
      endTime: formattedLength,
      timeColor: "#9E9E9E",
    });

    await channel
      .send({
        files: [{ attachment: musicard }],
      })
      .then((msg) => {
        setTimeout(() => msg.delete(), 15000);
      });
  },
};
