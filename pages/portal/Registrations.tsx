import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { ChurchEvent, EventRegistration } from '../../types';
import { Card, Button, Spinner } from '../../components/ui';
import { Calendar, MapPin, Users, CheckCircle2, Ticket } from 'lucide-react';

export const PortalRegistrations: React.FC = () => {
    const { profile } = useAuth();
    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        if (!profile?.branch_id) return;
        try {
            const [eventsRes, regsRes] = await Promise.all([
                supabase.from('events').select('*').eq('branch_id', profile.branch_id).gte('event_date', new Date().toISOString()),
                supabase.from('event_registrations').select('*').eq('user_id', profile.id)
            ]);

            setEvents(eventsRes.data || []);
            setMyRegistrations(regsRes.data || []);
        } catch (err) {
            console.error("Error fetching event data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId: string) => {
        setProcessingId(eventId);
        try {
            const { error } = await supabase
                .from('event_registrations')
                .insert({ event_id: eventId, user_id: profile?.id });

            if (error) throw error;
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (regId: string, eventId: string) => {
        setProcessingId(eventId);
        try {
            const { error } = await supabase
                .from('event_registrations')
                .delete()
                .eq('id', regId);

            if (error) throw error;
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Events & Registrations</h1>
                <p className="text-gray-500">Discover upcoming events and manage your sign-ups.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {events.map((event) => {
                        const registration = myRegistrations.find(r => r.event_id === event.id);
                        const isRegistered = !!registration;

                        return (
                            <Card key={event.id} className={`flex flex-col h-full border-t-4 ${isRegistered ? 'border-t-green-500' : 'border-t-blue-500'}`}>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                                        {isRegistered && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                <CheckCircle2 size={12} /> Registered
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={18} className="text-primary" />
                                            <span className="text-sm">{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin size={18} className="text-primary" />
                                                <span className="text-sm">{event.location}</span>
                                            </div>
                                        )}
                                        {event.max_attendees && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Users size={18} className="text-primary" />
                                                <span className="text-sm">Max {event.max_attendees} attendees</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                                        {event.description || 'Description coming soon for this event.'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t flex justify-between items-center">
                                    <Button variant="ghost" className="gap-2 text-primary">
                                        <Ticket size={16} /> Details
                                    </Button>
                                    {isRegistered ? (
                                        <Button
                                            variant="secondary"
                                            className="text-red-600 hover:bg-red-50 hover:border-red-200"
                                            onClick={() => handleCancel(registration.id, event.id)}
                                            disabled={processingId === event.id}
                                        >
                                            {processingId === event.id ? 'Processing...' : 'Cancel'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleRegister(event.id)}
                                            disabled={processingId === event.id}
                                        >
                                            {processingId === event.id ? 'Processing...' : 'Register'}
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    {events.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border border-dashed">
                            <p className="text-gray-500">No upcoming events found for your branch.</p>
                            <Button variant="ghost" className="mt-2" onClick={fetchData}>Refresh</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
