const { SlashCommandBuilder } = require('discord.js');
const AISystem = require('../utils/aiSystem');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('api')
    .setDescription('Switch between AI APIs (Owner only)')
    .addStringOption(option =>
      option.setName('provider')
        .setDescription('Choose AI provider')
        .setRequired(true)
        .addChoices(
          { name: 'NVIDIA', value: 'nvidia' },
          { name: 'Gemini', value: 'gemini' },
          { name: 'Shapes', value: 'shapes' }
        )),
  
  async execute(interaction) {
    try {
      // Defer the reply immediately to prevent timeout
      await interaction.deferReply({ ephemeral: true });
      
      // Check if user is bot owner only
      const isOwner = interaction.user.id === process.env.OWNER_ID;
      
      if (!isOwner) {
        return await interaction.editReply({
          content: '❌ Only the bot owner can use this command!'
        });
      }
      
      const provider = interaction.options.getString('provider');
      const aiSystem = new AISystem();
      
      // Get current API
      const currentAPI = aiSystem.getCurrentAPI();
      
      if (currentAPI === provider) {
        return await interaction.editReply({
          content: `⚡ **${provider.toUpperCase()}** API is already active!`
        });
      }
      
      // Switch API
      const success = aiSystem.switchAPI(provider);
      
      if (success) {
        await interaction.editReply({
          content: `✅ Successfully switched to **${provider.toUpperCase()}** API!\n🔄 All future responses will use ${provider.toUpperCase()}.`
        });
      } else {
        await interaction.editReply({
          content: '❌ Failed to switch API. Please try again.'
        });
      }
    } catch (error) {
      console.error('❌ Error in /api command:', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ An error occurred while switching APIs. Please try again later.'
          });
        } else {
          await interaction.reply({
            content: '❌ An error occurred while switching APIs. Please try again later.',
            ephemeral: true
          });
        }
      } catch (followUpError) {
        console.error('❌ Error sending error message:', followUpError);
      }
    }
  },
};