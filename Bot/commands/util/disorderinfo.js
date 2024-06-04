const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { token, xrapidkey, xhostname} = require('../../config.json');
const fs = require('node:fs');
const path = require('node:path');


const nhskey2 = process.env.NHS_KEY_2;

const getinfoDisorder = async (disorder) =>{
    // get request from NHS API
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

        // Extract the main description
        const description = data.description || 'No description available.';

        // Optionally extract additional relevant parts
        const hasPartDescriptions = data.hasPart
            ? data.hasPart.map(part => part.description).filter(desc => desc).join('\n\n')
            : '';

        return {
            mainDescription: description,
            additionalDescriptions: hasPartDescriptions
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disorderinfo') // change name when you can
        .setDescription('Provides infomation about a disability')
        .addStringOption(option =>
            option.setName('disorder')
                .setDescription('The disorder to get infomation about')
                .setRequired(true)
        ),
        
    async execute(interaction){
        const guild = interaction.guild; // server if need
        const disorder = interaction.options.getString('disorder')
            try{
                const data = await getinfoDisorder(disorder);
                const replyMessage = `Information about ${disorder}:**\n\n${data.mainDescription}\n\n${data.additionalDescriptions}**`;
                await interaction.reply(replyMessage);
            }catch(error){
                await interaction.reply("check the console log");
            }
        }
}