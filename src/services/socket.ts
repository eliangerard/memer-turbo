import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join", (guildId) => {
    console.log("joining room", guildId);
    socket.join(guildId);
  });
  socket.on("register", (userId: string) => {
    socket.join(userId); // Unir al usuario a su sala personal
    console.log(`Usuario ${userId} registrado en socket ${socket.id}`);
  });
  socket.on("leave", (guildId) => {
    console.log("leaving room", guildId);
    socket.leave(guildId);
  });
});
export { io, server, app };
