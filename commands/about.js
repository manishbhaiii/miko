const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Change the bot\'s description/bio (Owner only)')
    .addStringOption(option =>
      option.setName('description')
        .setDescription('New description for the bot (max 190 characters)')
        .setRequired(true)
        .setMaxLength(190)),
  
  async execute(interaction) {
    try {
      // Check if user is bot owner
      if (interaction.user.id !== process.env.OWNER_ID) {
        return await interaction.reply({
          content: '❌ Only the bot owner can use this command!',
          ephemeral: true
        });
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      const newDescription = interaction.options.getString('description');
      
      // Validate description length (Discord limit)
      if (newDescription.length > 190) {
        return await interaction.editReply({
          content: '❌ Description is too long! Please keep it under 190 characters.'
        });
      }
      
      try {
        // Update the bot's application description (this shows in the bot's profile)
        await interaction.client.application.edit({
          description: newDescription
        });
        
        await interaction.editReply({
          content: `✅ Bot description has been successfully updated!\n\n**New Description:**\n> ${newDescription}`
        });
        
      } catch (error) {
        console.error('❌ Error setting about section:', error);
        
        if (error.code === 50035) {
          await interaction.editReply({
            content: '❌ Invalid description format. Please try with different text.'
          });
        } else if (error.code === 50013) {
          await interaction.editReply({
            content: '❌ Bot doesn\'t have permission to change its description. Please check bot permissions.'
          });
        } else if (error.code === 50001) {
          await interaction.editReply({
            content: '❌ Missing access to modify bot application. This feature might not be available for this bot type.'
          });
        } else {
          await interaction.editReply({
            content: `❌ Failed to update description. Error: ${error.message}\n\n*Note: This feature may not be available for all bot types.*`
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error in /about command:', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ An error occurred while updating the bot description. Please try again later.'
          });
        } else {
          await interaction.reply({
            content: '❌ An error occurred while updating the bot description. Please try again later.',
            ephemeral: true
          });
        }
      } catch (followUpError) {
        console.error('❌ Error sending error message:', followUpError);
      }
    }
  },
};