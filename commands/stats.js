const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const AISystem = require('../utils/aiSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows detailed bot statistics including API status, server info, and system data'),
  
  async execute(interaction) {
    const client = interaction.client;
    
    // Calculate ping information
    const sent = await interaction.reply({ content: 'Calculating stats...', fetchReply: true });
    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = client.ws.ping;
    
    // Get server count
    const serverCount = client.guilds.cache.size;
    
    // Get total user count across all servers
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    
    // Get memory users count
    let memoryUsersCount = 0;
    let totalConversations = 0;
    try {
      const memoryFilePath = path.join(process.cwd(), 'data', 'memory.json');
      if (fs.existsSync(memoryFilePath)) {
        const memoryData = JSON.parse(fs.readFileSync(memoryFilePath, 'utf8'));
        memoryUsersCount = Object.keys(memoryData).length;
        
        // Count total conversations
        totalConversations = Object.values(memoryData).reduce((acc, userConvos) => {
          return acc + (userConvos.length || 0);
        }, 0);
      }
    } catch (error) {
      // Removed console logging per user preference for clean output
    }
    
    // Get current API information
    let currentAPI = 'Unknown';
    try {
      const aiSystem = new AISystem();
      currentAPI = aiSystem.getCurrentAPI().toUpperCase();
    } catch (error) {
      // Removed console logging per user preference for clean output
    }
    
    // Calculate uptime
    const uptime = formatUptime(client.uptime);
    
    // Get Node.js version and memory usage
    const nodeVersion = process.version;
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    
    // Create clean and simple embed with line-by-line details
    const statsEmbed = new EmbedBuilder()
      .setTitle('📊 Statistics')
      .setColor(0xFF69B4)
      .setImage('https://images-ext-1.discordapp.net/external/5jEsWnvSTBJ1nMNViBYJZm_n0PhpozrJ1TTtB7sS0Ng/%3Ftoken%3DeyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTY2IiwicGF0aCI6IlwvZlwvMjUyN2FjYjgtNDMxMC00MDQ2LTg5YTEtNTlhNDZhYjQ5YThlXC9kZmZ6djFoLTJkZGEzMDZmLTNmNjEtNGM0NC1hZDgxLTZlMDBmMTg5MjAxMS5qcGciLCJ3aWR0aCI6Ijw9MTAyNCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.Boa769i9kmRZaJ0mkH-Alt0v6EeRsF5PHMrRKj9-wGc/https/images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/2527acb8-4310-4046-89a1-59a46ab49a8e/dffzv1h-2dda306f-3f61-4c44-ad81-6e00f1892011.jpg/v1/fill/w_1024%2Ch_166%2Cq_75%2Cstrp/shiina_mahiru_banner_by_s6ugo_dffzv1h-fullview.jpg')
      .setDescription([
        `🏓 **Ping:** ${botLatency}ms`,
        `🌐 **API Latency:** ${apiPing}ms`,
        `⏰ **Uptime:** ${uptime}`,
        `🏰 **Servers:** ${serverCount}`,
        `👥 **Total Users:** ${totalUsers.toLocaleString()}`,
        `🧠 **Memory Users:** ${memoryUsersCount}`,
        `💬 **Conversations:** ${totalConversations.toLocaleString()}`,
        `🤖 **Current API:** ${currentAPI}`,
        `💾 **Memory Usage:** ${memoryUsage}MB`,
        `⚙️ **Node.js:** ${nodeVersion}`
      ].join('\n'))
      .setTimestamp()
      .setFooter({ 
        text: 'always here for you! 💕', 
        iconURL: client.user.displayAvatarURL({ dynamic: true }) 
      });
    
    // Edit the reply with the stats embed (visible to everyone)
    await interaction.editReply({
      content: '',
      embeds: [statsEmbed]
    });
  },
};

/**
 * Formats the uptime in a readable format
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} - Formatted uptime string
 */
function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}