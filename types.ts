
export enum Shift {
  MORNING = 'Manhã',
  AFTERNOON = 'Tarde',
  NIGHT = 'Noite'
}

export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'active' | 'blocked';

export interface Organization {
  id: string;
  name: string;
  createdAt: number;
  logoUrl?: string;
  primaryColor?: string;
}

export interface SystemConfig {
  loginTitle: string;
  loginSubtitle: string;
  loginLogoUrl?: string;
  loginSidebarColor: string;
  loginButtonColor: string;
}

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed
  name: string;
  organizationId: string; // Link to Organization ID
  role: UserRole;
  status: UserStatus;
  organization?: string; // Organization name for display
}

export interface ClassSettings {
    isCustomPeriods: boolean;
    standardPeriods: number;
    customPeriods: Record<string, number>;
}

export interface Teacher {
  id: string;
  name: string;
  availableDays: string[];
  availableShifts: string[];
}

export interface ClassGroup {
  id: string;
  name: string;
  shift: Shift;
  periodsPerDay: Record<string, number>; // Maps DayName -> Number of periods
}

// Represents a requirement: "Class 1A needs 4 lessons of Math by Prof. X"
export interface CurriculumItem {
  id: string;
  classId: string;
  subjectName: string;
  teacherId: string;
  lessonsPerWeek: number;
}

export interface ScheduleSlot {
  day: string;
  period: number;
  classId: string;
  subject: string;
  teacherName: string;
}

export interface GeneratedSchedule {
  schedule: ScheduleSlot[];
  metadata?: {
    message: string;
  };
}

export interface SavedSchedule {
  id: string;
  name: string;
  createdAt: number;
  data: GeneratedSchedule;
}

export const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
export const DEFAULT_PERIODS = 5;
