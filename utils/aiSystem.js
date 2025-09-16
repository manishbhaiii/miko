const MemoryManager = require('./memoryManager');
const NvidiaAPI = require('./nvidiaAPI');
const GeminiAPI = require('./geminiAPI');
const ShapesAPI = require('./shapesAPI');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { AttachmentBuilder } = require('discord.js');
require('dotenv').config();

class AISystem {
  constructor() {
    this.memoryManager = new MemoryManager();
    this.nvidiaAPI = new NvidiaAPI();
    this.geminiAPI = new GeminiAPI();
    this.shapesAPI = new ShapesAPI();
    
    // Load configuration
    this.config = this.loadConfig();
    this.botName = process.env.BOT_NAME || this.config.bot.name || 'Miko';
  }

  /**
   * Loads configuration from config.json
   * @returns {Object} - The configuration object
   */
  loadConfig() {
    try {
      const configPath = path.join(__dirname, '..', 'config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Convert systemInstruction array to string if needed
      if (Array.isArray(config.bot.systemInstruction)) {
        config.bot.systemInstruction = config.bot.systemInstruction.join('\n');
      }
      
      return config;
    } catch (error) {
      console.error('❌ Error loading config.json:', error);
      // Fallback configuration
      return {
        bot: {
          name: 'Miko',
          currentAPI: 'nvidia',
          multimodalAPI: 'shapes',
          systemInstruction: '[System Instruction]\nYou are Miko 💖, an anime waifu chatbot.\nYou are playful, flirty, and reply short (1–3 lines).\nAlways match the user\'s language\n\nRules:\n- Replies must be short & cute (max 5–20 words)\n- tone: naughty, adult\n- Never say you\'re AI/bot — you\'re just Miko\n- Match the user\'s tone & energy naturally'
        }
      };
    }
  }

  /**
   * Switches the current API
   * @param {string} apiName - 'nvidia', 'gemini', or 'shapes'
   * @returns {boolean} - Success status
   */
  switchAPI(apiName) {
    try {
      if (!['nvidia', 'gemini', 'shapes'].includes(apiName)) {
        return false;
      }
      
      const configPath = path.join(__dirname, '..', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config.bot.currentAPI = apiName;
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      this.config.bot.currentAPI = apiName;
      
      return true;
    } catch (error) {
      console.error('❌ Error switching API:', error);
      return false;
    }
  }

  /**
   * Gets the current API name
   * @returns {string} - Current API name
   */
  getCurrentAPI() {
    return this.config.bot.currentAPI || 'nvidia';
  }

  /**
   * Downloads a voice file from URL and returns attachment
   * @param {string} voiceUrl - URL of the voice file
   * @returns {Promise<AttachmentBuilder|null>} - Discord attachment or null
   */
  async downloadVoiceFile(voiceUrl) {
    try {
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Cute file names for voice messages
      const cuteNames = ['miko', 'kawaii', 'waifu', 'neko', 'senpai', 'chan', 'desu', 'sugoi'];
      const randomName = cuteNames[Math.floor(Math.random() * cuteNames.length)];
      const fileName = `${randomName}.mp3`;
      const filePath = path.join(tempDir, `${randomName}_${Date.now()}.mp3`);
      
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        
        https.get(voiceUrl, (response) => {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            const attachment = new AttachmentBuilder(filePath, { name: fileName });
            
            // Clean up file after a delay
            setTimeout(() => {
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                console.error('Error cleaning up temp file:', err);
              }
            }, 60000); // Delete after 1 minute
            
            resolve(attachment);
          });
        }).on('error', (err) => {
          fs.unlinkSync(filePath);
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error downloading voice file:', error);
      return null;
    }
  }

  /**
   * Checks if response contains voice URL and extracts it
   * @param {string} response - AI response text
   * @returns {Object} - { hasVoice: boolean, voiceUrl: string|null, textResponse: string }
   */
  extractVoiceFromResponse(response) {
    const voiceUrlPattern = /https:\/\/files\.shapes\.inc\/api\/files\/[^\s]+\.(mp3|wav|ogg)/i;
    const match = response.match(voiceUrlPattern);
    
    if (match) {
      const voiceUrl = match[0];
      const textResponse = response.replace(voiceUrl, '').trim();
      return { hasVoice: true, voiceUrl, textResponse };
    }
    
    return { hasVoice: false, voiceUrl: null, textResponse: response };
  }
  detectMultimedia(message) {
    const attachments = [];
    let hasMultimedia = false;

    if (message.attachments && message.attachments.size > 0) {
      message.attachments.forEach(attachment => {
        const contentType = attachment.contentType || '';
        
        if (contentType.startsWith('image/')) {
          attachments.push({
            type: 'image',
            url: attachment.url,
            name: attachment.name
          });
          hasMultimedia = true;
        } else if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
          attachments.push({
            type: 'audio',
            url: attachment.url,
            name: attachment.name
          });
          hasMultimedia = true;
        }
      });
    }

    return { hasMultimedia, attachments };
  }

