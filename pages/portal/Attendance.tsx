import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord } from '../../types';
import { Card, Spinner } from '../../components/ui';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

export const PortalAttendance: React.FC = () => {
    const { profile } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!profile?.id) return;

            try {
                const { data, error } = await supabase
                    .from('attendance')
                    .select(`
            *,
            event:event_id(*)
          `)
                    .eq('user_id', profile.id)
                    .order('check_in_time', { ascending: false });

                if (error) throw error;
                setAttendance(data || []);
            } catch (err) {
                console.error("Error fetching attendance:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [profile]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CheckCircle size={20} /></div>
                        <div>
                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Total Visits</p>
                            <p className="text-2xl font-bold text-blue-900">{attendance.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Event / Service</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Time</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {attendance.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(record.check_in_time).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {record.event?.title || 'General Service'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 italic">
                                            {record.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No attendance records found. Keep coming!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};
