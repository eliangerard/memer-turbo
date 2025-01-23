import mongoose from "mongoose";

const CommandSchema = new mongoose.Schema(
  {
    command: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    params: {
      type: String,
      lowercase: true,
      trim: true,
    },
    guildId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    botId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Command = mongoose.model("Command", CommandSchema);

export default Command;
