const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { token, xrapidkey, xhostname } = require('../../config.json');
const fs = require('node:fs');
const path = require('node:path');


// WIP, fix maybe add trunication?

const nhskey2 = process.env.NHS_KEY_2;

const getinfoDisorder = async (disorder) => {
    const options = {
        method: 'GET',
        url: `https://api.nhs.uk/conditions/${disorder}`,
        headers: {
            'subscription-key': nhskey2,
        }
    };

    try {
        const response = await axios.request(options);
        const data = response.data;

        // Extract the main description with a default fallback
        const description = data.description || 'No description available.';

        // Optionally extract additional relevant parts with a default fallback
        const hasPartDescriptions = data.hasPart
            ? data.hasPart.map(part => part.description).filter(desc => desc && desc.length > 0).join('\n\n')
            : 'No additional information available.';

        // Extract sections with a default fallback
        const sections = data.hasPart
            ? data.hasPart.map(part => ({
                title: part.headline || 'Additional Information',
                content: part.description || 'No content available.'
              })).filter(section => section.content && section.content.length > 0)
            : [];

        return {
            mainDescription: description,
            additionalDescriptions: hasPartDescriptions,
            sections: sections,
            url: data.url || 'No URL available.'
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disorderinfo')
        .setDescription('Provides information about a disorder')
        .addStringOption(option =>
            option.setName('disorder')
                .setDescription('The disorder to get information about')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        const disorder = interaction.options.getString('disorder');
        
        try {
            const data = await getinfoDisorder(disorder);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle(`Information about ${disorder}`)
                .addFields(
                    { name: 'Disorder:', value: disorder },
                    { name: 'Description:', value: data.mainDescription },
                    { name: 'Additional Information:', value: data.additionalDescriptions }
                )
                .setFooter({ text: 'Powered by NHS' })
                .setTimestamp();

            // add sections to the embed if they exist
            if (data.sections.length > 0) {
                data.sections.forEach(section => {
                    embed.addFields({ name: section.title, value: section.content });
                });
            }

            // add a URL field if available
            if (data.url !== 'No URL available.') {
                embed.addFields({ name: 'More Information', value: `[Click here](${data.url})` });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.log(error);
            await interaction.reply("Check console logs");
        }
    }
};