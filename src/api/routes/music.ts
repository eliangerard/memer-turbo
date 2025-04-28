import express, { Response } from "express";
import { CustomRequest, verifySession } from "../middlewares/verifySession";
import toObject from "../../util/toObject";
import { Track } from "../../../types/Track";
import Command from "../../models/Command";
import { bot } from "../../services/client";
import { Guild } from "discord.js";
import { findUserVoiceGuild } from "../../helpers/findUserVoiceGuild";
import yts from "yt-search";
import { start } from "repl";

const music = express.Router();

music.post("/search", async (req: CustomRequest, res: Response) => {
  const { query, index = null } = req.body;
  console.log("Searching", query);

  const response = await fetch(
    `https://api.deezer.com/search?q=${query}${index ? `&index=${index}` : ""}`,
  );

  const json = await response.json();
  const nextIndex = json.next
    ? new URL(json.next).searchParams.get("index")
    : null;
  const songsFiltered = json.data.filter(
    (track: Track) => track.type === "track",
  );
  if (songsFiltered.length === 0) {
    const response = await yts(query);
    const startIndex = parseInt(index) ? parseInt(index) : 0;
    const endIndex = startIndex + 19;
    const songs = response.videos.slice(startIndex, endIndex);
    console.log(startIndex, endIndex);
    const songsFiltered = songs.map((song) => ({
      id: parseInt(song.videoId, 36), // Convertimos el videoId a número
      readable: true, // Asumimos que todos los videos de YouTube son "legibles"
      title: song.title,
      title_short: song.title.slice(0, 30), // Versión corta del título
      title_version: "", // No aplica en YouTube
      link: song.url,
      duration: song.duration.seconds, // Duración en segundos
      rank: 0, // No hay ranking en YouTube
      explicit_lyrics: false, // No hay forma de saberlo con yt-search
      explicit_content_lyrics: 0,
      explicit_content_cover: 0,
      preview: "", // YouTube no proporciona preview como Deezer
      md5_image: song.thumbnail, // Usamos el thumbnail como imagen
      artist: {
        id: 0, // No hay ID de artista en YouTube
        name: song.author.name,
        link: song.author.url,
        picture: "", // No hay imagen del artista
        picture_small: "",
        picture_medium: "",
        picture_big: "",
        picture_xl: "",
        tracklist: "",
        type: "artist",
      },
      album: {
        id: 0, // No hay álbum en YouTube
        title: "YouTube Video", // Placeholder
        cover: song.thumbnail, // Usamos el thumbnail como portada
        cover_small: song.thumbnail,
        cover_medium: song.thumbnail,
        cover_big: song.thumbnail,
        cover_xl: song.thumbnail,
        md5_image: song.thumbnail,
        tracklist: "",
        type: "album",
      },
      type: "youtube", // Identificamos que viene de YouTube
    }));
    res.send({
      songs: songsFiltered,
      next: endIndex + 1,
    });
    return;
  }
  res.send({
    songs: songsFiltered,
    next: nextIndex,
  });
});

music.get("/chart", async (req: CustomRequest, res: Response) => {
  const response = await fetch("https://api.deezer.com/chart");
  const json = await response.json();
  res.send(json.tracks.data.filter((track: Track) => track.type === "track"));
});

music.get(
  "/servers",
  verifySession,
  async (req: CustomRequest, res: Response) => {
    const botServers = await bot.client.guilds.fetch();
    const userServers = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${req.user.access_token}`,
        },
      },
    ).then((response) => response.json());

    const similarServers = botServers.filter((server) =>
      userServers?.some((userServer: Guild) => userServer.id === server.id),
    );
    const guildId = await findUserVoiceGuild(req.user.id);
    res.json({
      servers: toObject(similarServers),
      currentServer: guildId ? guildId : null,
    });
  },
);

music.get(
  "/server/:id/activity",
  verifySession,
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.json({ activity: {} });
      return;
    }
    const activty = await Command.find({ guildId: id });
    res.json(activty);
  },
);

music.get(
  "/server/:id/queue",
  verifySession,
  async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      console.log("No se envió el id");
      res.json({ songs: [] });
      return;
    }
    console.log(id);
    try {
      const guild = await bot.client.guilds.fetch(id);
      console.log(guild.id);
      const player = bot.riffy.players.get(guild.id);

      if (!player) {
        console.log("No se encontró el player");

        res.json({ queue: [] });
        return;
      }
      const { queue } = player;
      if (!queue && !player.current) {
        console.log("No hay nada en la queue");

        res.json({ queue: [] });
        return;
      }
      res.json({
        queue: [player.current, ...queue],
      });
    } catch (error) {
      res.json({ queue: [], error: "SERVER_NOT_FOUND" });
      return;
    }
  },
);

export { music };
