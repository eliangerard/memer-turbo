import { Client, Collection, ColorResolvable } from "discord.js";
import { Riffy, Track } from "riffy";
import { Command } from "./Command";

type PreviousSong = {
  song: Track;
  guildId: string;
};

export type Bot = {
  client: Client;
  riffy: Riffy;
  prefix: string;
  commands: Collection<string, Command>;
  imgUrl: string;
  accentColor: ColorResolvable;
  autoPlay: boolean;
  previous: PreviousSong[];
};
