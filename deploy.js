const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * This script is optional as command registration is already handled in index.js
 * It can be used to register commands separately if needed
 */

async function deployCommands() {
  try {
    // Load command files
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Load each command's data
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`📝 Loaded command for deployment: ${command.data.name}`);
      } else {
        console.log(`⚠️ The command at ${filePath} is missing a required "data" property.`);
      }
    }
    
    // Check if we have commands to register
    if (commands.length === 0) {
      console.log('❌ No commands found to register.');
      return;
    }
    
    // Create REST instance
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
    
    // Register commands
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    
    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

// Execute the deployment function
deployCommands();