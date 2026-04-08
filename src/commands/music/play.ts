import { Message, SlashCommandBuilder } from "discord.js";
import { Player } from "riffy";
import { io } from "../../services/socket";
import { bot } from "../../services/client";

// Ensures Lavalink has current voice data before playing.
// Needed when the Lavalink node reconnected (new session) after the voice
// events were already processed, leaving the player with no voice state.
async function syncVoiceAndPlay(player: Player) {
  const conn = (player as any).connection;
  const raw = conn?.voice;
  // Strip riffy's extra `event` field — Lavalink v4 only accepts { token, endpoint, sessionId }
  // Lavalink 4.2.2 requires channelId in the voice object
  const voice =
    raw?.endpoint && raw?.token && raw?.sessionId
      ? {
          token: raw.token,
          endpoint: raw.endpoint,
          sessionId: raw.sessionId,
          channelId: (player as any).voiceChannel ?? null,
        }
      : null;

  const queue = (player as any).queue;
  if (!queue.length) return;

  // Replicate player.play() manually so we can include voice in the same PATCH.
  // Sending voice + track together ensures Lavalink creates the player already
  // connected to Discord's voice server, avoiding separate voice PATCH 400s.
  let current = queue.shift();
  if (!current.track) {
    current = await current.resolve((player as any).riffy);
  }
  (player as any).current = current;
  (player as any).playing = true;
  (player as any).position = 0;

  const data: Record<string, unknown> = {
    track: { encoded: current.track },
    volume: (player as any).volume,
  };
  if (voice) data.voice = voice;

  try {
    await (player as any).node.rest.updatePlayer({
      guildId: player.guildId,
      data,
    });
  } catch (e) {
    console.error("[syncVoiceAndPlay] updatePlayer failed:", e);
  }
}

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
        io.to(player.guildId).emit("queueUpdate", [
          player.current,
          ...player.queue,
        ]);
      else io.to(player.guildId).emit("queueUpdate", player.queue);
      if (!player.playing && !player.paused)
        setTimeout(() => syncVoiceAndPlay(player), 300);
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
        io.to(player.guildId).emit("queueUpdate", [
          player.current,
          ...player.queue,
        ]);
      else io.to(player.guildId).emit("queueUpdate", player.queue);
      if (!player.playing && !player.paused)
        setTimeout(() => syncVoiceAndPlay(player), 300);
      console.log(track);
      if (!track?.info?.requester?.id)
        return {
          content: `Se añadió **${track.info.title}** de **${track.info.author} desde memer.live**`,
          deleteResponse: true,
        };

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
