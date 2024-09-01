// https://discord.com/oauth2/authorize?client_id=1119356790199554079&permissions=8&integration_type=0&scope=bot+applications.commands

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { data } = require('./wordoftheday');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Generates an invite link for the bot.'),
    async execute(interaction) {
        const inviteEmbed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle("Invite Link")
            .setDescription("Click [here](https://discord.com/oauth2/authorize?client_id=1119356790199554079&permissions=8&integration_type=0&scope=bot+applications.commands) to invite the bot to your server.");

        await interaction.reply({ embeds: [inviteEmbed] });
    },
};

