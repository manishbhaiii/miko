const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Change the bot\'s banner (Owner only)')
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Upload a new banner image (PNG, JPG, GIF)')
        .setRequired(true)),
  
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
      
      const attachment = interaction.options.getAttachment('image');
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(attachment.contentType)) {
        return await interaction.editReply({
          content: '❌ Please upload a valid image file (PNG, JPG, or GIF)!'
        });
      }
      
      // Validate file size (Discord limit for banners)
      if (attachment.size > 8 * 1024 * 1024) {
        return await interaction.editReply({
          content: '❌ Image file is too large! Please upload an image smaller than 8MB.'
        });
      }
      
      try {
        // Set the new banner
        await interaction.client.user.setBanner(attachment.url);
        
        await interaction.editReply({
          content: `✅ Bot banner has been successfully updated!\n\n**New Banner:** [View Image](${attachment.url})`,
          files: [attachment.url]
        });
        
      } catch (error) {
        console.error('❌ Error setting banner:', error);
        
        if (error.code === 50035) {
          await interaction.editReply({
            content: '❌ Invalid image format or the image is corrupted. Please try with a different image.'
          });
        } else if (error.code === 50013) {
          await interaction.editReply({
            content: '❌ Bot doesn\'t have permission to change its banner. Please check bot permissions.'
          });
        } else if (error.code === 50001) {
          await interaction.editReply({
            content: '❌ Missing access to set banner. This might require a premium bot or specific permissions.'
          });
        } else {
          await interaction.editReply({
            content: `❌ Failed to update banner. Error: ${error.message}`
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error in /banner command:', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ An error occurred while updating the banner. Please try again later.'
          });
        } else {
          await interaction.reply({
            content: '❌ An error occurred while updating the banner. Please try again later.',
            ephemeral: true
          });
        }
      } catch (followUpError) {
        console.error('❌ Error sending error message:', followUpError);
      }
    }
  },
};