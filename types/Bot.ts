import { Client, Collection, ColorResolvable } from "discord.js";
import { Riffy } from "riffy";
import { Command } from "./Command";

export type Bot = {
  client: Client;
  riffy: Riffy;
  prefix: string;
  commands: Collection<string, Command>;
  imgUrl: string;
  accentColor: ColorResolvable;
  autoPlay: boolean;
};
