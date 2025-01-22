import { SlashCommandBuilder } from "discord.js";
import { Message, OmitPartialGroupDMChannel } from "discord.js";
import { bot } from "../../services/client";
import { Command } from "../../../types/Command";

export default {
  data: new SlashCommandBuilder()
    .setName("previous")
    .setDescription("Reproduce la canción anterior"),
  inVoice: true,
  alias: ["prev"],
  voiceCommand: ["anterior", "regresa"],
  queueDependent: true,
  async execute(message: OmitPartialGroupDMChannel<Message>) {
    if (!message.guild || !message.guildId) return;
    const play = bot.commands.get("play") as Command;

    const previousTrack = bot.previous.find(
      (song) => song.guildId === message.guildId,
    );

    if (!previousTrack?.song.info.uri)
      return {
        title: "No hay una canción anterior aún",
      };

    await play.execute(message, [previousTrack?.song.info.uri]);

    const player = bot.riffy.players.get(message.guild.id);

    if (!player)
      return {
        noResponse: true,
      };

    const lastTrack = player.queue.pop();
    if (lastTrack) {
      player.queue.unshift(player.current);
      player.queue.unshift(lastTrack);
    }

    player.stop();

    return {
      noResponse: true,
    };
  },
};
