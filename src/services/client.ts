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
import { LavalinkNode, Riffy } from "riffy";
import { addSpeechEvent } from "discord-speech-recognition";
import { getFiles } from "../helpers/getFiles";
import path from "path";
import { readdirSync } from "fs";
import { Command } from "../../types/Command";
import { Bot } from "../../types/Bot";

const node: LavalinkNode[] = [
  {
    host: process.env.LAVALINK_HOST1 ?? "localhost",
    password: process.env.LAVALINK_PASSWORD1 ?? "",
    port: Number(process.env.LAVALINK_PORT1) ?? 2333,
    secure: process.env.LAVALINK_SECURE1 === "true",
  },
  {
    host: process.env.LAVALINK_HOST2 ?? "localhost",
    password: process.env.LAVALINK_PASSWORD2 ?? "",
    port: Number(process.env.LAVALINK_PORT2) ?? 2333,
    secure: process.env.LAVALINK_SECURE2 === "true",
  },
];

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

const riffy = new Riffy(client, node, {
  send: (payload) => {
    const guild = client.guilds.cache.get(payload.d.guild_id);
    if (guild) guild.shard.send(payload);
  },
  defaultSearchPlatform: process.env.SEARCH_PLATFORM,
  restVersion: "v4",
  bypassChecks: { nodeFetchInfo: false },
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
  bot.riffy.on(event.name, (...args) => {
    console.log(event.name);
    if (event.name === "raw") console.log(args);
    event.execute(...args);
  });
});

bot.client.on("raw", (d) => {
  if (
    ![
      GatewayDispatchEvents.VoiceStateUpdate,
      GatewayDispatchEvents.VoiceServerUpdate,
    ].includes(d.t)
  )
    return;
  bot.riffy.updateVoiceState(d);
});
