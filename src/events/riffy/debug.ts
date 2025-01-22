import { getGroups } from "@discordjs/voice";
import { LavalinkNode } from "riffy";

export default {
  name: "debug",
  execute(message: string) {
    console.log(getGroups());
  },
};
