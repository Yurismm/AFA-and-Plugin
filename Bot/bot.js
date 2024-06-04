require('dotenv').config();
const axios = require('axios');
const { token, xrapidkey, xhostname } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, InteractionType ,ButtonBuilder } = require('discord.js');


console.log('nhskey2 test', process.env.NHS_Key_2);

const getinfoDisorder = async (disorder) =>{
    // get request from NHS APi
    const options = {
        method: 'GET',
        url: `https://api.nhs.uk/conditions/${disorder}`,
        headers: {
        'subscription-key': process.env.NHS_Key_2,
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

const client = new Client
({
    intents:
    [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
    ]
});

client.commands = new Collection();
const foldersPath =path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


// for the buttons later down the line, im using a lot of the old code from my old bot
const roleButtonMapping = {};

// set this to member later when i get the chance
const autorole = ""; 

// add the commands from the commands folder WIP
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}

});

client.once(Events.ClientReady, cReady=> {
	testDisorderInfo();
    console.log(`logged in as ${cReady.user.tag}`);
});

client.login(token);
