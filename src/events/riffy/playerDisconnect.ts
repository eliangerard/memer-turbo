import { EmbedBuilder, TextChannel } from "discord.js";
import { Player } from "riffy";
import { bot } from "../../services/client";
import { io } from "../../services/socket";

export default {
  name: "playerDisconnect",
  async execute(player: Player) {
    io.to(player.guildId).emit("queueUpdate", []);
  },
};
