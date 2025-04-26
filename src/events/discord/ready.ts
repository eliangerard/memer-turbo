import { bot } from "../../services/client";
import { ActivityType } from "discord.js";

export default {
  name: "ready",
  execute() {
    if (!bot.client?.user)
      return console.log("There was an error with the discord client");

    bot.riffy.init(bot.client.user.id);
    bot.client.user?.setPresence({
      activities: [
        {
          type: ActivityType.Custom,
          name: `Úsame con ${bot.prefix}help`,
        },
      ],
      status: "online",
    });
    console.log(`Logged in as ${bot.client.user.tag}`);
  },
};
