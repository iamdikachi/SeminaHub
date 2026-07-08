export type UserRole = 'Admin' | 'Organizer' | 'Attendee';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Seminar {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  venue: string;
  capacity: number;
  status: 'Draft' | 'Published' | 'Closed';
  organizerId: string;
  category: string;
  registeredCount: number;
  createdAt: string; // ISO string
}

export interface Session {
  id: string;
  seminarId: string;
  title: string;
  speakerName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
}

export interface Registration {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  seminarId: string;
  seminarTitle: string;
  code: string; // Unique alphanumeric registration code
  status: 'registered' | 'waitlisted' | 'cancelled';
  createdAt: string; // ISO string
  organizerId: string; // Stored to optimize O(n) security query list lookups
}

export interface Attendance {
  id: string;
  registrationId: string;
  sessionId: string;
  seminarId: string;
  checkedInAt: string; // ISO string
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
