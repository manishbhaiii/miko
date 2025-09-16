const OpenAI = require('openai');
require('dotenv').config();

class NvidiaAPI {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  /**
   * Generates a response using the NVIDIA API
   * @param {string} prompt - The prompt to send to the API
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "deepseek-ai/deepseek-v3.1",
        messages: [{"role":"user","content": prompt}],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
        stream: false
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error generating response from NVIDIA API:', error);
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

module.exports = NvidiaAPI;