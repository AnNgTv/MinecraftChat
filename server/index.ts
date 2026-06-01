import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { BotManager } from './botManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const botManager = new BotManager(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('login', (data) => {
    const { host, port, username, version, auth } = data;
    botManager.createBot(socket.id, { host, port, username, version, auth });
  });

  socket.on('chat', (message) => {
    botManager.sendChat(socket.id, message);
  });

  socket.on('antiAfk', (enabled) => {
    botManager.toggleAntiAFK(socket.id, enabled);
  });

  socket.on('autoEat', (enabled) => {
    botManager.toggleAutoEat(socket.id, enabled);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    botManager.removeBot(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
