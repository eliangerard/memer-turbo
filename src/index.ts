import { bot } from "./services/client";

const { client } = bot;

client.login(process.env.DISCORD_TOKEN);
