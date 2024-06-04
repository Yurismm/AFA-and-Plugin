const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! and shows the latency.'),
    async execute(interaction) {

        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const pingEmbed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle("Pong!")
            .addFields(
                {name: "Latency: ", value: latency + "ms"},
                {name: "API Latency: ", value: apiLatency + "ms"},
            )

        await interaction.editReply({embeds:[pingEmbed]});
    },
};