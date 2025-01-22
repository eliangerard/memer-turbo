import { Player, Track } from "riffy";
import { bot } from "../../services/client";

export default {
  name: "trackEnd",
  execute: async (player: Player, track: Track) => {
    console.log("adding to previous", track.info.uri);
    const previous = bot.previous.find(
      (song) => song.guildId === player.guildId,
    );

    if (!previous) bot.previous.push({ song: track, guildId: player.guildId });
  },
};
