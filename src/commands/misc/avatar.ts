import {
  SlashCommandBuilder,
  Message,
  OmitPartialGroupDMChannel,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra el avatar del usuario indicado")
    .addUserOption((option) =>
      option
        .setName("usuario")
        .setDescription("El usuario del que mostrar el avatar")
        .setRequired(true),
    ),
  inVoice: false,
  alias: ["av", "foto", "pic"],
  async execute(message: OmitPartialGroupDMChannel<Message>, params: string[]) {
    if (!message?.guild) return;
    const user = await message.guild.members.fetch(
      params[0].substring(params[0].indexOf("@") + 1, params[0].indexOf(">")),
    );
    return {
      title: "Avatar de " + user.displayName,
      image: user.displayAvatarURL({ size: 1024 }),
    };
  },
};
