const { SlashCommandBuilder, ActivityType } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Set bot activity status (Owner only)')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'playing' },
          { name: 'Listening', value: 'listening' },
          { name: 'Watching', value: 'watching' },
          { name: 'Streaming', value: 'streaming' },
          { name: 'Custom Status', value: 'nothing' }
        ))
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Activity text (required for all types)')
        .setRequired(true)
        .setMaxLength(128)),
  
  async execute(interaction) {
    try {
      // Check if user is bot owner
      if (interaction.user.id !== process.env.OWNER_ID) {
        return await interaction.reply({
          content: '❌ Only the bot owner can use this command!',
          ephemeral: true
        });
      }
      
      const activityType = interaction.options.getString('type');
      const activityText = interaction.options.getString('text');
      
      // Validate input - text is now required for all types
      if (!activityText) {
        return await interaction.reply({
          content: '❌ Activity text is required for all activity types!',
          ephemeral: true
        });
      }
      
      try {
        if (activityType === 'nothing') {
          // Set custom status (like regular Discord users)
          await interaction.client.user.setPresence({
            activities: [{
              name: 'Custom Status',
              type: ActivityType.Custom,
              state: activityText
            }],
            status: 'online'
          });
          
          await interaction.reply({
            content: `✅ Bot custom status set to: \`${activityText}\`!`,
            ephemeral: true
          });
        } else {
          // Set activity based on type
          let discordActivityType;
          let activityOptions = {
            name: activityText,
            type: null
          };
          
          switch (activityType) {
            case 'playing':
              discordActivityType = ActivityType.Playing;
              break;
            case 'listening':
              discordActivityType = ActivityType.Listening;
              break;
            case 'watching':
              discordActivityType = ActivityType.Watching;
              break;
            case 'streaming':
              discordActivityType = ActivityType.Streaming;
              // Add fake Twitch URL for streaming
              activityOptions.url = 'https://www.twitch.tv/mikochan';
              break;
            default:
              discordActivityType = ActivityType.Playing;
          }
          
          activityOptions.type = discordActivityType;
          
          await interaction.client.user.setPresence({
            activities: [activityOptions],
            status: 'online'
          });
          
          const activityTypeText = activityType.charAt(0).toUpperCase() + activityType.slice(1);
          await interaction.reply({
            content: `✅ Bot activity set to **${activityTypeText}** \`${activityText}\`!`,
            ephemeral: true
          });
        }
        
      } catch (error) {
        console.error('❌ Error setting activity:', error);
        
        await interaction.reply({
          content: `❌ Failed to set activity. Error: ${error.message}`,
          ephemeral: true
        });
      }
      
    } catch (error) {
      console.error('❌ Error in /activity command:', error);
      
      try {
        await interaction.reply({
          content: '❌ An error occurred while setting the activity. Please try again later.',
          ephemeral: true
        });
      } catch (followUpError) {
        console.error('❌ Error sending error message:', followUpError);
      }
    }
  },
};