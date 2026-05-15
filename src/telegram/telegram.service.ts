import { Injectable } from '@nestjs/common';
import TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private chatId: string | undefined;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (token) {
      this.bot = new TelegramBot(token, { polling: false });
    }
  }

  async sendMessage(message: string) {
    if (!this.bot || !this.chatId) {
      console.warn('Telegram Bot not configured. Skipping message.');
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
  }
}
