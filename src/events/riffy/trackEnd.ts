import { Player, Track } from "riffy";
import { bot } from "../../services/client";
import { io } from "../../services/socket";

export default {
  name: "trackEnd",
  execute: async (player: Player, track: Track) => {
    io.to(player.guildId).emit("queueUpdate", [
      player.current,
      ...player.queue,
    ]);

    const previous = bot.previous.find(
      (song) => song.guildId === player.guildId,
    );

    if (!previous) bot.previous.push({ song: track, guildId: player.guildId });
  },
};
