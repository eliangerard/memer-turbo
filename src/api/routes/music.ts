import express, { Response } from "express";
import { CustomRequest, verifySession } from "../middlewares/verifySession";
import toObject from "../../util/toObject";
import { Track } from "../../../types/Track";
import Command from "../../models/Command";
import { bot } from "../../services/client";
import { Guild } from "discord.js";
import { findUserVoiceGuild } from "../../helpers/findUserVoiceGuild";

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
  res.send({
    songs: json.data.filter((track: Track) => track.type === "track"),
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
