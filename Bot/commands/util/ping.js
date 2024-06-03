const { SlashCommandBuilder } = require('discord.js');


//todo make this embed and nice and stuff
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! and shows the latency.'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        await interaction.editReply(`Pong!
- Latency: ${latency}ms
- API Latency: ${apiLatency}ms`);
    },
};