import {
  ActionRowBuilder,
  ActionRowData,
  AnyComponentBuilder,
  APIActionRowComponent,
  APIMessageActionRowComponent,
  Client,
  Message,
  MessageReaction,
  MessageReactionEventDetails,
  OmitPartialGroupDMChannel,
  PartialMessageReaction,
  PartialUser,
  SlashCommandBuilder,
  User,
} from "discord.js";

type Field = {
  name: string;
  value: string;
};

type Handler = (
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  details: MessageReactionEventDetails,
  newHandler: (
    reaction: MessageReaction,
    user: User | PartialUser,
    details: MessageReactionEventDetails,
  ) => Handler,
) => Client;

export type NewHandler = (
  reaction: MessageReaction,
  user: User | PartialUser,
  details: MessageReactionEventDetails,
) => Handler;

export type CommandResponse = {
  title?: string;
  description?: string;
  fields: Field[];
  image?: string;
  thumbnail?: string;
  react?: string[];
  handler?: Handler;
  actionRows?: APIActionRowComponent<APIMessageActionRowComponent>[];
  resetTimeout?: boolean;
  reply?: boolean;
  deleteResponse?: boolean;
  content?: string;
  noResponse?: boolean;
};

export type CommandExecute = (
  message: OmitPartialGroupDMChannel<Message>,
  args: string[],
) => Promise<CommandResponse>;

export type Command = {
  data: SlashCommandBuilder;
  inVoice: boolean;
  alias: string[];
  voiceCommand: string[];
  queueDependent: boolean;
  execute: CommandExecute;
  deleteInvocation?: boolean;
};
