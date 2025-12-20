import React from 'react';
import { Card } from '../../components/ui';

const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <Card>
      <div className="p-12 text-center text-gray-500">
        <p className="text-lg">{description}</p>
        <p className="text-sm mt-2">This feature is coming soon.</p>
      </div>
    </Card>
  </div>
);

export const PortalProfile = () => <PlaceholderPage title="My Profile" description="View and edit your personal information." />;
export const PortalDirectory = () => <PlaceholderPage title="Member Directory" description="Connect with other members of your branch." />;
export const PortalRegistrations = () => <PlaceholderPage title="Event Registrations" description="Manage your event tickets and sign-ups." />;
export const PortalAttendance = () => <PlaceholderPage title="My Attendance" description="View your attendance history for services and events." />;
export const PortalGroups = () => <PlaceholderPage title="Small Groups" description="Find and join small groups in your community." />;
export const PortalCalendar = () => <PlaceholderPage title="Calendar" description="View upcoming church events and schedules." />;
export const PortalNotifications = () => <PlaceholderPage title="Notifications" description="Stay updated with latest announcements." />;
export const PortalSettings = () => <PlaceholderPage title="Account Settings" description="Manage your preferences and account security." />;
export const PortalShare = () => <PlaceholderPage title="Share FaithConnect" description="Invite friends and family to join." />;
export const PortalDepartments = () => <PlaceholderPage title="Departments" description="Volunteer and serve in various church departments." />;
