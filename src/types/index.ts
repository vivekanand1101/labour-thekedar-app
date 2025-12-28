export interface User {
  id: number;
  phone: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: number;
  userId: number;
  name: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

export interface Labour {
  id: number;
  projectId: number;
  name: string;
  phone: string | null;
  dailyWage: number;
  createdAt: string;
}

export interface Attendance {
  id: number;
  labourId: number;
  date: string;
  workType: 'full' | 'half';
  notes: string | null;
}

export interface Payment {
  id: number;
  labourId: number;
  amount: number;
  date: string;
  type: 'advance' | 'settlement';
  notes: string | null;
}

export interface LabourWithStats extends Labour {
  totalEarned: number;
  totalPaid: number;
  balance: number;
  attendanceCount: number;
}

export interface ProjectWithStats extends Project {
  labourCount: number;
  totalPendingDues: number;
}
