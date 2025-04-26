import { bot } from "../../services/client";
import { io } from "../../services/socket";
import { Player } from "riffy";
import { VoiceState } from "discord.js";

// Mapa para rastrear estados y timeouts
const userVoiceStates = new Map<
  string,
  {
    guildId: string;
    channelId: string | null;
    joinTimeout?: NodeJS.Timeout;
  }
>();

export default {
  name: "voiceStateUpdate",
  async execute(oldState: VoiceState, newState: VoiceState) {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    if (oldChannel === newChannel) return;

    // Verificar conexión Socket.IO primero
    const sockets = await io.in(userId).fetchSockets();
    if (sockets.length === 0) {
      console.log(`[Socket] Usuario ${userId} no conectado`);
      return;
    }

    // Manejar LEAVE inmediatamente
    if (oldChannel) {
      const leavePayload = {
        action: "voiceLeave",
        guildId: oldState.guild.id,
        channelId: oldChannel,
        timestamp: new Date().toISOString(),
      };

      io.to(userId).emit("voiceUpdate", leavePayload);
      console.log(
        `[Socket] Evento LEAVE enviado inmediatamente a ${userId}`,
        leavePayload,
      );
    }

    // Manejar JOIN con delay de 500ms
    if (newChannel) {
      // Cancelar JOIN pendiente si existe
      const existingState = userVoiceStates.get(userId);
      if (existingState?.joinTimeout) {
        clearTimeout(existingState.joinTimeout);
      }

      const joinTimeout = setTimeout(async () => {
        const joinPayload = {
          action: "voiceJoin",
          guildId: newState.guild.id,
          channelId: newChannel,
          timestamp: new Date().toISOString(),
        };

        // Verificar nuevamente la conexión después del delay
        const currentSockets = await io.in(userId).fetchSockets();
        if (currentSockets.length > 0) {
          io.to(userId).emit("voiceUpdate", joinPayload);
          console.log(
            `[Socket] Evento JOIN enviado con delay a ${userId}`,
            joinPayload,
          );
        }

        // Actualizar estado
        userVoiceStates.set(userId, {
          guildId: newState.guild.id,
          channelId: newChannel,
        });
      }, 500); // Delay de 500ms para JOINs

      // Guardar timeout para posible cancelación
      userVoiceStates.set(userId, {
        guildId: newState.guild.id,
        channelId: newChannel,
        joinTimeout,
      });
    } else {
      // Actualizar estado sin canal si es un LEAVE puro
      userVoiceStates.set(userId, {
        guildId: oldState.guild.id,
        channelId: null,
      });
    }
  },
};
