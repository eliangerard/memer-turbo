import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";
import { bot } from "../../services/client";

export default {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Activa o desactiva el modo autoplay"),
  inVoice: true,
  alias: ["ap"],
  voiceCommand: ["autoplay", "auto"],
  queueDependent: true,
  async execute() {
    bot.autoPlay = !bot.autoPlay;

    return {
      title: "AutoPlay " + (bot.autoPlay ? "activado" : "desactivado"),
      result: bot.autoPlay,
    };
  },
};
