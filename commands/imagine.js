const { SlashCommandBuilder } = require('discord.js');
const ShapesAPI = require('../utils/shapesAPI');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imagine')
    .setDescription('Generate an image using Shapes AI')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Describe the image you want to generate')
        .setRequired(true)),
  
  async execute(interaction) {
    try {
      // Defer the reply immediately to prevent timeout (ephemeral)
      await interaction.deferReply({ ephemeral: true });
      
      const prompt = interaction.options.getString('prompt');
      const shapesAPI = new ShapesAPI();
      
      // Use Shapes !imagine command
      const imagePrompt = `!imagine ${prompt}`;
      
      // Generate image using Shapes API
      const response = await shapesAPI.generateResponse(imagePrompt);
      
      // Check if response contains an image URL
      const imageUrlPattern = /https:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i;
      const match = response.match(imageUrlPattern);
      
      if (match) {
        const imageUrl = match[0];
        const textResponse = response.replace(imageUrl, '').trim();
        
        await interaction.editReply({
          content: textResponse || `🎨 Here's your generated image for: "${prompt}"`,
          files: [imageUrl]
        });
      } else {
        // If no image URL found, send the text response
        await interaction.editReply({
          content: response || '❌ Failed to generate image. Please try again with a different prompt.'
        });
      }
    } catch (error) {
      console.error('❌ Error in /imagine command:', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: '❌ An error occurred while generating the image. Please try again later.'
          });
        } else {
          await interaction.reply({
            content: '❌ An error occurred while generating the image. Please try again later.',
            ephemeral: true
          });
        }
      } catch (followUpError) {
        console.error('❌ Error sending error message:', followUpError);
      }
    }
  },
};