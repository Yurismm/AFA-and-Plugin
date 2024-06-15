require('dotenv').config();
const axios = require('axios');
const { token, xrapidkey, xhostname } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, InteractionType, ButtonBuilder } = require('discord.js');
const checkContent = require('./checkcontent.js');



const client = new Client({
    intents: [
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

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


// for the buttons later down the line, im using a lot of the old code from my old bot
const roleButtonMapping = {};

// set this to member later when i get the chance
const autorole = "";

// check message once its created for flashing
client.on('messageCreate', async message => {
    console.log('message received: ', message.attachments.size);

    if (message.attachments.size > 0) {
        console.log('found attachment: ', message.attachments.size);

        message.attachments.forEach(async attachment => {
            console.log('attachment details:', attachment);
            const url = attachment.url;
            const name = attachment.name || attachment.filename || 'attachment'; // ensure we have a name for the file

            try {
                // ensure the downloads directory exists
                const downloadsDir = path.join(__dirname, 'downloads');
                if (!fs.existsSync(downloadsDir)) {
                    fs.mkdirSync(downloadsDir);
                }

                const filePath = path.join(downloadsDir, name);

                const response = await axios({
                    url,
                    method: 'GET',
                    responseType: 'stream',
                });

                const writer = fs.createWriteStream(filePath);

                response.data.pipe(writer);

                writer.on('finish', () => {
                    console.log(`downloaded ${name}`.toLowerCase());
                    checkContent(filePath, (err, flashDetected) => {
                        if (err) {
                            console.error('error analyzing content: ', err);
                            message.reply('problem analyzing content -> err -> check console');
                        } else if (flashDetected) {
                            console.log("flash detected");
                            message.reply('warning: flashing content detected in your attachment.');
                        } else {
                            message.reply('no flashing content detected in your attachment.');
                        }

                        // ensure the file exists before attempting to delete it
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        } else {
                            console.error(`file not found for deletion: ${filePath}`);
                        }
                    });
                });

                writer.on('error', (err) => {
                    console.error(`failed to download ${name}:`, err);
                });

            } catch (error) {
                console.error(`error downloading attachment: ${error}`);
            }
        });
    } else {
        console.log('no attachments found');
    }
});


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

client.once(Events.ClientReady, cReady => {
    client.user.setActivity('cooler than cherie', { type: 'WATCHING' });
    client.user.setStatus('online');

    console.log(`logged in as ${cReady.user.tag}`);
});

client.login(token);