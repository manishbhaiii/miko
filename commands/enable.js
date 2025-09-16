const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enable')
    .setDescription('Re-enable bot responses in this channel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      // Check if user has administrator permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: '❌ You need Administrator permissions to use this command!',
          ephemeral: true
        });
      }
      
      const channelId = interaction.channel.id;
      const disableFilePath = path.join(process.cwd(), 'data', 'disable.json');
      
      // Read current disabled channels
      let disableData = { disabledChannels: [] };
      try {
        if (fs.existsSync(disableFilePath)) {
          const fileContent = fs.readFileSync(disableFilePath, 'utf8');
          disableData = JSON.parse(fileContent);
        }
      } catch (error) {
        console.error('❌ Error reading disable.json:', error);
      }
      
      // Check if channel is in disabled list
      const channelIndex = disableData.disabledChannels.indexOf(channelId);
      if (channelIndex === -1) {
        return await interaction.reply({
          content: '⚠️ Bot responses are already enabled in this channel!',
          ephemeral: true
        });
      }
      
      // Remove channel from disabled list
      disableData.disabledChannels.splice(channelIndex, 1);
      
      // Save to file
      try {
        fs.writeFileSync(disableFilePath, JSON.stringify(disableData, null, 2));
      } catch (error) {
        console.error('❌ Error writing to disable.json:', error);
        return await interaction.reply({
          content: '❌ Failed to enable bot in this channel. Please try again.',
          ephemeral: true
        });
      }
      
      await interaction.reply({
        content: `🔊 Bot responses have been **enabled** in this channel!\n\nMiko will now respond to mentions here again! <:hehe:1416678374151291015>`,
        ephemeral: false
      });
      
    } catch (error) {
      console.error('❌ Error in /enable command:', error);
      await interaction.reply({
        content: '❌ An error occurred while enabling the bot. Please try again.',
        ephemeral: true
      });
    }
  },
};