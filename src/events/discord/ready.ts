import { bot } from "../../services/client";

export default {
  name: "ready",
  execute() {
    if (!bot.client?.user)
      return console.log("There was an error with the discord client");

    bot.riffy.init(bot.client.user.id);
    console.log(`Logged in as ${bot.client.user.tag}`);
  },
};
