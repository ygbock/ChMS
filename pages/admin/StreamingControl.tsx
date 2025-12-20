import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../../components/ui';
import { Video, Settings, Lock, Eye, RefreshCw, StopCircle, PlayCircle, Archive } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

export const StreamingControl: React.FC = () => {
    const { profile } = useAuth();
    const [streamKey, setStreamKey] = useState('**********************');
    const [isLive, setIsLive] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);

    // Polling for viewer count
    useEffect(() => {
        // Initial fetch
        fetchViewerCount();

        const intervalId = setInterval(() => {
            fetchViewerCount();
        }, 15000); // 15 seconds

        return () => clearInterval(intervalId);
    }, [isLive]);

    const fetchViewerCount = async () => {
        try {
            // In a real scenario, this would be an RPC call
            const { data, error } = await supabase.rpc('get_stream_viewer_count', { _stream_id: '00000000-0000-0000-0000-000000000000' }); // Demo ID

            if (error) throw error;
            setViewerCount(data || 0);
        } catch (err) {
            console.error("Error fetching viewer count:", err);
            // Fallback to simulation if RPC fails or is missing
            const mockCount = isLive ? Math.floor(Math.random() * (1500 - 1200 + 1) + 1200) : 0;
            setViewerCount(mockCount);
        }
    };

    // Simulated RPC call
    const revealKey = async () => {
        // const { data } = await supabase.rpc('get_stream_credentials', { stream_uuid: '...' });
        setStreamKey('live_key_sk_123456789');
        setRevealed(true);
    };

    const toggleLive = async () => {
        setIsLive(!isLive);
        if (!isLive) {
            // Log audit
            await supabase.from('audit_logs').insert({
                user_id: profile?.id,
                action: 'start_stream',
                details: { timestamp: new Date() }
            });
        }
    };

    const archiveStream = async () => {
        if (isLive) {
            alert("Stop the stream before archiving.");
            return;
        }
        if (!confirm("Are you sure you want to archive this session?")) return;

        try {
            const { error } = await supabase.rpc('archive_stream', { _stream_id: '00000000-0000-0000-0000-000000000000' });
            if (error) throw error;

            await supabase.from('audit_logs').insert({
                user_id: profile?.id,
                action: 'archive_stream',
                details: { timestamp: new Date(), stream_id: '00000000-0000-0000-0000-000000000000' }
            });

            alert("Stream archived successfully.");
        } catch (err: any) {
            alert("Failed to archive stream: " + err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Streaming Control Room</h1>
                    <p className="text-gray-500">Manage your broadcast configuration and status.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${isLive ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`}></span>
                        {isLive ? 'LIVE' : 'OFFLINE'}
                    </span>
                    <Button
                        onClick={toggleLive}
                        variant={isLive ? 'danger' : 'primary'}
                        className="gap-2"
                    >
                        {isLive ? <><StopCircle size={18} /> End Stream</> : <><PlayCircle size={18} /> Go Live</>}
                    </Button>
                    <Button variant="secondary" className="gap-2" onClick={archiveStream}>
                        <Archive size={18} /> Archive
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-black aspect-video flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Eye size={12} /> {viewerCount.toLocaleString()} Viewers
                        </div>
                        <div className="text-white/30 flex flex-col items-center">
                            <Video size={64} />
                            <p className="mt-2 font-mono text-sm">PREVIEW</p>
                        </div>
                    </Card>

                    <Card title="Stream Settings">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Title" defaultValue="Sunday Service - The Power of Faith" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                                    <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option>Public</option>
                                        <option>Members Only</option>
                                        <option>Private</option>
                                    </select>
                                </div>
                            </div>
                            <Input label="Description" defaultValue="Join us for live worship..." />
                            <div className="flex justify-end">
                                <Button>Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="RTMP Configuration">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Server URL</label>
                                <div className="flex gap-2 mt-1">
                                    <code className="flex-1 bg-gray-100 p-2 rounded text-sm text-gray-700 font-mono truncate">rtmp://live.faithconnect.app/app</code>
                                    <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText('rtmp://live.faithconnect.app/app')}>Copy</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stream Key</label>
                                <div className="flex gap-2 mt-1">
                                    <code className="flex-1 bg-gray-100 p-2 rounded text-sm text-gray-700 font-mono truncate">
                                        {streamKey}
                                    </code>
                                    <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(streamKey)}>Copy</Button>
                                </div>
                                <div className="mt-2 flex gap-2">
                                    {!revealed && <Button size="sm" variant="ghost" onClick={revealKey} className="text-xs"><Eye size={14} className="mr-1" /> Reveal</Button>}
                                    <Button size="sm" variant="ghost" className="text-xs text-red-600"><RefreshCw size={14} className="mr-1" /> Reset Key</Button>
                                </div>
                            </div>
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs">
                                <Lock size={12} className="inline mr-1" /> Keep your stream key private. Anyone with this key can stream to your channel.
                            </div>
                        </div>
                    </Card>

                    <Card title="Moderation">
                        <div className="h-48 bg-gray-50 rounded border flex items-center justify-center text-gray-400 text-sm">
                            Chat stream would appear here...
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="secondary" className="w-full">Clear Chat</Button>
                            <Button size="sm" variant="secondary" className="w-full">Slow Mode</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};