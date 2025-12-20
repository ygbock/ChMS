import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Input, Spinner } from '../../components/ui';
import { Video, Send, User, Share2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Stream, StreamStatus, Profile, StreamMessage } from '../../types';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PortalStreaming: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const { profile } = useAuth();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStream();
    scrollToBottom();
  }, [streamId]);

  useEffect(() => {
    if (activeStream?.id) {
      fetchMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`stream:${activeStream.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_messages',
          filter: `stream_id=eq.${activeStream.id}`
        }, async (payload) => {
          // Fetch profile for the new message
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', payload.new.user_id).single();
          const newMsg = { ...payload.new, profile } as StreamMessage;
          setMessages(prev => [...prev, newMsg]);
        })
        .subscribe();

      // Polling viewer count (simulated or real RPC)
      const pollInterval = setInterval(async () => {
        const { data, error } = await supabase.rpc('get_stream_viewer_count', { _stream_id: activeStream.id });
        if (!error) setViewerCount(data);
      }, 5000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
      };
    }
  }, [activeStream]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStream = async () => {
    setLoading(true);
    try {
      if (streamId) {
        const { data, error } = await supabase.from('streams').select('*').eq('id', streamId).single();
        if (error) throw error;
        setActiveStream(data);
      } else {
        const { data, error } = await supabase.from('streams').select('*').eq('status', 'live').limit(1).single();
        if (!error) setActiveStream(data);
        else {
          // Fallback to most recent archived if no live
          const { data: recent } = await supabase.from('streams').select('*').order('created_at', { ascending: false }).limit(1).single();
          setActiveStream(recent);
        }
      }
    } catch (err) {
      console.error("Error fetching stream:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeStream?.id) return;
    try {
      const { data, error } = await supabase
        .from('stream_messages')
        .select('*, profile:profiles(*)')
        .eq('stream_id', activeStream.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeStream?.id || !profile?.id) return;

    const msgText = chatMessage;
    setChatMessage('');

    try {
      const { error } = await supabase
        .from('stream_messages')
        .insert({
          stream_id: activeStream.id,
          user_id: profile.id,
          message: msgText
        });
      if (error) throw error;
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + err.message);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-black aspect-video rounded-xl overflow-hidden shadow-lg mb-4 relative">
          {activeStream?.embed_url ? (
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
                <p>{activeStream ? "Stream url missing" : "No live stream active"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {activeStream?.status === 'live' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                    LIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase">
                    {activeStream?.status || 'OFFLINE'}
                  </span>
                )}
                {activeStream?.status === 'live' && (
                  <span className="text-xs text-gray-500 font-medium">{viewerCount} watching</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{activeStream?.title || 'Main Service'}</h1>
              <p className="text-gray-500 mt-1">{activeStream?.description || 'No description provided.'}</p>
            </div>
            <Button variant="secondary" className="gap-2 shrink-0">
              <Share2 size={18} />
              <span className="hidden md:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden h-[500px] lg:h-auto">
        <div className="p-4 border-b font-semibold flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-primary" />
            <span>Community Chat</span>
          </div>
          <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">REALTIME</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <User size={32} className="opacity-20" />
              <p className="text-sm">Welcome! Be the first to say hello.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 overflow-hidden">
                {msg.profile?.avatar_url ? (
                  <img src={msg.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (msg.profile?.full_name?.[0] || 'A')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-bold truncate ${msg.user_id === profile?.id ? 'text-primary' : 'text-gray-900'}`}>
                    {msg.profile?.full_name || 'Member'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 break-words leading-tight">{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Share your thoughts..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="bg-gray-50 border-none focus:ring-1 focus:ring-primary h-10 text-sm"
              disabled={!activeStream || activeStream.status === 'archived'}
            />
            <Button size="sm" type="submit" disabled={!chatMessage.trim() || !activeStream || activeStream.status === 'archived'}>
              <Send size={16} />
            </Button>
          </form>
          {activeStream?.status === 'archived' && (
            <p className="text-[10px] text-center text-gray-400 mt-2">Chat is disabled for archived streams.</p>
          )}
        </div>
      </div>
    </div>
  );
};