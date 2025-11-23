export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'DIRECTOR' | 'COORDINATOR' | 'TEACHER';
    schoolId?: string;
}

export interface Teacher {
    id: string;
    userId: string;
    user: User;
    qualifications?: string;
    subjects: Subject[];
    availability: TeacherAvailability[];
}

export interface Subject {
    id: string;
    name: string;
    code?: string;
    color: string;
    description?: string;
}

export interface Class {
    id: string;
    name: string;
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    segment: 'INFANTIL' | 'ANOS_INICIAIS' | 'ANOS_FINAIS' | 'MEDIO';
    dailyLessons: number;
    subjects: ClassSubject[];
}

export interface ClassSubject {
    id: string;
    subjectId: string;
    subject: Subject;
    teacherId?: string;
    teacher?: Teacher;
    lessonsPerWeek: number;
}

export interface TeacherAvailability {
    id: string;
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    isAvailable: boolean;
}

export interface Schedule {
    id: string;
    classId: string;
    class: Class;
    subjectId: string;
    subject: Subject;
    teacherId: string;
    teacher: Teacher;
    day: string;
    timeSlot: number;
    room?: string;
}
