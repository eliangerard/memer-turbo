import dotenv from "dotenv";
dotenv.config();
import process from "process";
import {
  Client,
  Collection,
  ColorResolvable,
  GatewayDispatchEvents,
  GatewayIntentBits,
} from "discord.js";
import { LavalinkNode, Riffy, RiffyEventType, Player, Track } from "riffy";
import { addSpeechEvent } from "discord-speech-recognition";
import { getFiles } from "../helpers/getFiles";
import path from "path";
import { readdirSync } from "fs";
import { Command } from "../../types/Command";
import { Bot } from "../../types/Bot";

const node: LavalinkNode = {
  host: process.env.LAVALINK_HOST ?? "localhost",
  password: process.env.LAVALINK_PASSWORD ?? "",
  port: Number(process.env.LAVALINK_PORT) ?? 2333,
  secure: process.env.LAVALINK_SECURE === "true",
};

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
});

// Fix riffy bug: voice object includes `event: null` which Lavalink v4 rejects (400).
// Monkey-patch the prototype before any players are created so every player gets
// the clean voice payload { token, endpoint, sessionId } only.
const { Connection } = require("riffy/build/structures/Connection");
Connection.prototype.updatePlayerVoiceData = function () {
  // Skip voice-only PATCHes when the player hasn't started playing yet.
  // Lavalink rejects PATCH on a player that doesn't exist server-side.
  // syncVoiceAndPlay() will create the player with voice+track together.
  if (!this.player.current && !this.player.playing) return;
  const { sessionId, endpoint, token } = this.voice;
  // Lavalink 4.2.2 requires channelId in the voice object
  const channelId = this.player.voiceChannel ?? null;
  this.player.node.rest.updatePlayer({
    guildId: this.player.guildId,
    data: {
      voice: { sessionId, endpoint, token, channelId },
      volume: this.player.volume,
    },
  });
};

// Some Lavalink forks reject ?noReplace=false with 400. Remove it — the default
// behavior (replace current track) matches noReplace=false anyway.
const { Rest } = require("riffy/build/structures/Rest");
const _origUpdatePlayer = Rest.prototype.updatePlayer;
Rest.prototype.updatePlayer = function (options: {
  guildId: string;
  data: unknown;
}) {
  const origMakeRequest = this.makeRequest.bind(this);
  this.makeRequest = (
    method: string,
    endpoint: string,
    body: unknown,
    includeHeaders?: boolean,
  ) =>
    origMakeRequest(
      method,
      endpoint.replace("?noReplace=false", ""),
      body,
      includeHeaders,
    );
  const result = _origUpdatePlayer.call(this, options);
  this.makeRequest = origMakeRequest;
  return result;
};

const riffy = new Riffy(client, [node], {
  send: (payload) => {
    const guild = client.guilds.cache.get(payload.d.guild_id);
    if (guild) guild.shard.send(payload);
  },
  defaultSearchPlatform: process.env.SEARCH_PLATFORM,
  restVersion: "v4",
  bypassChecks: {
    nodeFetchInfo: false,
  },
});

const commands = new Collection<string, Command>();
const commandFiles = getFiles("src/commands");
console.log(commandFiles);

commandFiles.forEach((file) => {
  const filePath = path.join(__dirname, "../" + file);
  const { default: command }: { default: Command } = require(
    filePath.includes("dist") ? filePath.replace(".ts", ".js") : filePath,
  );
  commands.set(command.data.name, command);
});
addSpeechEvent(client);

export const bot: Bot = {
  client,
  riffy,
  prefix: process.env.DISCORD_PREFIX ?? "",
  commands,
  imgUrl: process.env.DISCORD_BOT_URL ?? "",
  accentColor: (process.env.DISCORD_BOT_ACCENT_COLOR ??
    "#9c9c9c") as ColorResolvable,
  autoPlay: false,
  previous: [],
};

const eventsPath = path.join(__dirname, "../events/discord");
const eventFiles = readdirSync(eventsPath).filter(
  (file) => file.endsWith(".ts") || file.endsWith(".js"),
);

eventFiles.forEach((file) => {
  const filePath = path.join(eventsPath, file);
  const { default: event } = require(filePath);

  if (event.once) {
    bot.client.once(event.name, (...args) =>
      event.execute(...args, bot.client),
    );
  } else {
    bot.client.on(event.name, (...args) => event.execute(...args, bot.client));
  }
});

const riffyPath = path.join(__dirname, "../events/riffy");
const riffyEvents = readdirSync(riffyPath).filter(
  (file) => file.endsWith(".ts") || file.endsWith(".js"),
);

riffyEvents.forEach((file) => {
  const filePath = path.join(riffyPath, file);
  const { default: event } = require(filePath);
  console.log(event);
  bot.riffy.on(event.name, (...args: unknown[]) => {
    console.log(event.name);
    if (event.name === "raw") console.log(args);
    event.execute(...args);
  });
});

bot.client.on("raw", (d) => {
  if (
    [
      GatewayDispatchEvents.VoiceStateUpdate,
      GatewayDispatchEvents.VoiceServerUpdate,
    ].includes(d.t)
  ) {
    console.log(`[Voice] Raw event received: ${d.t}`, JSON.stringify(d.d));
    bot.riffy.updateVoiceState(d);
  }
});

// Temporary diagnostics: log detailed voice/connection debug info

(bot.riffy as any).on("debug", (msg: string) => {
  if (
    msg.includes("voice") ||
    msg.includes("Voice") ||
    msg.includes("CONNECTION") ||
    msg.includes("Rest")
  ) {
    console.log("[Riffy Debug]", msg);
  }
});

// Catch track errors that are otherwise silently dropped
bot.riffy.on(
  RiffyEventType.TrackError,
  (player: Player, track: Track, payload: unknown) => {
    console.error("[trackError]", JSON.stringify(payload));
  },
);

// Catch WebSocket close events (e.g. voice region issues, bot kicked from VC)
bot.riffy.on(
  RiffyEventType.SocketClosed,
  (player: Player, payload: unknown) => {
    console.warn("[socketClosed]", JSON.stringify(payload));
  },
);
