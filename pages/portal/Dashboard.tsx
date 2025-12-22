import React from 'react';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Video, Heart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PortalDashboard: React.FC = () => {
  const { profile } = useAuth();

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
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 font-medium">Next Service</p>
              <h3 className="text-2xl font-bold mt-1">Sunday Service</h3>
              <p className="text-blue-100 mt-2 text-sm">Starts in 2 days, 10:00 AM</p>
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
            <Button variant="ghost" size="sm" className="w-full text-primary">Give Now</Button>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Upcoming Events">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-xs font-bold text-gray-600">
                  <span>DEC</span>
                  <span className="text-lg">{10 + i}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Christmas Rehearsal</h4>
                  <p className="text-sm text-gray-500">Main Auditorium • 6:00 PM</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Sermons">
          <div className="space-y-4">
             {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 items-center group cursor-pointer">
                <div className="w-24 h-16 bg-gray-200 rounded-md relative overflow-hidden">
                    <img src={`https://picsum.photos/200/150?random=${i}`} alt="Sermon" className="object-cover w-full h-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">The Power of Unity</h4>
                  <p className="text-sm text-gray-500">Pastor John Doe • 45 mins</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};