const { SlashCommandBuilder } = require('discord.js');
const MemoryManager = require('../utils/memoryManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearmemory')
    .setDescription('Clears your conversation history with the bot'),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const memoryManager = new MemoryManager();
    
    // Attempt to clear the user's history
    const success = memoryManager.clearUserHistory(userId);
    
    if (success) {
      await interaction.reply({
        content: '🧹 Your conversation history has been cleared successfully!!',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'You don\'t have any conversation history to clear.',
        ephemeral: true
      });
    }
  },
};