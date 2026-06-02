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

    console.log(`Creating bot for ${options.username} at ${options.host}:${options.port}...`);
    this.io.to(socketId).emit('status', { state: 'Connecting to Minecraft...' });
    let bot: mineflayer.Bot;
    try {
      bot = mineflayer.createBot({
        host: options.host,
        port: options.port,
        username: options.username,
        version: (options.version === 'Auto' || !options.version) ? undefined : options.version,
        auth: options.auth || 'offline',
        hideErrors: false
      });
    } catch (err: any) {
      console.error(`Failed to initiate bot creation: ${err.message}`);
      this.io.to(socketId).emit('error', `Failed to start: ${err.message}`);
      return;
    }

    console.log(`Bot instance created for ${options.username}. Waiting for events...`);

    const connectionTimeout = setTimeout(() => {
      if (!this.bots.has(socketId)) return;
      const currentBot = this.bots.get(socketId);
      if (currentBot && !currentBot.entity) { // If entity is not set, likely not fully logged in/spawned
        console.error(`Connection timeout for ${options.username}`);
        this.io.to(socketId).emit('error', 'Connection timed out (30s)');
        currentBot.quit();
        this.bots.delete(socketId);
      }
    }, 30000);

    this.bots.set(socketId, bot);
    
    try {
      bot.loadPlugin(autoEat);
      console.log('Auto-eat plugin loaded');
    } catch (e) {
      console.error('Failed to load auto-eat plugin:', e);
    }

    bot.on('inject_allowed', () => {
      console.log('Bot inject_allowed');
    });

    bot.on('login', () => {
      clearTimeout(connectionTimeout);
      console.log(`Bot ${bot.username} logged in`);
      this.io.to(socketId).emit('status', { state: 'loggedIn', username: bot.username });
    });

    bot.on('spawn', () => {
      console.log(`Bot ${bot.username} spawned`);
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

    bot.on('error', (err: any) => {
      console.error(`Bot error: ${err.message}`);
      if (err.code) console.error(`Error code: ${err.code}`);
      this.io.to(socketId).emit('error', err.message);
    });

    bot.on('kicked', (reason) => {
      console.log(`Bot kicked: ${reason}`);
      this.io.to(socketId).emit('kicked', reason);
    });

    bot.on('end', (reason) => {
      console.log(`Bot connection ended. Reason: ${reason}`);
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
