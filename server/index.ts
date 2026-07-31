import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mineflayer from 'mineflayer'; // Thư viện điều khiển bot Minecraft phổ biến

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    console.log('Client đã kết nối thành công tới Server trung gian.');
    let bot: any = null;

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message);

            // Xử lý yêu cầu kết nối vào server Minecraft từ App
            if (data.action === 'connect') {
                const { serverIp, port, username } = data;

                ws.send(JSON.stringify({ type: 'status', message: `Đang kết nối tới ${serverIp}:${port || 25565}...` }));

                // Khởi tạo Mineflayer bot
                bot = mineflayer.createBot({
                    host: serverIp,
                    port: port ? parseInt(port) : 25565,
                    username: username || 'MineChatBot'
                });

                bot.on('spawn', () => {
                    ws.send(JSON.stringify({ type: 'chat', message: '§aĐã vào game thành công!' }));
                });

                bot.on('chat', (username: string, message: string) => {
                    ws.send(JSON.stringify({ type: 'chat', message: `<${username}> ${message}` }));
                });

                bot.on('end', (reason: string) => {
                    ws.send(JSON.stringify({ type: 'status', message: `Đã ngắt kết nối: ${reason}` }));
                });

                bot.on('error', (err: Error) => {
                    ws.send(JSON.stringify({ type: 'error', message: `Lỗi bot: ${err.message}` }));
                });
            } 
            // Xử lý gửi tin nhắn chat từ App vào game
            else if (data.action === 'chat' && bot) {
                bot.chat(data.text);
            }
        } catch (e) {
            console.error('Lỗi phân tích cú pháp tin nhắn:', e);
        }
    });

    ws.on('close', () => {
        if (bot) {
            bot.quit();
        }
        console.log('Client Android đã ngắt kết nối.');
    });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`MineChat Server đang chạy tại cổng ${PORT}`);
});
