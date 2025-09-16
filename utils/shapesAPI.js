const { OpenAI } = require('openai');
require('dotenv').config();

class ShapesAPI {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.SHAPES_API_KEY,
      baseURL: 'https://api.shapes.inc/v1',
    });
    this.shapeUsername = process.env.SHAPES_USERNAME || 'miko'; // Default shape
  }

  /**
   * Generates a response using the Shapes API
   * @param {string} prompt - The prompt to send to the API
   * @param {Array} attachments - Array of attachments (images, audio, etc.)
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(prompt, attachments = []) {
    try {
      const messages = [];
      
      if (attachments.length > 0) {
        // Handle multimodal content
        const content = [{ type: 'text', text: prompt }];
        
        attachments.forEach(attachment => {
          if (attachment.type === 'image') {
            content.push({
              type: 'image_url',
              image_url: { url: attachment.url }
            });
          } else if (attachment.type === 'audio') {
            content.push({
              type: 'audio_url',
              audio_url: { url: attachment.url }
            });
          }
        });
        
        messages.push({
          role: 'user',
          content: content
        });
      } else {
        // Text-only message
        messages.push({
          role: 'user',
          content: prompt
        });
      }

      const completion = await this.client.chat.completions.create({
        model: `shapesinc/${this.shapeUsername}`,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error generating response from Shapes API:', error);
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

module.exports = ShapesAPI;