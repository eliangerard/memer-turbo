import { SpeechEvents } from "discord-speech-recognition";
import { bot } from "../../services/client";
import { Message, OmitPartialGroupDMChannel } from "discord.js";

export default {
  name: SpeechEvents.speech,
  execute(message: OmitPartialGroupDMChannel<Message>) {
    console.log(message.author.displayName, ":", message.content);
  },
};
