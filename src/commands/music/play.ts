import { Message, SlashCommandBuilder } from "discord.js";
import { io } from "../../services/socket";

import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Reproduce una canción")
    .addStringOption((option) =>
      option
        .setName("canción")
        .setDescription(
          "Lo que quieras reproducir, puede ser una búsqueda o un link",
        )
        .setRequired(true),
    ),
  inVoice: true,
  alias: ["p"],
  voiceCommand: ["reproduce", "pon"],
  queueDependent: false,
  async execute(message: Message, args: unknown[]) {
    const query = args.join(" ");

    if (!message?.guild?.id) return console.log("Message doesnt have a guild");
    if (!message?.member?.voice?.channel?.id)
      return console.log("Message doesnt have a voice channel");

    const player = bot.riffy.createConnection({
      guildId: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
      deaf: false,
    });

    const resolve = await bot.riffy.resolve({
      query: query,
      requester: message.author,
    });
    const { loadType, tracks, playlistInfo } = resolve;

    if (loadType === "playlist") {
      for (const track of resolve.tracks) {
        track.info.requester = message.author;
        player.queue.add(track);
      }

      if (player.current)
        io.emit("queueUpdate", [
          player.current.info,
          ...player.queue.map((track) => track.info),
        ]);
      else
        io.emit(
          "queueUpdate",
          player.queue.map((track) => track.info),
        );
      if (!player.playing && !player.paused) player.play();
      return {
        content: `Se añadieron \`${tracks.length} canciones\` desde \`${playlistInfo?.name}\``,
        deleteResponse: true,
      };
    } else if (loadType === "search" || loadType === "track") {
      const track = tracks.shift();
      if (!track) return console.log("There is no track to play");

      track.info.requester = message.author;

      player.queue.add(track);
      if (player.current)
        io.emit("queueUpdate", [
          player.current.info,
          ...player.queue.map((track) => track.info),
        ]);
      else
        io.emit(
          "queueUpdate",
          player.queue.map((track) => track.info),
        );
      if (!player.playing && !player.paused) player.play();
      console.log(track);
      return {
        content: `<@!${track.info.requester.id}> añadió **${track.info.title}** de **${track.info.author}**`,
        deleteResponse: true,
      };
    } else {
      return {
        content: `No se encontró nada para: ${query}`,
        deleteResponse: true,
      };
    }
  },
};
