const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// update with more infomation
// add a dropdown menu


module.exports = {
    data: new SlashCommandBuilder()
        .setName('urgenthelp')
        .setDescription('Provides urgent help contact information for various regions'),
        
    async execute(interaction) {
        const urgentembed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Urgent Help Contact Information')
            .setDescription('If you are in crisis or need urgent help, please contact the appropriate service for your region.')
            .addFields(
                { name: 'Europe', value: '112 (General emergency number)' },
                { name: 'UK', value: 'Samaritans - 116 123 (free)' },
                { name: 'Canada', value: 'Crisis Services Canada - 1-833-456-4566' },
                { name: 'USA', value: 'National Suicide Prevention Lifeline - 988' },
                { name: 'Australia', value: 'Lifeline Australia - 13 11 14' },
                { name: 'Asia', value: 'Various services:\n- India: AASRA - +91-9820466726\n- Japan: Tokyo Mental Health - 03-5774-0992\n- China: Beijing Suicide Research and Prevention Center - 800-810-1117' }
            )
            .setFooter({ text: 'Please reach out immediately if you need help' })
            .setTimestamp();

        await interaction.reply({ embeds: [urgentembed] });
    }
};

