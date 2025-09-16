const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Change the bot\'s avatar (Owner only)')
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Upload a new avatar image (PNG, JPG, GIF)')
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
      
      // Validate file size (Discord limit is 8MB for avatars, but we'll be more conservative)
      if (attachment.size > 8 * 1024 * 1024) {
        return await interaction.editReply({
          content: '❌ Image file is too large! Please upload an image smaller than 8MB.'
        });
      }
      
      try {
        // Set the new avatar
        await interaction.client.user.setAvatar(attachment.url);
        
        await interaction.editReply({
          content: `✅ Bot avatar has been successfully updated!\n\n**New Avatar:** [View Image](${attachment.url})`,
          files: [attachment.url]
        });
        
      } catch (error) {
        console.error('❌ Error setting avatar:', error);
        
        if (error.code === 50035) {
          await interaction.editReply({
            content: '❌ Invalid image format or the image is corrupted. Please try with a different image.'
          });
        } else if (error.code === 50013) {
          await interaction.editReply({
            content: '❌ Bot doesn\'t have permission to change its avatar. Please check bot permissions.'
          });
        } else {
          await interaction.editReply({
            content: `❌ Failed to update avatar. Error: ${error.message}`
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error in /avatar command:', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ An error occurred while updating the avatar. Please try again later.'
          });
        } else {
          await interaction.reply({
            content: '❌ An error occurred while updating the avatar. Please try again later.',
            ephemeral: true
          });
        }
      } catch (followUpError) {
        console.error('❌ Error sending error message:', followUpError);
      }
    }
  },
};