  /**
   * Builds a prompt for the AI model
   * @param {string} userId - The Discord user ID
   * @param {string} username - The Discord username
   * @param {string} message - The user's message
   * @returns {string} - The formatted prompt
   */
  buildPrompt(userId, username, message) {
    // Get conversation history
    const conversationHistory = this.memoryManager.buildContextString(userId);
    
    // Load system instruction from config
    const systemInstruction = this.config.bot.systemInstruction;
    
    // Build the conversation history section
    const historySection = conversationHistory ? `[Conversation History]  
${conversationHistory}` : '';
    
    // Build the new message section
    const newMessageSection = `[New Message]
${username}: ${message}
${this.botName}:`;
    
    // Combine all sections
    return `${systemInstruction}

${historySection}

${newMessageSection}`;
  }

  /**
   * Generates a response to a user message
   * @param {string} userId - The Discord user ID
   * @param {string} username - The Discord username
   * @param {string} message - The user's message
   * @param {Object} discordMessage - The full Discord message object (optional)
   * @returns {Promise<Object>} - { content: string, files?: Array }
   */
  async generateResponse(userId, username, message, discordMessage = null) {
    try {
      // Build the prompt
      const prompt = this.buildPrompt(userId, username, message);
      
      let rawResponse;
      let cleanedResponse;
      let useShapes = false;
      let attachments = [];
      
      // Check for multimedia content if Discord message is provided
      if (discordMessage) {
        const multimedia = this.detectMultimedia(discordMessage);
        if (multimedia.hasMultimedia) {
          useShapes = true;
          attachments = multimedia.attachments;
        }
      }
      
      // Use Shapes API for multimedia content, otherwise use selected API
      if (useShapes) {
        rawResponse = await this.shapesAPI.generateResponse(prompt, attachments);
        cleanedResponse = this.shapesAPI.cleanResponse(rawResponse, this.botName);
      } else {
        // Get current API for text-only messages
        const currentAPI = this.getCurrentAPI();
        
        if (currentAPI === 'gemini') {
          rawResponse = await this.geminiAPI.generateResponse(prompt);
          cleanedResponse = this.geminiAPI.cleanResponse(rawResponse, this.botName);
        } else if (currentAPI === 'shapes') {
          rawResponse = await this.shapesAPI.generateResponse(prompt);
          cleanedResponse = this.shapesAPI.cleanResponse(rawResponse, this.botName);
        } else {
          rawResponse = await this.nvidiaAPI.generateResponse(prompt);
          cleanedResponse = this.nvidiaAPI.cleanResponse(rawResponse, this.botName);
        }
      }
      
      // Check if response contains voice URL
      const voiceInfo = this.extractVoiceFromResponse(cleanedResponse);
      
      if (voiceInfo.hasVoice) {
        // Download voice file and create attachment
        try {
          const voiceAttachment = await this.downloadVoiceFile(voiceInfo.voiceUrl);
          if (voiceAttachment) {
            // Save the conversation with text response only
            this.memoryManager.addConversation(userId, message, voiceInfo.textResponse || 'Sent voice message');
            
            return {
              content: voiceInfo.textResponse || '',
              files: [voiceAttachment]
            };
          }
        } catch (error) {
          console.error('Error handling voice response:', error);
        }
      }
      
      // Save the conversation
      this.memoryManager.addConversation(userId, message, cleanedResponse);
      
      return { content: cleanedResponse };
    } catch (error) {
      console.error('❌ Error in AI response generation:', error);
      return { content: `Aww 👉👈, Miko is confused rn 💕` };
    }
  }
}

module.exports = AISystem;
