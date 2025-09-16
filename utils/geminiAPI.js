const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiAPI {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  }

  /**
   * Generates a response using the Gemini API
   * @param {string} prompt - The prompt to send to the API
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Error generating response from Gemini API:', error);
      throw new Error('Failed to generate response from AI');
    }
  }

  /**
   * Cleans the response by removing the bot name prefix if present
   * @param {string} response - The raw response from the API
   * @param {string} botName - The bot's name
   * @returns {string} - The cleaned response
   */
  cleanResponse(response, botName) {
    // Check if the response starts with the bot name
    const botNamePrefix = `${botName}:`;
    if (response.startsWith(botNamePrefix)) {
      return response.substring(botNamePrefix.length).trim();
    }
    return response.trim();
  }
}

module.exports = GeminiAPI;