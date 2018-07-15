const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disable')
    .setDescription('Disable bot responses in this channel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      // Check if user has administrator permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: '❌ You need Administrator permissions to use this command!!',
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
      
      // Check if channel is already disabled
      if (disableData.disabledChannels.includes(channelId)) {
        return await interaction.reply({
          content: '⚠️ Bot responses are already disabled in this channel!',
          ephemeral: true
        });
      }
      
      // Add channel to disabled list
      disableData.disabledChannels.push(channelId);
      
      // Save to file
      try {
        fs.writeFileSync(disableFilePath, JSON.stringify(disableData, null, 2));
      } catch (error) {
        console.error('❌ Error writing to disable.json:', error);
        return await interaction.reply({
          content: '❌ Failed to disable bot in this channel. Please try again.',
          ephemeral: true
        });
      }
      
      await interaction.reply({
        content: `🔇 Bot responses have been **disabled** in this channel!\n\nMiko will no longer respond to mentions here until re-enabled by an admin.`,
        ephemeral: false
      });
      
    } catch (error) {
      console.error('❌ Error in /disable command:', error);
      await interaction.reply({
        content: '❌ An error occurred while disabling the bot. Please try again.',
        ephemeral: true
      });
    }
  },
};