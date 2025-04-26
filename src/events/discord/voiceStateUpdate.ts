import { bot } from "../../services/client";
import { io } from "../../services/socket";
import { Player } from "riffy";
import { VoiceState } from "discord.js";

export default {
  name: "voiceStateUpdate",
  async execute(oldState: VoiceState, newState: VoiceState) {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;

    console.log(`Usuario ${userId} cambió de estado de voz`);

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    // Solo actúa si hay un cambio real de canal
    if (oldChannel !== newChannel) {
      const payload = {
        action: newChannel ? "voiceJoin" : "voiceLeave",
        guildId: newChannel ? newState.guild.id : oldState.guild.id,
        channelId: newChannel || oldChannel,
        timestamp: new Date().toISOString(),
      };

      // 1. Verificar si el usuario está registrado en Socket.IO
      const sockets = await io.in(userId).fetchSockets();

      if (sockets.length > 0) {
        // 2. Enviar solo al usuario específico
        io.to(userId).emit("voiceUpdate", payload);
        console.log(`[Socket] Evento enviado a ${userId}`, payload);
      } else {
        console.log(`[Socket] Usuario ${userId} no está conectado al socket`);
      }
    }
  },
};
