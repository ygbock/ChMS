import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { Card, Button, Spinner } from '../../components/ui';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PortalNotifications: React.FC = () => {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile?.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile]);

    const fetchNotifications = async () => {
        if (!profile?.id) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
            if (error) throw error;
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500">Stay updated with the latest from your church.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchNotifications}>Refresh</Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <Card key={notif.id} className={`p-0 overflow-hidden border-l-4 transition-all ${notif.read ? 'border-l-gray-300' : 'border-l-primary shadow-md'}`}>
                            <div className="p-4 flex gap-4">
                                <div className={`p-2 rounded-full h-fit ${notif.read ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={`font-bold truncate ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h3>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(notif.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-sm mt-1 mb-3 ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>

                                    <div className="flex items-center gap-3">
                                        {notif.link && (
                                            <Link to={notif.link} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                                <ExternalLink size={14} /> View Details
                                            </Link>
                                        )}
                                        {!notif.read && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-green-600"
                                            >
                                                <Check size={14} /> Mark Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notif.id)}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 ml-auto"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {notifications.length === 0 && (
                        <div className="py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4 opacity-50" />
                            <p className="text-gray-500">You're all caught up! No notifications yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
