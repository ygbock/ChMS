import React, { useEffect, useState } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { Video, Send, User } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Stream, StreamStatus } from '../../types';
import { useParams } from 'react-router-dom';

export const PortalStreaming: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  // Mock fetching active stream
  useEffect(() => {
    const fetchStream = async () => {
      // In real app, query supabase
      // const { data } = await supabase.from('streams').select('*').eq('status', 'live').single();
      // If streamId is provided, fetch that specific stream
      
      console.log("Fetching stream...", streamId ? `ID: ${streamId}` : "Default live stream");

      // Mock:
      setActiveStream({
        id: streamId || '1',
        title: streamId ? `Archived Stream #${streamId}` : 'Sunday Service Live',
        status: streamId ? StreamStatus.ARCHIVED : StreamStatus.LIVE,
        platform: 'custom',
        privacy: 'public' as any,
        description: 'Join us for our weekly Sunday worship service.',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      } as Stream);
    };
    fetchStream();
  }, [streamId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    // Add to local state (in real app, insert to 'stream_chats' table)
    setMessages([...messages, { 
      id: Date.now(), 
      user: 'Me', 
      text: chatMessage, 
      timestamp: new Date() 
    }]);
    setChatMessage('');
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-black aspect-video rounded-xl overflow-hidden shadow-lg mb-4 relative">
          {activeStream ? (
            <iframe 
              src={activeStream.embed_url} 
              className="w-full h-full" 
              allowFullScreen 
              title="Stream"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/50">
              <div className="text-center">
                <Video size={48} className="mx-auto mb-2 opacity-50" />
                <p>No live stream active</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl border">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{activeStream?.title || 'Waiting for stream...'}</h1>
                    <p className="text-gray-500 mt-1">{activeStream?.description}</p>
                </div>
                <Button variant="secondary" className="hidden md:flex">Share</Button>
            </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden h-[500px] lg:h-auto">
        <div className="p-4 border-b font-semibold flex justify-between items-center bg-gray-50">
          <span>Live Chat</span>
          <span className="text-xs font-normal text-gray-500">124 watching</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && <p className="text-center text-gray-400 text-sm my-10">Welcome to the chat!</p>}
            {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                        {msg.user[0]}
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-gray-900">{msg.user}</span>
                            <span className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm text-gray-600">{msg.text}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
                placeholder="Say something..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white"
            />
            <Button size="sm" type="submit">
                <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};