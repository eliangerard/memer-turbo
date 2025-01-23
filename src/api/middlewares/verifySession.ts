import { NextFunction, Request, Response } from "express";

export interface CustomRequest extends Request {
  user?: any;
}

const verifySession = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers.authorization) {
    res.status(401).send({ error: "No autorizado" });
    return;
  }

  const token = req.headers.authorization.split(" ")[1];

  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  const json = await response.json();
  if (json.code === 0) {
    res.send(json);
  } else {
    req.user = json;
    req.user.access_token = token;
    next();
  }
};

export { verifySession };
