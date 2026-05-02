import { APP_CONFIG } from '../config/appConfig';

export const STUDENT_USER = {
  id: '2024-8849-01',
  name: 'Julian Sterling',
  role: 'student',
  program: 'Undergraduate • Computer Science',
  semester: 'Junior Semester',
  validThru: 'MAY 2028',
  gpa: '3.85',
  avatar: null,
};

export const TEACHER_USER = {
  id: 'FAC-2021-042',
  name: 'Prof. Vikram',
  role: 'teacher',
  department: 'Department of B.Tech Computer Science & Engineering',
  avatar: null,
};

export const STATS_DATA = [
  { id: '1', icon: 'calendar-outline', label: 'ATTENDANCE', value: '92%', color: '#8B2FC9' },
  { id: '2', icon: 'time-outline', label: 'TIMETABLE', value: '3 Classes Left Today', color: '#8B2FC9' },
  { id: '3', icon: 'wallet-outline', label: 'FEES', value: 'No Pending Dues', color: '#8B2FC9' },
  { id: '4', icon: 'star-outline', label: 'RESULTS', value: '3.8 GPA', color: '#8B2FC9' },
  { id: '5', icon: 'document-text-outline', label: 'ASSIGNMENTS', value: '5 Pending', color: '#8B2FC9' },
  { id: '6', icon: 'megaphone-outline', label: 'NOTICES', value: '2 New Updates', color: '#8B2FC9' },
];

export const COURSES = [
  { id: '1', code: 'UI', name: 'UI/UX Design Systems', lecture: 'Lec 14: Visual Tokens', progress: 85, color: '#7C3AED' },
  { id: '2', code: 'AI', name: 'Intro to Machine Learning', lecture: 'Lec 08: Neural Networks', progress: 62, color: '#8B2FC9' },
  { id: '3', code: 'DS', name: 'Data Structures & Algorithms', lecture: 'Lec 20: Graphs', progress: 74, color: '#F97316' },
];

export const ATTENDANCE_SUBJECTS = [
  { id: '1', code: 'A', name: 'Advanced Calculus', professor: 'Dr. Elena Rodriguez', attendance: 88, status: null, color: '#8B2FC9' },
  { id: '2', code: 'B', name: 'Molecular Biology', professor: 'Prof. Julian Vane', attendance: 64, status: 'REQUIRES IMMEDIATE ATTENTION', color: '#EF4444' },
  { id: '3', code: 'L', name: 'Modern Literature', professor: 'Dr. Sarah Jenkins', attendance: 92, status: null, color: '#22C55E' },
  { id: '4', code: 'C', name: 'Data Structures', professor: 'Prof. Michael Chen', attendance: 76, status: null, color: '#8B2FC9' },
  { id: '5', code: 'P', name: 'Cognitive Psychology', professor: 'Dr. Lisa Markram', attendance: 71, status: 'BELOW THRESHOLD', color: '#F59E0B' },
];

export const RECENT_RECORDS = [
  { id: '1', subject: 'Advanced Calculus', time: 'Today, 09:00 AM • Lecture Hall A', status: 'PRESENT', isPresent: true },
  { id: '2', subject: 'Molecular Biology', time: 'Yesterday, 02:00 PM • Lab, Seminar Room 2', status: 'ABSENT', isPresent: false },
  { id: '3', subject: 'Modern Literature', time: 'Yesterday, 11:00 AM • Seminar Room 2', status: 'PRESENT', isPresent: true },
];

export const SEMESTER_RESULTS = [
  {
    id: '1',
    semester: 'FALL 2023',
    label: 'Current Semester',
    gpa: '3.92',
    courses: [
      { id: 'c1', code: '{}', name: 'Advanced Algorithms', details: 'CS-402 · Prof. Aris Thorne', credits: '4.0', grade: 'A', color: '#3474EC' },
      { id: 'c2', code: '⚙', name: 'Cognitive Neuroscience', details: 'PSY-310 · Dr. Elena Vance', credits: '3.0', grade: 'A-', color: '#F97316' },
      { id: 'c3', code: '✏', name: 'Digital UI Systems', details: 'DES-441 · Sarah Jenkins', credits: '3.0', grade: 'A', color: '#7C3AED' },
    ],
  },
  {
    id: '2',
    semester: 'SPRING 2023',
    label: 'Archived Results',
    gpa: '3.78',
    courses: [
      { id: 'c4', code: '#', name: 'Discrete Mathematics', details: 'MAT-201 · Prof. Harold Finney', credits: '4.0', grade: 'B+', color: '#22C55E' },
      { id: 'c5', code: '⚗', name: 'Physics II', details: 'PHY-202 · Dr. Ramos Cruz', credits: '3.0', grade: 'A-', color: '#3474EC' },
    ],
  },
];

