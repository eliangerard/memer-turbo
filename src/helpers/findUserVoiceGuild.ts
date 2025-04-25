import { bot } from "../services/client";

export async function findUserVoiceGuild(userId: string) {
  try {
    const guilds = bot.client.guilds.cache;

    for (const [guildId, guild] of guilds) {
      try {
        const member = await guild.members.fetch(userId);

        if (member.voice.channelId) {
          return guildId;
        }
      } catch (error) {
        if ((error as any).code === 10007) continue;
        if (error instanceof Error) {
          console.error(`Error en servidor ${guildId}:`, error.message);
        } else {
          console.error(`Error en servidor ${guildId}:`, error);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error general:", error);
    return null;
  }
}
