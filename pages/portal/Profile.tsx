import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input } from '../../components/ui';
import { supabase } from '../../supabaseClient';
import { Camera, Save, User as UserIcon } from 'lucide-react';

export const PortalProfile: React.FC = () => {
    const { profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (!profile?.id) throw new Error("User not found");

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                })
                .eq('id', profile.id);

            if (error) throw error;

            await refreshProfile();
            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>

            <Card>
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={64} className="text-gray-300" />
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                <Camera size={20} />
                            </button>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">{profile?.email}</p>
                        <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {profile?.primary_role?.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Input
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            required
                        />

                        <Input
                            label="Email Address"
                            value={profile?.email || ''}
                            disabled
                            readOnly
                            className="bg-gray-50 font-mono text-xs"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-md text-sm">
                            Profile updated successfully!
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="gap-2" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
