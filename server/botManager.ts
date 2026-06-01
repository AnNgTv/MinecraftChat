import mineflayer from 'mineflayer';
import { Server } from 'socket.io';
import { loader as autoEat } from 'mineflayer-auto-eat';

interface BotOptions {
  host: string;
  port: number;
  username: string;
  version?: string;
  auth?: 'microsoft' | 'offline';
}

export class BotManager {
  private bots: Map<string, mineflayer.Bot> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  createBot(socketId: string, options: BotOptions) {
    if (this.bots.has(socketId)) {
      this.bots.get(socketId)?.quit();
      this.bots.delete(socketId);
    }

    const bot = mineflayer.createBot({
      host: options.host,
      port: options.port,
      username: options.username,
      version: options.version,
      auth: options.auth || 'offline',
      hideErrors: true
    });

    this.bots.set(socketId, bot);
    bot.loadPlugin(autoEat);

    bot.on('login', () => {
      this.io.to(socketId).emit('status', { state: 'loggedIn', username: bot.username });
    });

    bot.on('spawn', () => {
      this.io.to(socketId).emit('status', { state: 'spawned' });
      this.sendInitialState(socketId, bot);
    });

    bot.on('message', (jsonMsg) => {
      this.io.to(socketId).emit('chat', { message: jsonMsg.toAnsi(), json: jsonMsg });
    });

    bot.on('health', () => {
      this.io.to(socketId).emit('health', {
        health: bot.health,
        food: bot.food,
        xp: bot.experience.level
      });
    });

    bot.on('move', () => {
      this.io.to(socketId).emit('pos', {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z)
      });
    });

    bot.on('playerJoined', (player) => {
      this.io.to(socketId).emit('playerJoined', player.username);
    });

    bot.on('playerLeft', (player) => {
      this.io.to(socketId).emit('playerLeft', player.username);
    });

    bot.on('error', (err) => {
      this.io.to(socketId).emit('error', err.message);
    });

    bot.on('kicked', (reason) => {
      this.io.to(socketId).emit('kicked', reason);
    });

    bot.on('end', () => {
      this.io.to(socketId).emit('status', { state: 'disconnected' });
      this.bots.delete(socketId);
    });
  }

  toggleAntiAFK(socketId: string, enabled: boolean) {
    const bot = this.bots.get(socketId);
    if (!bot) return;

    if (enabled) {
      const interval = setInterval(() => {
        if (this.bots.has(socketId)) {
          bot.setControlState('jump', true);
          setTimeout(() => bot.setControlState('jump', false), 500);
        } else {
          clearInterval(interval);
        }
      }, 10000);
      (bot as any).antiAfkInterval = interval;
    } else {
      if ((bot as any).antiAfkInterval) {
        clearInterval((bot as any).antiAfkInterval);
      }
    }
  }

  toggleAutoEat(socketId: string, enabled: boolean) {
    const bot = this.bots.get(socketId);
    if (!bot) return;
    if (enabled) {
      (bot as any).autoEat.enable();
    } else {
      (bot as any).autoEat.disable();
    }
  }

  private sendInitialState(socketId: string, bot: mineflayer.Bot) {
    this.io.to(socketId).emit('players', Object.keys(bot.players));
    this.io.to(socketId).emit('health', {
      health: bot.health,
      food: bot.food,
      xp: bot.experience.level
    });
    this.io.to(socketId).emit('pos', {
      x: Math.floor(bot.entity.position.x),
      y: Math.floor(bot.entity.position.y),
      z: Math.floor(bot.entity.position.z)
    });
    this.sendInventory(socketId, bot);
  }

  private sendInventory(socketId: string, bot: mineflayer.Bot) {
    const items = bot.inventory.items().map(item => ({
      name: item.name,
      count: item.count,
      slot: item.slot
    }));
    this.io.to(socketId).emit('inventory', items);
  }

  sendChat(socketId: string, message: string) {
    const bot = this.bots.get(socketId);
    if (bot) {
      bot.chat(message);
    }
  }

  removeBot(socketId: string) {
    const bot = this.bots.get(socketId);
    if (bot) {
      bot.quit();
      this.bots.delete(socketId);
    }
  }
}
