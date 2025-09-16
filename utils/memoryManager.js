const fs = require('fs');
const path = require('path');

class MemoryManager {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.memoryFile = path.join(this.dataDir, 'memory.json');
    this.ensureDataDirectoryExists();
    this.initializeMemoryFile();
  }

  /**
   * Ensures the data directory exists
   */
  ensureDataDirectoryExists() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log('📁 Data directory created successfully');
      }
    } catch (error) {
      console.error('❌ Error creating data directory:', error);
    }
  }

  /**
   * Initializes the memory file if it doesn't exist
   */
  initializeMemoryFile() {
    try {
      if (!fs.existsSync(this.memoryFile)) {
        fs.writeFileSync(this.memoryFile, JSON.stringify({}, null, 2));
        console.log('📄 Memory file created successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing memory file:', error);
    }
  }

  /**
   * Gets the conversation history for a specific user
   * @param {string} userId - The Discord user ID
   * @returns {Array} - Array of conversation strings
   */
  getUserHistory(userId) {
    try {
      const memoryData = this.readMemoryFile();
      return memoryData[userId] || [];
    } catch (error) {
      console.error(`❌ Error getting history for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Adds a new conversation to the user's history
   * @param {string} userId - The Discord user ID
   * @param {string} userMessage - The message from the user
   * @param {string} botReply - The bot's reply
   */
  addConversation(userId, userMessage, botReply) {
    try {
      const memoryData = this.readMemoryFile();
      
      // Initialize user array if it doesn't exist
      if (!memoryData[userId]) {
        memoryData[userId] = [];
      }
      
      // Format the conversation string
      const conversationString = `user: ${userMessage} | bot: ${botReply}`;
      
      // Add the new conversation
      memoryData[userId].push(conversationString);
      
      // Keep only the last 10 conversations
      if (memoryData[userId].length > 10) {
        memoryData[userId].shift(); // Remove the oldest conversation
      }
      
      // Save the updated memory data
      this.writeMemoryFile(memoryData);
      console.log(`💾 Saved conversation for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error adding conversation for user ${userId}:`, error);
    }
  }

  /**
   * Builds a context string from the user's conversation history
   * @param {string} userId - The Discord user ID
   * @returns {string} - Formatted conversation history string
   */
  buildContextString(userId) {
    const history = this.getUserHistory(userId);
    if (history.length === 0) return '';
    
    return history.join('\n');
  }

  /**
   * Clears the conversation history for a specific user
   * @param {string} userId - The Discord user ID
   * @returns {boolean} - Success status
   */
  clearUserHistory(userId) {
    try {
      const memoryData = this.readMemoryFile();
      
      // Check if the user exists in memory
      if (memoryData[userId]) {
        // Delete the user's history
        delete memoryData[userId];
        
        // Save the updated memory data
        this.writeMemoryFile(memoryData);
        console.log(`🧹 Cleared history for user ${userId}`);
        return true;
      }
      
      return false; // User not found
    } catch (error) {
      console.error(`❌ Error clearing history for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Reads the memory file
   * @returns {Object} - The memory data
   */
  readMemoryFile() {
    try {
      const data = fs.readFileSync(this.memoryFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error reading memory file:', error);
      return {};
    }
  }

  /**
   * Writes data to the memory file
   * @param {Object} data - The memory data to write
   */
  writeMemoryFile(data) {
    try {
      fs.writeFileSync(this.memoryFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error writing to memory file:', error);
    }
  }
}

module.exports = MemoryManager;