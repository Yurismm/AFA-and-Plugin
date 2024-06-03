const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const {Client, Collection, Events, GatewayIntentBits, InteractionType,ButtonBuilder } = require('discord.js');

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
const folderPath =path.join(__dirname, 'commands');
const commandsFolders = fs.readdirSync(foldersPath);


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
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
