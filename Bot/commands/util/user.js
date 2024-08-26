const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');


//todo: make this an embed
module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about the user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to get information about')
                .setRequired(false)),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id);

        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.name)
            .join(', ') || 'No roles';

            const userEmbed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle("User Information")
            .addFields(
                { name: 'Username:', value: targetUser.username },
                { name: 'Joined Server On:', value: member.joinedAt.toDateString() },
                { name: 'Roles:', value: roles }
            );

            
        await interaction.reply({ embeds: [userEmbed] });
    },
};