
import { Teacher, ClassGroup, CurriculumItem, GeneratedSchedule, User, UserRole, UserStatus, Organization, ClassSettings, SavedSchedule, SystemConfig } from '../types';

const USERS_KEY = 'horarios_users_v3'; // Bumped version for orgId change
const ORGS_KEY = 'horarios_orgs_v1';
const SYS_CONFIG_KEY = 'horarios_sys_config_v1';
const DATA_KEY_PREFIX = 'horarios_data_';

interface AppData {
  teachers: Teacher[];
  classes: ClassGroup[];
  curriculum: CurriculumItem[];
  schedule: GeneratedSchedule | null;
  settings?: ClassSettings;
  history: SavedSchedule[];
}

// --- SYSTEM CONFIG ---

export const getSystemConfig = (): SystemConfig => {
  const stored = localStorage.getItem(SYS_CONFIG_KEY);
  if (!stored) {
    return {
      loginTitle: 'Gerador de Horário',
      loginSubtitle: 'Sistema Multi-institucional',
      loginSidebarColor: '#3730a3', // Indigo-800 approx
      loginButtonColor: '#2563eb' // Blue-600 approx
    };
  }
  return JSON.parse(stored);
};

export const saveSystemConfig = (config: SystemConfig) => {
  localStorage.setItem(SYS_CONFIG_KEY, JSON.stringify(config));
};

// --- ORGANIZATION MANAGEMENT ---

export const getOrganizations = (): Organization[] => {
    const stored = localStorage.getItem(ORGS_KEY);
    if (!stored) {
        // Default Org
        const defaultOrg: Organization = {
            id: 'org-default',
            name: 'Escola Matriz',
            createdAt: Date.now()
        };
        saveOrganizations([defaultOrg]);
        return [defaultOrg];
    }
    return JSON.parse(stored);
};

export const saveOrganizations = (orgs: Organization[]) => {
    localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
};

export const createOrganization = (name: string, logoUrl?: string, primaryColor?: string): Organization => {
    const orgs = getOrganizations();
    const newOrg: Organization = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: Date.now(),
        logoUrl,
        primaryColor
    };
    orgs.push(newOrg);
    saveOrganizations(orgs);
    return newOrg;
};

export const updateOrganization = (id: string, name: string, logoUrl?: string, primaryColor?: string) => {
    const orgs = getOrganizations().map(o => o.id === id ? { ...o, name, logoUrl, primaryColor } : o);
    saveOrganizations(orgs);
};

export const deleteOrganization = (id: string) => {
    const orgs = getOrganizations().filter(o => o.id !== id);
    saveOrganizations(orgs);
    // Optional: cascading delete of users could happen here, 
    // but for safety we'll leave users orphaned or handle it in UI
};

export const getOrganizationById = (id: string): Organization | undefined => {
    return getOrganizations().find(o => o.id === id);
};


// --- USER MANAGEMENT ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    // Ensure default org exists
    let defaultOrg = getOrganizations()[0];
    if(!defaultOrg) defaultOrg = createOrganization('Escola Matriz');

    const defaultAdmin: User = {
        id: 'admin-id',
        username: 'admin',
        password: '123',
        name: 'Super Administrador',
        organizationId: defaultOrg.id,
        role: 'admin',
        status: 'active'
    };
    saveUsers([defaultAdmin]);
    return [defaultAdmin];
  }
  return JSON.parse(stored);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Admin create/update user
export const saveUserFull = (user: User) => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
        users[index] = user;
    } else {
        users.push(user);
    }
    saveUsers(users);
};

// Self registration
export const registerUser = (data: { name: string, username: string, password: string, organizationName: string, existingOrgId?: string }): boolean => {
  const users = getUsers();
  if (users.find(u => u.username === data.username)) {
    return false; // User already exists
  }

  let orgId = data.existingOrgId;

  // Create new org if ID not provided
  if (!orgId) {
      const newOrg = createOrganization(data.organizationName);
      orgId = newOrg.id;
  }

  const newUser: User = { 
      id: crypto.randomUUID(),
      name: data.name,
      username: data.username,
      password: data.password,
      organizationId: orgId,
      role: 'user',
      status: 'pending'
  };

  users.push(newUser);
  saveUsers(users);
  return true;
};

export const authenticateUser = (username: string, password: string): { user?: User, error?: string } => {
  const users = getUsers();
  const foundUser = users.find(u => u.username === username && u.password === password);
  
  if (!foundUser) {
      return { error: 'Usuário ou senha incorretos.' };
  }

  if (foundUser.status === 'pending') {
      return { error: 'Sua conta aguarda aprovação do administrador.' };
  }

  if (foundUser.status === 'blocked') {
      return { error: 'Sua conta foi bloqueada. Contate o suporte.' };
  }

  return { user: foundUser };
};

// --- ADMIN FUNCTIONS ---

export const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    const users = getUsers();
    const updatedUsers = users.map(u => {
        if (u.id === userId) {
            return { ...u, status: newStatus };
        }
        return u;
    });
    saveUsers(updatedUsers);
};

export const deleteUser = (userId: string) => {
    const users = getUsers().filter(u => u.id !== userId);
    saveUsers(users);
};

// --- DATA PERSISTENCE ---

export const loadUserData = (userId: string): AppData => {
  const key = `${DATA_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    return {
      teachers: [],
      classes: [],
      curriculum: [],
      schedule: null,
      history: []
    };
  }
  const parsed = JSON.parse(stored);
  // Migration safety for old data
  if (!parsed.history) parsed.history = [];
  return parsed;
};

export const saveUserData = (userId: string, data: AppData) => {
  const key = `${DATA_KEY_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(data));
};
