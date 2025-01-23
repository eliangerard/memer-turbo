import { auth } from "./api/routes/auth";
import { music } from "./api/routes/music";

import { router } from "./api/routes/server";
import { bot } from "./services/client";
import { connection } from "./services/db";
import { app, server } from "./services/socket";
import cors from "cors";

const { client } = bot;

connection
  .then(() => {
    console.log("DB: Connected to database");
  })
  .catch((err) => {
    console.error("DB: " + err);
  });

app.use(cors());
app.use(router);
app.use(auth);
app.use(music);

server.listen(process.env.API_PORT, () => {
  console.log(`listening on *:${process.env.API_PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