export const NOTIFICATIONS = [
  { id: '1', type: 'grade', icon: 'star', title: 'New Grade Posted: Architecture 101', time: '10M AGO', description: 'Your Final Design Project "Urban Sanctuary" has been graded. You received an A (96/100).', link: 'View Feedback', isNew: true, color: '#8B2FC9' },
  { id: '2', type: 'announcement', icon: 'megaphone', title: 'Department Announcement', time: '1H AGO', description: "The main library will be hosting a 'Focus Marathon' this weekend with free refreshments and extended hours.", link: null, isNew: true, color: '#F97316' },
  { id: '3', type: 'material', icon: 'book', title: 'Course Material Updated', time: '4H AGO', description: 'Professor Higgins added "Week 8: Structural Integrity PDF" to the course resources.', link: null, isNew: false, color: '#6B7280' },
  { id: '4', type: 'deadline', icon: 'calendar', title: 'Registration Confirmed', time: 'YESTERDAY', description: "Your registration for the 'Spring Career Fair' has been successfully processed.", link: null, isNew: false, color: '#22C55E' },
];

export const STUDENTS_LIST = [
  { id: '1', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE001`, name: 'Aarav Vardhan', status: null },
  { id: '2', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE002`, name: 'Ananya Singh', status: 'absent' },
  { id: '3', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE003`, name: 'Arjun Malhotra', status: 'present' },
  { id: '4', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE004`, name: 'Ishaan Reddy', status: 'absent' },
  { id: '5', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE005`, name: 'Meera Iyer', status: null },
  { id: '6', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE006`, name: 'Riya Sharma', status: 'present' },
  { id: '7', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE007`, name: 'Dev Patel', status: null },
  { id: '8', rollNo: `${APP_CONFIG.UNIVERSITY_ID_PREFIX}CSE008`, name: 'Priya Nair', status: 'present' },
];

export const CURRICULUM = [
  { id: '1', code: 'DS', name: 'Data Structures', description: 'Algorithmic complexity, tree traversals, and advanced heap implementations.', faculty: 'Dr. Elena Gilbert', role: 'PhD in Algorithms', progress: 65, type: 'CORE SUBJECT', color: '#8B2FC9' },
  { id: '2', code: 'OS', name: 'Operating Systems', description: 'Kernel architecture, process synchronization, and memory management strategies.', faculty: 'Prof. Marcus Thorne', role: 'Senior System Architect', progress: 42, type: 'LAB INTEGRATED', color: '#F97316' },
  { id: '3', code: 'AI', name: 'Artificial Intelligence', description: 'Neural networks, search heuristics, and logic-based expert systems.', faculty: 'Dr. Sarah Chen', role: 'ML Research Head', progress: 28, type: 'ELECTIVE', color: '#7C3AED' },
];

export const DEPT_STREAMS = [
  { id: '1', year: '1st Year', status: 'STABLE', statusColor: '#22C55E', sections: [{ name: 'CSE-A', attendance: '94%' }, { name: 'CSE-B', attendance: '91%' }] },
  { id: '2', year: '2nd Year', status: 'CRITICAL', statusColor: '#EF4444', sections: [{ name: 'CSE-C', attendance: '72%', alert: true }, { name: 'CSE-D', attendance: '89%' }], alert: 'Attendance alert sent to Dr. Sharma' },
  { id: '3', year: '3rd Year', status: 'STABLE', statusColor: '#22C55E', sections: [{ name: 'CSE-E', attendance: '88%' }, { name: 'CSE-F', attendance: '86%' }] },
  { id: '4', year: '4th Year', status: 'STABLE', statusColor: '#22C55E', sections: [{ name: 'Placement Prep', attendance: '98%' }] },
];

export const UPCOMING_CLASSES = [
  { id: '1', subject: 'Organic Chemistry', room: 'Lab Room 12', time: '1:00 PM', studentsCount: 22 },
  { id: '2', subject: 'Vector Calculus', room: 'Lecture Hall B', time: '2:30 PM', studentsCount: 41 },
];

export const TEACHER_SCHEDULE = [
  { id: '1', time: '12:30 PM', subject: 'Neural Networks Lab', details: 'B.Tech CSE — 4th Year | Lab 202' },
  { id: '2', time: '02:30 PM', subject: 'Staff Meeting', details: 'Conference Hall | Academic Audit' },
  { id: '3', time: '04:00 PM', subject: 'Office Hours', details: 'Cabin A-12 | Project Guidance' },
];
