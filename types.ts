export enum AppRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DISTRICT_ADMIN = 'district_admin',
  PASTOR = 'pastor',
  LEADER = 'leader',
  WORKER = 'worker',
  MEMBER = 'member',
}

export enum StreamPrivacy {
  PUBLIC = 'public',
  MEMBERS_ONLY = 'members_only',
  PRIVATE = 'private',
}

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

export interface Profile {
  id: string; // matches auth.users id
  email: string;
  full_name?: string;
  branch_id?: string;
  primary_role: AppRole;
  avatar_url?: string;
}

export interface Stream {
  id: string;
  title: string;
  description?: string;
  platform: 'youtube' | 'facebook' | 'vimeo' | 'custom' | 'supabase';
  privacy: StreamPrivacy;
  status: StreamStatus;
  scheduled_start?: string;
  viewer_count?: number;
  thumbnail_url?: string;
  embed_url?: string;
  // Admin only fields
  stream_key?: string;
  rtmp_server?: string;
}

export interface Branch {
  id: string;
  name: string;
  district_id: string;
  address?: string;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'transferred';
  branch_id: string;
}

export interface MemberTransfer {
  id: string;
  member_id: string;
  from_branch_id: string;
  to_branch_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  rejection_notes?: string;
  processed_by?: string;
  created_at: string;
  // Joins
  church_branches_to?: Branch;
  church_branches_from?: Branch;
  profiles?: Profile;
  processed_by_profile?: Profile; // Joined data
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalMembers: number;
  weeklyAttendance: number;
  monthlyGiving: number;
  activeGroups: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  // Joins
  profiles?: Profile;
}

export interface ChurchEvent {
  id: string;
  branch_id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  max_attendees?: number;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'cancelled' | 'attended';
  created_at: string;
  // Joins
  event?: ChurchEvent;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  event_id: string;
  check_in_time: string;
  branch_id: string;
  notes?: string;
  // Joins
  event?: ChurchEvent;
}

export interface Department {
  id: string;
  branch_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  created_at: string;
  // Joins
  leader?: Profile;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  // Joins
  department?: Department;
  profile?: Profile;
}

export interface SmallGroup {
  id: string;
  branch_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  meeting_time?: string;
  meeting_location?: string;
  created_at: string;
  // Joins
  leader?: Profile;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  // Joins
  group?: SmallGroup;
  profile?: Profile;
}

export interface StreamMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
  // Joins
  profile?: Profile;
}