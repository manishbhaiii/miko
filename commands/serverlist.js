const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverlist')
    .setDescription('View all servers the bot is in and manage them (Owner only)'),
  
  async execute(interaction) {
    try {
      // Check if user is bot owner
      if (interaction.user.id !== process.env.OWNER_ID) {
        return await interaction.reply({
          content: '❌ Only the bot owner can use this command!',
          ephemeral: true
        });
      }
      
      const client = interaction.client;
      const guilds = client.guilds.cache;
      
      if (guilds.size === 0) {
        return await interaction.reply({
          content: '📭 The bot is not in any servers.',
          ephemeral: true
        });
      }
      
      // Create server list with numbering
      let serverList = '';
      let serverCount = 0;
      
      guilds.forEach((guild, index) => {
        serverCount++;
        const memberCount = guild.memberCount || 'Unknown';
        serverList += `**${serverCount}.** ${guild.name}\n`;
        serverList += `   \`${guild.id}\` • ${memberCount} members\n\n`;
      });
      
      // Truncate if too long for embed
      if (serverList.length > 4000) {
        serverList = serverList.substring(0, 3900) + '\n\n*... and more servers*';
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🏰 Server List')
        .setDescription(`Bot is currently in **${guilds.size}** server${guilds.size !== 1 ? 's' : ''}:\n\n${serverList}`)
        .setColor(0xFF69B4)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ 
          text: 'Use the button below to leave a server', 
          iconURL: client.user.displayAvatarURL({ dynamic: true }) 
        });
      
      const leaveButton = new ButtonBuilder()
        .setCustomId('leave_server')
        .setLabel('🚪 Leave Server')
        .setStyle(ButtonStyle.Danger);
      
      const row = new ActionRowBuilder().addComponents(leaveButton);
      
      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
      
    } catch (error) {
      console.error('❌ Error in /serverlist command:', error);
      await interaction.reply({
        content: '❌ An error occurred while fetching server list.',
        ephemeral: true
      });
    }
  },
  
  // Handle button interactions
  async handleButtonInteraction(interaction) {
    if (interaction.customId === 'leave_server') {
      // Check if user is bot owner
      if (interaction.user.id !== process.env.OWNER_ID) {
        return await interaction.reply({
          content: '❌ Only the bot owner can use this button!',
          ephemeral: true
        });
      }
      
      // Create modal for server number input
      const modal = new ModalBuilder()
        .setCustomId('leave_server_modal')
        .setTitle('Leave Server');
      
      const serverNumberInput = new TextInputBuilder()
        .setCustomId('server_number')
        .setLabel('Enter the server number to leave:')
        .setPlaceholder('e.g., 1, 2, 3...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(3);
      
      const row = new ActionRowBuilder().addComponents(serverNumberInput);
      modal.addComponents(row);
      
      await interaction.showModal(modal);
    }
  },
  
  // Handle modal submissions
  async handleModalSubmit(interaction) {
    if (interaction.customId === 'leave_server_modal') {
      try {
        const serverNumber = parseInt(interaction.fields.getTextInputValue('server_number'));
        
        if (isNaN(serverNumber) || serverNumber < 1) {
          return await interaction.reply({
            content: '❌ Please enter a valid server number!',
            ephemeral: true
          });
        }
        
        const client = interaction.client;
        const guilds = Array.from(client.guilds.cache.values());
        
        if (serverNumber > guilds.length) {
          return await interaction.reply({
            content: `❌ Invalid server number! Bot is only in ${guilds.length} server${guilds.length !== 1 ? 's' : ''}.`,
            ephemeral: true
          });
        }
        
        const targetGuild = guilds[serverNumber - 1];
        const guildName = targetGuild.name;
        const guildId = targetGuild.id;
        
        try {
          await targetGuild.leave();
          
          await interaction.reply({
            content: `✅ Successfully left server **${guildName}** (\`${guildId}\`)`,
            ephemeral: true
          });
        } catch (error) {
          console.error('❌ Error leaving server:', error);
          await interaction.reply({
            content: `❌ Failed to leave server **${guildName}**. Error: ${error.message}`,
            ephemeral: true
          });
        }
        
      } catch (error) {
        console.error('❌ Error in leave server modal:', error);
        await interaction.reply({
          content: '❌ An error occurred while processing your request.',
          ephemeral: true
        });
      }
    }
  }
};