
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('login', {
    host: 'localhost',
    port: 25565, // This will likely fail if no local MC server
    username: 'TestBot',
    version: '1.20.1',
    auth: 'offline'
  });
});

socket.on('status', (data) => {
  console.log('Status update:', data);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(0);
}, 10000);
