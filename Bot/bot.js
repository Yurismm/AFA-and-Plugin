require('dotenv').config();
const axios = require('axios');
const { token, xrapidkey, xhostname } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, InteractionType, ButtonBuilder, EmbedBuilder } = require('discord.js');
const checkContent = require('./checkcontent.js');

// todo: checks for duration of the video

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


// this uses the thumbnail URL we are provided with.
function convertPngToMp4(thumbnailUrl) {
    // observations with tenor: 
    // png url (provided to us) = https://media.tenor.com/EtTrt-7hGQcAAA - AN - /happy-sunday.png
    // mp4 url (not) = https://media.tenor.com/EtTrt-7hGQcAAA - Po - /happy-sunday.mp4
    // webm url (not) = https://media.tenor.com/EtTrt-7hGQcAAA - Ps - /happy-sunday.webm
    // https://media.tenor.com/GiwO27j5cjoAAAAN/kiss-lesbian.png
    // "https://media.tenor.com/GiwO27j5cjoAAA**Po**/kiss-lesbian.**mp4**"
    
    // replacing AAAAN with AAAPo to get the mp4 video
    const baseVideoUrl = thumbnailUrl.replace('AAAAN', 'AAAPo')
    // change the extension from png to mp4
    const mp4Url = baseVideoUrl.replace('.png', '.mp4');
    return mp4Url;

}

// check message once its created for flashing
client.on('messageCreate', async message => {
    console.log('message received: ', message.attachments.size);

    if (message.author.bot) return; // ignore messages from bots

    const gifRegex = /https:\/\/tenor\.com\/view\/[a-zA-Z0-9-]+/;
    const matches = message.content.match(gifRegex);

    if (matches) {
        console.log('found gif: ', matches);
        const gifUrl = matches[0];

        const gifId = gifUrl.match(/(\d+)$/)[0];
        console.log('gif link: ', gifUrl);

        // fetches the embed infomation from tenor
        const gifData = await axios.get(`https://tenor.com/oembed?url=${gifUrl}`);
        console.log('gif data: ', gifData.data);

        const videoLink = `https://tenor.com/embed/${gifId}`
        console.log('actual gif url: ', videoLink);

        // pngimg link (the thumbnail provides us with the png, a link we need to convert to get the mp4)
        const thumbnailUrl = gifData.data.thumbnail_url;
        console.log('thumbnail url: ', thumbnailUrl);

        const videoUrl = convertPngToMp4(thumbnailUrl);

        console.log('video url: ', videoUrl); // for confrimation

        const gifEmbed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Tenor GIF')
            .setDescription(`[Click here to view](${gifUrl})`)
            .setImage(gifData.data.thumbnail_url);

        message.reply({ embeds: [gifEmbed] });
        
        try {
            // ensure the downloads directory exists
            const downloadsDir = path.join(__dirname, 'downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir);
            }

            const filePath = path.join(downloadsDir, `${gifId}.mp4`);
            const writer = fs.createWriteStream(filePath);

            const response = await axios({
                url: videoUrl,
                method: 'GET',
                responseType: 'stream',
            });

            response.data.pipe(writer);

            writer.on('finish', () => {
                console.log(`downloaded ${gifUrl}`.toLowerCase());
                checkContent(filePath, (err, flashDetected) => {

                    if (err) {
                        // create embed 
                        const problemembed = new EmbedBuilder()
                        .setColor(0xFFFFFF)
                        .setTitle('Problem analyzing content')
                        .setDescription('An error occurred while analyzing the content. Could it be an image?')
                        console.error('error analyzing content: ', err);

                        message.reply({ embeds: [problemembed] });
                    } else if (flashDetected) {
                        const flashembed = new EmbedBuilder()
                        .setColor(0xFF0000) // red to indicate a warning
                        .setTitle('Flashing content detected')
                        .setDescription('Warning: flashing content detected in your attachment.')
                        .setFooter({ text: 'Please be cautious when viewing this content.'})
                        .setTimestamp();
                        // possibly can create a json log file for this to show client side
                        console.log("flash detected");
                        
                        message.reply({ embeds: [flashembed] });
                    } else {
                        const noflashembed = new EmbedBuilder()
                        .setColor(0x00FF00) // green to indicate no warning
                        .setTitle('No flashing content detected')
                        .setDescription('No flashing content detected in your attachment.')
                        .setFooter({text: 'This content is safe to view.'})
                        .setTimestamp();

                        message.reply({ embeds: [noflashembed] });
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
            console.error(`error downloading video: ${error}`);
        }
    }
    

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
                            // create embed 
                            const problemembed = new EmbedBuilder()
                            .setColor(0xFFFFFF)
                            .setTitle('Problem analyzing content')
                            .setDescription('An error occurred while analyzing the content. Could it be an image?')
                            console.error('error analyzing content: ', err);
                            
                            message.reply({ embeds: [problemembed] });
                        } else if (flashDetected) {
                            const flashembed = new EmbedBuilder()
                            .setColor(0xFF0000) // red to indicate a warning
                            .setTitle('Flashing content detected')
                            .setDescription('Warning: flashing content detected in your attachment.')
                            .setFooter({ text: 'Please be cautious when viewing this content.'})
                            .setTimestamp();
                            // possibly can create a json log file for this to show client side
                            console.log("flash detected");
                            
                            message.reply({ embeds: [flashembed] });
                        } else {
                            const noflashembed = new EmbedBuilder()
                            .setColor(0x00FF00) // green to indicate no warning
                            .setTitle('No flashing content detected')
                            .setDescription('No flashing content detected in your attachment.')
                            .setFooter({text: 'This content is safe to view.'})
                            .setTimestamp();

                            message.reply({ embeds: [noflashembed] });
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