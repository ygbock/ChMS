import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Video, Heart, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ChurchEvent } from '../../types';

export const PortalDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.branch_id) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('branch_id', profile.branch_id)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(3);

        if (error) throw error;
        setUpcomingEvents(data || []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.full_name || 'Member'}</h1>
          <p className="text-gray-500">Here is what's happening at your branch this week.</p>
        </div>
        <Link to="/portal/streaming">
          <Button className="gap-2">
            <Video size={18} />
            Watch Live
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 font-medium">Next Service</p>
              <h3 className="text-2xl font-bold mt-1">
                {upcomingEvents[0]?.title || 'Sunday Service'}
              </h3>
              <p className="text-blue-100 mt-2 text-sm">
                {upcomingEvents[0]
                  ? new Date(upcomingEvents[0].event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Check back soon'}
              </p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <Calendar className="text-white" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Daily Devotional</p>
              <h3 className="font-bold text-gray-900">Walking in Faith</h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" size="sm" className="w-full text-primary">Read Today</Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <Heart size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">My Giving</p>
              <h3 className="font-bold text-gray-900">$0.00 <span className="text-xs font-normal text-gray-500">this month</span></h3>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/portal/giving" className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-primary">Give Now</Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Upcoming Events" className="flex flex-col">
          <div className="flex-1 space-y-4">
            {loading ? <Spinner /> : upcomingEvents.map((event) => {
              const date = new Date(event.event_date);
              return (
                <div key={event.id} className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    <span className="uppercase">{date.toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="text-lg leading-tight">{date.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{event.location || 'Main Auditorium'} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <Link to="/portal/registrations">
                    <Button variant="ghost" size="sm" className="p-2 aspect-square">
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              );
            })}
            {!loading && upcomingEvents.length === 0 && (
              <p className="text-center text-gray-400 py-10">No upcoming events scheduled.</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t">
            <Link to="/portal/registrations">
              <Button variant="secondary" size="sm" className="w-full">View All Events</Button>
            </Link>
          </div>
        </Card>

        <Card title="Recent Sermons">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 items-center group cursor-pointer">
                <div className="w-24 h-16 bg-gray-200 rounded-md relative overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/200/150?random=${i}`} alt="Sermon" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video className="text-white" size={20} />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">The Power of Unity</h4>
                  <p className="text-sm text-gray-500">Pastor John Doe • 45 mins</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <Link to="/portal/streaming">
              <Button variant="secondary" size="sm" className="w-full">Browse Library</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};