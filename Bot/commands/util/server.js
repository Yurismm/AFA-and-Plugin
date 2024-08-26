const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// todo, make this an embed, and make it page list


module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Provides information about the server.'),
    async execute(interaction) {
        const guild = interaction.guild;

        // Fetch all roles and members of the guild
        await guild.roles.fetch();
        await guild.members.fetch();

        // Create a map to count the members for each role
        const roleCounts = new Map();

        guild.roles.cache.forEach(role => {
            if (role.name !== '@everyone') {
                roleCounts.set(role.name, 0);
            }
        });

        guild.members.cache.forEach(member => {
            member.roles.cache.forEach(role => {
                if (role.name !== '@everyone') {
                    roleCounts.set(role.name, roleCounts.get(role.name) + 1);
                }
            });
        });

        // Create a string to display the role counts with a limit
        const roleCountEntries = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1]);
        let roleCountString = 'Role counts:\n';
        let remainingRoles = 0;

        roleCountEntries.forEach(([roleName, count], index) => {
            if (roleCountString.length < 1800) {
                roleCountString += `- **${roleName}**: ${count} member(s)\n`;
            } else {
                remainingRoles += 1;
            }
        });

        if (remainingRoles > 0) {
            roleCountString += `...and ${remainingRoles} more roles.`;
        }

        /* WIP: EmbedBuilder
        
                const serverEmbed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle("Server Information")
            .addFields(
                { name: 'Server Name:', value: guild.name },
                { name: 'Total Members:', value: guild.memberCount }
            )
            .setDescription(roleCountString);
        
            */

        await interaction.reply(`**Server Information:**
- **Server Name:** ${guild.name}
- **Total Members:** ${guild.memberCount}
- ${roleCountString}`);
    },
};