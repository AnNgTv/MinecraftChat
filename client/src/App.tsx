import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Users, Shield, Zap, LogOut, Package, Compass, Coffee } from 'lucide-react';

interface ChatMessage {
  message: string;
  json?: any;
}

interface PlayerStats {
  health: number;
  food: number;
  xp: number;
}

interface Position {
  x: number;
  y: number;
  z: number;
}

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [loginData, setLoginData] = useState({
    host: 'localhost',
    port: 25565,
    username: 'MinecraftChatBot',
    version: '1.20.1',
    auth: 'offline'
  });

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [stats, setStats] = useState<PlayerStats>({ health: 20, food: 20, xp: 0 });
  const [pos, setPos] = useState<Position>({ x: 0, y: 0, z: 0 });
  const [inventory, setInventory] = useState<any[]>([]);
  const [antiAfk, setAntiAfk] = useState(false);
  const [autoEat, setAutoEat] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'players' | 'inventory'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('status', (data) => {
      setStatus(data.state);
      if (data.state === 'spawned') setConnected(true);
    });

    newSocket.on('chat', (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    newSocket.on('health', (data) => {
      setStats(data);
    });

    newSocket.on('pos', (data) => {
      setPos(data);
    });

    newSocket.on('players', (data) => {
      setPlayers(data);
    });

    newSocket.on('inventory', (data) => {
      setInventory(data);
    });

    newSocket.on('error', (err) => {
      alert('Error: ' + err);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    socket?.emit('login', loginData);
    setStatus('Connecting...');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      socket?.emit('chat', input);
      setInput('');
    }
  };

  const toggleAntiAfk = () => {
    const newState = !antiAfk;
    setAntiAfk(newState);
    socket?.emit('antiAfk', newState);
  };

  const toggleAutoEat = () => {
    const newState = !autoEat;
    setAutoEat(newState);
    socket?.emit('autoEat', newState);
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-minecraft-dark p-4">
        <h1 className="text-4xl font-bold mb-8 text-minecraft-green drop-shadow-md">MINECRAFT CHAT</h1>
        <form onSubmit={handleLogin} className="w-full max-w-md space-y-4 bg-minecraft-gray p-6 border-4 border-black shadow-[inset_-4px_-4px_#1e1e1e,inset_4px_4px_#555555]">
          <div>
            <label className="block text-sm mb-1">Server IP</label>
            <input 
              type="text" 
              className="w-full mc-input" 
              value={loginData.host}
              onChange={(e) => setLoginData({...loginData, host: e.target.value})}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Port</label>
              <input 
                type="number" 
                className="w-full mc-input" 
                value={loginData.port}
                onChange={(e) => setLoginData({...loginData, port: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Version</label>
              <input 
                type="text" 
                className="w-full mc-input" 
                value={loginData.version}
                onChange={(e) => setLoginData({...loginData, version: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input 
              type="text" 
              className="w-full mc-input" 
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full mc-button text-xl mt-4">
            CONNECT
          </button>
          <p className="text-center text-xs mt-2 text-gray-400">Status: {status}</p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-minecraft-dark">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between p-4 bg-minecraft-gray border-b-4 border-black gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-minecraft-green border-2 border-black flex items-center justify-center">
            <Shield size={32} className="text-black" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{loginData.host}</h2>
            <div className="flex gap-4 text-xs font-minecraft">
              <span className="text-minecraft-red">♥ {Math.round(stats.health)}</span>
              <span className="text-minecraft-gold">🍗 {Math.round(stats.food)}</span>
              <span className="text-minecraft-green">✨ {stats.xp}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/30 p-2 border-2 border-black/50">
          <Compass size={18} className="text-minecraft-gold" />
          <div className="flex gap-3 text-xs font-minecraft">
            <span>X: <span className="text-white">{pos.x}</span></span>
            <span>Y: <span className="text-white">{pos.y}</span></span>
            <span>Z: <span className="text-white">{pos.z}</span></span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={toggleAutoEat} 
            className={`mc-button flex items-center gap-1 px-3 py-1 text-[10px] ${autoEat ? '!bg-minecraft-gold' : ''}`}
            title="Auto Eat"
          >
            <Coffee size={14} /> {autoEat ? 'EATING' : 'AUTO-EAT'}
          </button>
          <button 
            onClick={toggleAntiAfk} 
            className={`mc-button flex items-center gap-1 px-3 py-1 text-[10px] ${antiAfk ? '!bg-minecraft-green' : ''}`}
          >
            <Zap size={14} /> AFK: {antiAfk ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => window.location.reload()} className="mc-button p-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col p-4 bg-black/50 ${activeTab !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-hide">
            {chat.map((msg, i) => (
              <div key={i} className="text-sm leading-relaxed whitespace-pre-wrap font-minecraft drop-shadow-[1px_1px_rgba(0,0,0,0.8)]">
                {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 mc-input" 
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="mc-button px-4">
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Sidebar Group */}
        <div className="hidden md:flex flex-col w-80 bg-minecraft-gray border-l-4 border-black divide-y-4 divide-black">
          {/* Players */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
              <Users size={18} />
              <h3 className="font-bold">Players ({players.length})</h3>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              {players.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm hover:bg-white/10 p-1 cursor-default">
                  <div className="w-6 h-6 bg-minecraft-dark border border-black flex items-center justify-center text-[10px]">
                    {p[0].toUpperCase()}
                  </div>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
              <Package size={18} />
              <h3 className="font-bold">Inventory</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-2">
              {inventory.map((item, i) => (
                <div key={i} className="aspect-square bg-minecraft-dark border-2 border-black flex flex-col items-center justify-center relative group p-1" title={`${item.name} x${item.count}`}>
                  <div className="text-[8px] text-center break-words w-full overflow-hidden leading-tight">
                    {item.name.replace('minecraft:', '').replace(/_/g, ' ')}
                  </div>
                  <span className="absolute bottom-0 right-0 text-[10px] bg-black/70 px-0.5 font-bold text-minecraft-gold">
                    {item.count}
                  </span>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 16 - inventory.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-minecraft-dark border-2 border-black/30"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Views */}
        <div className={`flex-1 flex flex-col p-4 bg-minecraft-gray md:hidden ${activeTab === 'chat' ? 'hidden' : 'flex'}`}>
          {activeTab === 'players' && (
            <>
              <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                <Users size={18} />
                <h3 className="font-bold">Players ({players.length})</h3>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {players.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm p-1">
                    <div className="w-6 h-6 bg-minecraft-dark border border-black flex items-center justify-center text-[10px]">
                      {p[0].toUpperCase()}
                    </div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {activeTab === 'inventory' && (
            <>
              <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                <Package size={18} />
                <h3 className="font-bold">Inventory</h3>
              </div>
              <div className="grid grid-cols-4 gap-2 overflow-y-auto">
                {inventory.map((item, i) => (
                  <div key={i} className="aspect-square bg-minecraft-dark border-2 border-black flex flex-col items-center justify-center relative p-1">
                    <div className="text-[8px] text-center leading-tight">
                      {item.name.replace('minecraft:', '').replace(/_/g, ' ')}
                    </div>
                    <span className="absolute bottom-0 right-0 text-[10px] bg-black/70 px-0.5 font-bold text-minecraft-gold">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer / Mobile Tabs */}
      <div className="flex md:hidden bg-minecraft-gray border-t-4 border-black p-2">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex flex-col items-center py-1 ${activeTab === 'chat' ? 'opacity-100' : 'opacity-50'}`}
        >
          <Zap size={20} />
          <span className="text-[10px]">Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('players')}
          className={`flex-1 flex flex-col items-center py-1 ${activeTab === 'players' ? 'opacity-100' : 'opacity-50'}`}
        >
          <Users size={20} />
          <span className="text-[10px]">Players</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 flex flex-col items-center py-1 ${activeTab === 'inventory' ? 'opacity-100' : 'opacity-50'}`}
        >
          <Package size={20} />
          <span className="text-[10px]">Items</span>
        </button>
      </div>
    </div>
  );
};

export default App;
