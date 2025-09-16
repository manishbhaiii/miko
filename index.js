const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const AISystem = require('./utils/aiSystem');
require('dotenv').config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Initialize the AI system
const aiSystem = new AISystem();

// Create a collection for commands
client.commands = new Collection();

// Load commands from the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`📝 Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️ The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Register slash commands when the client is ready
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🚀 Ready! Logged in as ${readyClient.user.tag}`);
  
  try {
    console.log('🔄 Started refreshing application (/) commands.');
    
    const commands = [];
    client.commands.forEach(command => {
      commands.push(command.data.toJSON());
    });
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    
    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('❌ Error refreshing application commands:', error);
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) {
      console.error(`❓ No command matching ${interaction.commandName} was found.`);
      return;
    }
    
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error executing ${interaction.commandName}:`, error);
      
      try {
        const errorMessage = { content: 'There was an error while executing this command!', flags: 64 };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply({ ...errorMessage, ephemeral: true });
        }
      } catch (followUpError) {
        console.error('❌ Error sending error response:', followUpError);
      }
    }
  }
  
  // Handle button interactions
  else if (interaction.isButton()) {
    try {
      const serverlistCommand = client.commands.get('serverlist');
      if (serverlistCommand && serverlistCommand.handleButtonInteraction) {
        await serverlistCommand.handleButtonInteraction(interaction);
      }
    } catch (error) {
      console.error('❌ Error handling button interaction:', error);
    }
  }
  
  // Handle modal submissions
  else if (interaction.isModalSubmit()) {
    try {
      const serverlistCommand = client.commands.get('serverlist');
      if (serverlistCommand && serverlistCommand.handleModalSubmit) {
        await serverlistCommand.handleModalSubmit(interaction);
      }
    } catch (error) {
      console.error('❌ Error handling modal submission:', error);
    }
  }
});

/**
 * Checks if the bot is disabled in a specific channel
 * @param {string} channelId - The Discord channel ID
 * @returns {boolean} - True if bot is disabled in this channel
 */
function isBotDisabledInChannel(channelId) {
  try {
    const disableFilePath = path.join(__dirname, 'data', 'disable.json');
    if (!fs.existsSync(disableFilePath)) return false;
    
    const disableData = JSON.parse(fs.readFileSync(disableFilePath, 'utf8'));
    return disableData.disabledChannels && disableData.disabledChannels.includes(channelId);
  } catch (error) {
    console.error('❌ Error checking disabled channels:', error);
    return false;
  }
}

// Handle message creation for AI responses
client.on(Events.MessageCreate, async message => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  // Only respond when the bot is mentioned
  if (!message.mentions.has(client.user.id)) return;
  
  // Check if bot is disabled in this channel
  if (isBotDisabledInChannel(message.channel.id)) return;
  
  try {
    // Extract the message content without the mention
    const content = message.content.replace(`<@${client.user.id}>`, '').trim();
    
    // Check if message has attachments
    const hasAttachments = message.attachments && message.attachments.size > 0;
    
    // If the message is empty after removing the mention AND no attachments, ignore it
    if (!content && !hasAttachments) return;
    
    // For attachment-only messages, use a default prompt
    const finalContent = content || "explain this";
    
    // Get the username
    const username = message.author.username;
    
    // Send typing indicator
    await message.channel.sendTyping();
    
    // Generate a response
    const response = await aiSystem.generateResponse(message.author.id, username, finalContent, message);
    
    // Send the response (handle both text and voice)
    if (response.files && response.files.length > 0) {
      // Response contains voice/files
      await message.reply({
        content: response.content || '',
        files: response.files
      });
    } else {
      // Regular text response
      await message.reply(response.content || response);
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
    await message.reply('miko confused');
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});