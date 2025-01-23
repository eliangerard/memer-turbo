import express, { Request, Response } from "express";
import { bot } from "../../services/client";
import { CustomRequest, verifySession } from "../middlewares/verifySession";

const auth = express.Router();

auth.get("/refresh", async (req: Request, res: Response) => {
  const refresh_token = req.headers.authorization?.split(" ")[1];

  if (!refresh_token) {
    res.status(400).send({ message: "No token provided" });
    return;
  }

  const redirect_uri = req.headers.origin + "/callback/discord";

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.UI_CLIENT_ID ?? "",
      client_secret: process.env.UI_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refresh_token,
      redirect_uri,
      scope: "identify",
    }),
  });
  const json = await response.json();
  const meResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: `Bearer ${json.access_token}`,
    },
  });

  const { id } = await meResponse.json();
  if (!id) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  const user = await bot.client.users.fetch(id);
  res.send({ ...json, ...user, activeBot: bot.client?.user?.id });
});

auth.post("/login", async (req, res) => {
  const { code } = req.body;

  const redirect_uri = req.headers.origin + "/callback/discord";
  console.log("code", code, redirect_uri);

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.UI_CLIENT_ID ?? "",
      client_secret: process.env.UI_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri,
      scope: "identify",
    }),
  });
  const json = await response.json();

  console.log(json);

  const meResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: `Bearer ${json.access_token}`,
    },
  });
  const me = await meResponse.json();
  console.log(me);

  const { id } = me;
  if (!id) {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  res.send({ ...me, ...json, activeBot: bot.client?.user?.id });
});

auth.post("/logout", async (req, res) => {
  const { token } = req.body;
  const response = await fetch("https://discord.com/api/oauth2/token/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.UI_CLIENT_ID ?? "",
      client_secret: process.env.UI_SECRET ?? "",
      token,
      token_type_hint: "refresh_token",
    }),
  });
  res.send(await response.json());
});

auth.post(
  "/verify",
  verifySession,
  async (req: CustomRequest, res: Response) => {
    res.send({ user: req.user });
  },
);

export { auth };
