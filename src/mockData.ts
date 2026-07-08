import { Seminar, Session, Registration, Attendance } from './types';

// Standard ISO dates for realistic schedules
const now = new Date();
const dateISO = (daysOffset: number, hoursOffset: number = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset, 0, 0, 0);
  return d.toISOString();
};

export const INITIAL_MOCK_SEMINARS: Seminar[] = [
  {
    id: 'sem_tech_summit',
    title: 'Global Tech Innovations Summit 2026',
    description: 'An immersive summit exploring the vanguard of software development, serverless scaling, and cloud architecture. This seminar features leading engineers speaking on state-of-the-art developer operations, AI-assisted coding, and lightning-fast full-stack runtimes.',
    startDate: dateISO(2, 9), // 2 days from now at 9:00 AM
    endDate: dateISO(2, 17),  // 2 days from now at 5:00 PM
    venue: 'Silicon Hall, Tech District (In-Person)',
    capacity: 2, // Set to 2 to easily demonstrate capacity limit and waitlisting!
    status: 'Published',
    organizerId: 'demo_organizer_1',
    category: 'Technology',
    registeredCount: 2,
    createdAt: dateISO(-5)
  },
  {
    id: 'sem_ux_craft',
    title: 'UI/UX Craftsmanship & Fluid Interactions',
    description: 'Deep dive into the aesthetics of design, high-contrast layouts, typography pairings, and micro-interactions. Learn how to transform standard components into highly polished, delightful user interfaces with robust local animation systems.',
    startDate: dateISO(5, 10), // 5 days from now at 10:00 AM
    endDate: dateISO(5, 16),  // 5 days from now at 4:00 PM
    venue: 'Creative Studio B & Virtual Livestream',
    capacity: 50,
    status: 'Published',
    organizerId: 'demo_organizer_1',
    category: 'Design',
    registeredCount: 1,
    createdAt: dateISO(-3)
  },
  {
    id: 'sem_startup_blueprint',
    title: 'Startup Blueprint: Zero to One',
    description: 'Draft workshop detailing product-market fit, sustainable unit economics, and building engineering teams from scratch. Perfect for founders, lead engineers, and product designers.',
    startDate: dateISO(10, 13), // 10 days from now at 1:00 PM
    endDate: dateISO(10, 18),  // 10 days from now at 6:00 PM
    venue: 'Founder Hub Space (Virtual Access Only)',
    capacity: 100,
    status: 'Draft', // Set as Draft to demonstrate Organizer/Admin draft visibility!
    organizerId: 'demo_organizer_2',
    category: 'Business',
    registeredCount: 0,
    createdAt: dateISO(-1)
  }
];

export const INITIAL_MOCK_SESSIONS: Record<string, Session[]> = {
  'sem_tech_summit': [
    {
      id: 'sess_tech_1',
      seminarId: 'sem_tech_summit',
      title: 'Opening Keynote: Scaling Beyond the Bare Metal',
      speakerName: 'Sarah Jenkins (VP of Cloud Platform)',
      startTime: dateISO(2, 9),
      endTime: dateISO(2, 10.5)
    },
    {
      id: 'sess_tech_2',
      seminarId: 'sem_tech_summit',
      title: 'Interactive Hands-on with the Gemini Live API',
      speakerName: 'David Chen (Principal Dev Advocate)',
      startTime: dateISO(2, 11),
      endTime: dateISO(2, 12.5)
    },
    {
      id: 'sess_tech_3',
      seminarId: 'sem_tech_summit',
      title: 'Durable Cloud Databases & Zero-Trust Architecture',
      speakerName: 'Elena Rostova (SecOps Lead)',
      startTime: dateISO(2, 14),
      endTime: dateISO(2, 15.5)
    }
  ],
  'sem_ux_craft': [
    {
      id: 'sess_ux_1',
      seminarId: 'sem_ux_craft',
      title: 'The Design Language of Emotion & Micro-animations',
      speakerName: 'Marcus Aurel (Aesthetic Engineer)',
      startTime: dateISO(5, 10),
      endTime: dateISO(5, 12)
    },
    {
      id: 'sess_ux_2',
      seminarId: 'sem_ux_craft',
      title: 'Typography & Negative Space: Masterclass',
      speakerName: 'Amelie Laurent (Editorial Designer)',
      startTime: dateISO(5, 13.5),
      endTime: dateISO(5, 15.5)
    }
  ],
  'sem_startup_blueprint': [
    {
      id: 'sess_start_1',
      seminarId: 'sem_startup_blueprint',
      title: 'Pitching Your Architecture to Seed VC Funds',
      speakerName: 'Aris Thorne (Managing Partner)',
      startTime: dateISO(10, 13),
      endTime: dateISO(10, 15)
    }
  ]
};

