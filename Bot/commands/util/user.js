const { SlashCommandBuilder } = require('discord.js');


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

        await interaction.reply(`**User Information:**
- **Username:** ${targetUser.username}
- **Joined Server On:** ${member.joinedAt}
- **Roles:** ${roles}`);
    },
};