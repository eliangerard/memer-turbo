import express, { Response } from "express";
import {
  EmbedBuilder,
  Message,
  OmitPartialGroupDMChannel,
  TextChannel,
} from "discord.js";
import { CustomRequest, verifySession } from "../middlewares/verifySession";
import { io } from "../../services/socket";
import { bot } from "../../services/client";
import Command from "../../models/Command";
const router = express.Router();

try {
  router.post(
    "/command",
    verifySession,
    async (req: CustomRequest, res: Response) => {
      console.log(req.body);
      const { command: commandCalled, params = "", guildId } = req.body;
      const userId = req.user.id;
      console.log(commandCalled, params, guildId, userId);
      let command = bot.commands.get(commandCalled);

      if (!command)
        command =
          bot.commands.find(
            (cmd) => cmd.alias && cmd.alias.includes(commandCalled),
          ) ||
          bot.commands.find(
            (cmd) =>
              cmd.voiceCommand && cmd.voiceCommand.includes(commandCalled),
          );

      if (!command) {
        console.log("No se encontró el comando");
        res.json({ queue: [] });
        return;
      }

      const guild = await bot.client.guilds.fetch(guildId);
      const user = await guild.members.fetch(userId);

      if (!guild) {
        console.log("No se encontró el server");
        res.json({ queue: [] });
        return;
      }

      let message = {
        guild,
        guildId,
        member: user,
        channel: null,
        user,
      } as unknown as OmitPartialGroupDMChannel<Message>;

      if (command.inVoice) {
        if (message?.member?.voice.channel === undefined)
          res.send("No estás en un canal de voz");
        if (
          command.inVoice &&
          message?.member?.voice.channel &&
          message.guild?.members?.me?.voice.channel &&
          message.member.voice.channel.id !==
            message.guild.members.me.voice.channel.id
        ) {
          console.log(message.guild.members.me.voice.channel);
          res.send("No estás en el mismo canal de voz");
        }

        try {
          let player = bot.riffy.players.get(guild.id);

          if (!player) {
            player = bot.riffy.createConnection({
              guildId: message?.guild?.id ?? "",
              voiceChannel: message?.member?.voice?.channel?.id ?? "",
              textChannel: message?.member?.voice?.channel?.id ?? "",
              deaf: false,
            });
          }
        } catch (error) {
          console.log(error);
          res.send("No se pudo conectar al canal de voz");
          return;
        }
      }

      const player = bot.riffy.players.get(guild.id);

      if (!player) {
        console.log("No se encontró el player");
        res.json({ queue: [] });
        return;
      }

      const channel = (await guild.channels.fetch(
        player.textChannel,
      )) as TextChannel;

      message.channel = channel;

      const { queue } = player;

      if (command.queueDependent && !queue) {
        const embed = new EmbedBuilder()
          .setTitle("Error")
          .setColor("#FF0000")
          .setDescription("No se está reproduciendo nada")
          .setTimestamp()
          .setFooter({
            text: bot?.client?.user?.username ?? "",
            iconURL: bot.imgUrl,
          });
        res.send("Comando recibido, pero no se está reproduciendo nada");
        io.to(message?.guildId ?? "").emit("command", {
          executed: false,
          error: "No se está reproduciendo nada",
          queue: [],
        });
        message.channel.send({ embeds: [embed] }).then((msg) => {
          setTimeout(() => msg.delete(), 15000);
        });
        return;
      }

      const {
        title = null,
        description = null,
        fields = [],
        image = null,
        thumbnail = null,
        content = null,
        noResponse = false,
      } = await command.execute(
        message as unknown as OmitPartialGroupDMChannel<Message>,
        params.split(" "),
      );

      const log = new Command({
        command: commandCalled,
        params,
        guildId,
        userId,
        botId: bot.client?.application?.id ?? "Unknown",
      });
      const executed = await log.save();

      const completeQueue = [player.current, ...queue];

      io.to(message?.guildId ?? "").emit("command", {
        executed,
        queue: completeQueue,
      });

      if (noResponse) {
        res.send("Comando recibido");
        return;
      }

      if (!!content) {
        await message.channel.send(content).then((msg) => {
          setTimeout(() => msg.delete(), 15000);
        });
        res.send("Comando recibido");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(bot.accentColor)
        .setDescription(description)
        .addFields(...fields)
        .setImage(image)
        .setThumbnail(thumbnail)
        .setTimestamp()
        .setFooter({
          text: bot.client?.user?.username ?? "",
          iconURL: bot.imgUrl,
        });

      await message.channel.send({ embeds: [embed] }).then((msg) => {
        setTimeout(() => msg.delete(), 15000);
      });
      console.log(executed);

      res.send("Comando recibido");
    },
  );
} catch (error) {
  console.log(error);
}

// --- Lavalink diagnostics (no auth required, remove in production) ---
router.get("/debug/lavalink", async (_req, res: Response) => {
  try {
    const results: Record<string, unknown> = {};

    for (const [name, node] of (bot.riffy as any).nodeMap) {
      const sessionId = node.sessionId ?? null;
      const connected = node.connected ?? false;
      const restBase = `http${node.secure ? "s" : ""}://${node.host}:${node.port}`;
      const headers = {
        Authorization: node.password,
        "Content-Type": "application/json",
      };

      let info: unknown = null;
      let players: unknown = null;

      try {
        const infoRes = await fetch(`${restBase}/v4/info`, { headers });
        info = await infoRes.json();
      } catch (e) {
        info = { error: String(e) };
      }

      if (sessionId) {
        try {
          const playersRes = await fetch(
            `${restBase}/v4/sessions/${sessionId}/players`,
            { headers },
          );
          players = await playersRes.json();
        } catch (e) {
          players = { error: String(e) };
        }
      } else {
        players = "no sessionId yet";
      }

      // In-memory riffy player states
      const riffyPlayers: Record<string, unknown> = {};
      for (const [guildId, player] of (bot.riffy as any).players) {
        const conn = player.connection;
        riffyPlayers[guildId] = {
          playing: player.playing,
          paused: player.paused,
          connected: player.connected,
          voiceChannel: player.voiceChannel,
          current: player.current?.info?.title ?? null,
          queueLength: player.queue?.length ?? 0,
          voice: conn?.voice ?? null,
          connectionSessionId: conn?.sessionId ?? null,
        };
      }

      results[name] = { connected, sessionId, info, players, riffyPlayers };
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export { router };