export const INITIAL_MOCK_REGISTRATIONS: Registration[] = [
  // Two registrations for Tech Summit making it full (since capacity is 2)
  {
    id: 'reg_jane_tech',
    userId: 'demo_user_123', // Matches standard demo user ID
    userName: 'Jane Doe (Demo)',
    userEmail: 'janedoe@example.com',
    seminarId: 'sem_tech_summit',
    seminarTitle: 'Global Tech Innovations Summit 2026',
    code: 'REG-JANETECH',
    status: 'registered',
    createdAt: dateISO(-4),
    organizerId: 'demo_organizer_1'
  },
  {
    id: 'reg_bob_tech',
    userId: 'user_bob',
    userName: 'Bob Smith',
    userEmail: 'bob.smith@example.com',
    seminarId: 'sem_tech_summit',
    seminarTitle: 'Global Tech Innovations Summit 2026',
    code: 'REG-BOBTECH',
    status: 'registered',
    createdAt: dateISO(-3),
    organizerId: 'demo_organizer_1'
  },
  // Alice is on the waitlist for Tech Summit (as capacity is 2)
  {
    id: 'reg_alice_tech',
    userId: 'user_alice',
    userName: 'Alice Johnson',
    userEmail: 'alice.j@example.com',
    seminarId: 'sem_tech_summit',
    seminarTitle: 'Global Tech Innovations Summit 2026',
    code: 'REG-ALICETE',
    status: 'waitlisted',
    createdAt: dateISO(-2),
    organizerId: 'demo_organizer_1'
  },
  // Charlie is registered for UI/UX Craft
  {
    id: 'reg_charlie_ux',
    userId: 'user_charlie',
    userName: 'Charlie Brown',
    userEmail: 'charlie.b@example.com',
    seminarId: 'sem_ux_craft',
    seminarTitle: 'UI/UX Craftsmanship & Fluid Interactions',
    code: 'REG-CHRLIEUX',
    status: 'registered',
    createdAt: dateISO(-1),
    organizerId: 'demo_organizer_1'
  }
];

export const INITIAL_MOCK_ATTENDANCES: Record<string, Attendance[]> = {
  'sess_tech_1': [
    {
      id: 'att_bob_tech_1',
      registrationId: 'reg_bob_tech',
      sessionId: 'sess_tech_1',
      seminarId: 'sem_tech_summit',
      checkedInAt: dateISO(2, 9.1) // Checked in 6 minutes past the hour
    }
  ]
};

// Local storage management helpers
const STORAGE_PREFIX = 'seminar_hub_mock_';

export function getLocalMockData<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error('Error reading mock data from localStorage', e);
    return defaultValue;
  }
}

export function saveLocalMockData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing mock data to localStorage', e);
  }
}

export function clearLocalMockData(): void {
  localStorage.removeItem(STORAGE_PREFIX + 'seminars');
  localStorage.removeItem(STORAGE_PREFIX + 'registrations');
  localStorage.removeItem(STORAGE_PREFIX + 'sessions');
  localStorage.removeItem(STORAGE_PREFIX + 'attendances');
}
