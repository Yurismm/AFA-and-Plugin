const { SlashCommandBuilder } = require('discord.js');

const rolesText = [
    'Paraplegia',
    'Cerebral Palsy',
    'Fibromyalgia',
    'Chronic Fatigue Syndrome',
    'Amputations',
    'Paralysis',
    'IBD/Crohns/Colitis',
    'IBS',
    'Acid Reflux / GERD',
    'Proctitis',
    'Blindness',
    'Low Vision',
    'Color Blindness',
    'Deafness',
    'Speech Aphasia',
    'Stutters',
    'Speech Impediments',
    'Epilepsy',
    'Parkinsons Disease',
    'Multiple Sclerosis (MS)',
    'Narcolepsy',
    'Alzheimers Disease',
    'Muscular Dystrophy',
    'Arthritis',
    'Huntingtons Disease',
    'FASD',
    'Sickle Cell Disease',
    'Hemophilia',
    'Down Syndrome',
    'Tourettes Syndrome',
    'Aspergers Syndrome',
    'Amnesia',
    'Learning Disabilities',
    'Depression',
    'Anxiety Disorders',
    'ASD',
    'ADHD',
    'Bipolar Disorder',
    'Schizophrenia',
    'Personality Disorders',
    'OCD',
    'PTSD / CPTSD',
    'Eating Disorders',
    'Diabetes (Type 1 and Type 2)',
    'Pancreatitis',
    'Hypertension',
    'COPD',
    'Heart Disease',
    'Osteoporosis',
    'Asthma',
    'Lupus',
    'Celiac Disease',
    'Anemia',
    'Lyme Disease',
    'Fibromyalgia',
    'ME',
    'MCAS',
    'POTS'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createroles')
        .setDescription('Creates roles based on a predefined list'),
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply('Could not find the server.');
            return;
        }

        for (const roleName of rolesText) {
            const existingRole = guild.roles.cache.find(role => role.name === roleName);
            if (existingRole) {
                console.log(`Role "${roleName}" already exists`);
                continue;
            }

            try {
                await guild.roles.create({
                    name: roleName,
                    reason: 'Creating disability role',
                });
                console.log(`Role "${roleName}" created successfully`);
            } catch (error) {
                console.error(`Error creating role "${roleName}":`, error);
            }
        }

        await interaction.editReply('Roles have been created successfully.');
    },
};