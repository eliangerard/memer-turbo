import { LavalinkNode } from "riffy";
import { bot } from "../../services/client";

export default {
  name: "nodeConnect",
  execute(node: LavalinkNode) {
    console.log(`Node "${node.name}" connected.`);

    // Re-sync voice data for any players that survived a node reconnect.
    // When the Lavalink session changes, all player voice states are wiped
    // server-side, so we need to re-push them.
    for (const [guildId, player] of (bot.riffy as any).players) {
      const conn = (player as any).connection;
      const voice = conn?.voice;
      if (voice?.endpoint && voice?.token && voice?.sessionId) {
        console.log(`[nodeConnect] Re-syncing voice data for guild ${guildId}`);
        conn.updatePlayerVoiceData();
      }
    }
  },
};
