require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { token, xrapidkey, xhostname, NHSkey1, NHSkey2 } = require('../../config.json');
const fs = require('node:fs');
const path = require('node:path');

const getinfoDisorder = async (disorder) =>{
    // get request from NHS APi
    const options = {
        method: 'GET',
        url: `https://api.nhs.uk/conditions/${disorder}`,
        headers: {
        'subscription-key': process.env.NHSkey2,
        }
    };
    
    try {
        const response = await axios.request(options);
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
};

const testDisorderInfo = async () => {
	const disorder = 'Hepatitis';
	try{
		const data = await getinfoDisorder(disorder);
		console.log(data)
	}catch (error){
		console.error(`an error occurred`, error);
	}
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disorderinfo') // change name when you can
        .setDescription('Provides infomation about a disability'),
    async execute(interaction){
        const guild = interaction.guild; // server if need

        // wip


    }


}