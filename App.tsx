import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Sparkles, AlertCircle, LogOut, Save, Shield, LayoutDashboard, FileClock } from 'lucide-react';
import { Teacher, ClassGroup, CurriculumItem, GeneratedSchedule, User, ClassSettings, SavedSchedule, Organization } from './types';
import { InputSection } from './components/InputSection';
import { ScheduleView } from './components/ScheduleView';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { HistoryModal } from './components/HistoryModal';
import { SaveScheduleModal } from './components/SaveScheduleModal';
import { generateSchedule } from './services/geminiService';
import { loadUserData, saveUserData, getOrganizationById } from './services/storageService';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | undefined>(undefined);

  // Data State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [classSettings, setClassSettings] = useState<ClassSettings | undefined>(undefined);
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [currentScheduleName, setCurrentScheduleName] = useState<string | undefined>(undefined);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Debounce timer Ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effects ---

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) {
      const data = loadUserData(currentUser.id);
      setTeachers(data.teachers);
      setClasses(data.classes);
      setCurriculum(data.curriculum);
      setSchedule(data.schedule);
      setSavedSchedules(data.history || []);
      if (data.settings) {
          setClassSettings(data.settings);
      }
      
      refreshOrganization(currentUser.organizationId);
      
      setDataLoaded(true);
    } else {
        setDataLoaded(false);
        setShowAdminPanel(false);
        setCurrentOrganization(undefined);
    }
  }, [currentUser]);

  // Save data (Debounced)
  useEffect(() => {
    if (currentUser && dataLoaded && !showAdminPanel) {
      // Clear any existing timer
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timer for 1 second debounce
      saveTimeoutRef.current = setTimeout(() => {
        saveUserData(currentUser.id, {
          teachers,
          classes,
          curriculum,
          schedule,
          settings: classSettings,
          history: savedSchedules
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [teachers, classes, curriculum, schedule, currentUser, dataLoaded, showAdminPanel, classSettings, savedSchedules]);

  // --- Handlers ---

  const refreshOrganization = (orgId: string) => {
      const org = getOrganizationById(orgId);
      setCurrentOrganization(org);
  };

  const handleGenerate = async () => {
    if (teachers.length === 0 || classes.length === 0 || curriculum.length === 0) {
      setError("Por favor, preencha todos os dados necessários (professores, turmas e disciplinas).");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateSchedule(teachers, classes, curriculum);
      setSchedule(result);
      setCurrentScheduleName("Horário Gerado (Não Salvo)");
    } catch (e) {
      setError("Falha ao gerar o horário. Verifique se as restrições são possíveis ou tente novamente.");
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleUpdate = (newSchedule: GeneratedSchedule) => {
      setSchedule(newSchedule);
  };

  const handleSaveToHistory = (name: string) => {
      if (!schedule) return;
      const newSaved: SavedSchedule = {
          id: crypto.randomUUID(),
          name: name,
          createdAt: Date.now(),
          data: schedule
      };
      setSavedSchedules(prev => [...prev, newSaved]);
      setCurrentScheduleName(name);
      setIsSaveModalOpen(false);
  };

  const handleLoadFromHistory = (saved: SavedSchedule) => {
      setSchedule(saved.data);
      setCurrentScheduleName(saved.name);
  };

  const handleDeleteFromHistory = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este horário do histórico?')) {
          setSavedSchedules(prev => prev.filter(s => s.id !== id));
      }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSchedule(null);
    setTeachers([]);
    setClasses([]);
    setCurriculum([]);
    setClassSettings(undefined);
    setSavedSchedules([]);
  };

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  const primaryColor = currentOrganization?.primaryColor || '#2563eb'; 
  const logoUrl = currentOrganization?.logoUrl;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 sticky top-0 z-10 transition-colors duration-300" style={{ backgroundColor: showAdminPanel ? '#ffffff' : primaryColor }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {logoUrl && !showAdminPanel ? (
                    <div className="bg-white p-1 rounded-lg shadow-sm">
                        <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                    </div>
                ) : (
                    <div className={`p-2 rounded-lg text-white ${showAdminPanel ? 'bg-indigo-600' : 'bg-white/20'}`}>
                        {showAdminPanel ? <Shield className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                    </div>
                )}
                <div>
                    <h1 className={`text-xl font-bold tracking-tight ${showAdminPanel ? 'text-slate-900' : 'text-white'}`}>
                        {showAdminPanel ? 'Administração' : 'Gerador de Horários'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <p className={`text-xs font-medium ${showAdminPanel ? 'text-slate-500' : 'text-blue-100'}`}>{currentUser.name} • {currentUser.organization}</p>
                        {!showAdminPanel && (
                            <>
                                <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                <p className="text-xs text-emerald-200 font-medium flex items-center gap-1">
                                    <Save className="w-3 h-3" /> Salvo
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {!showAdminPanel && (
                  <>
                    {schedule && (
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            className="text-xs font-bold px-3 py-2 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                            title="Salvar Horário Atual"
                        >
                            <Save className="w-4 h-4" /> Salvar Horário
                        </button>
                    )}
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="text-xs font-bold px-3 py-2 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        title="Ver horários salvos"
                    >
                        <FileClock className="w-4 h-4" /> Histórico
                    </button>
                  </>
                )}

                {currentUser.role === 'admin' && (
                    <button
                        onClick={() => setShowAdminPanel(!showAdminPanel)}
                        className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                            showAdminPanel 
                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' 
                            : 'bg-white/20 text-white border-white/20 hover:bg-white/30'
                        }`}
                    >
                        {showAdminPanel ? (
                            <>
                                <LayoutDashboard className="w-4 h-4" /> Ir para o App
                            </>
                        ) : (
                             <>
                                <Shield className="w-4 h-4" /> Gerenciar Usuários
                            </>
                        )}
                    </button>
                )}

                <button 
                    onClick={handleLogout}
                    className={`transition-colors p-2 rounded-md flex items-center gap-2 text-sm ${
                        showAdminPanel ? 'text-slate-400 hover:text-red-500 hover:bg-slate-100' : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    title="Sair"
                >
                    <span className="hidden sm:inline">Sair</span>
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        
        {showAdminPanel ? (
            <AdminDashboard onConfigChange={() => refreshOrganization(currentUser.organizationId)} />
        ) : (
            <div className="px-4 py-8 animate-fade-in">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 animate-fade-in">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {!schedule ? (
                    <>
                        <div className="mb-8 text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Crie horários escolares perfeitos</h2>
                            <p className="text-slate-600">
                                Organize professores, turmas e disciplinas para {currentOrganization?.name || currentUser.organization}. A IA gera uma grade sem conflitos em segundos.
                            </p>
                        </div>

                        <InputSection 
                            teachers={teachers}
                            setTeachers={setTeachers}
                            classes={classes}
                            setClasses={setClasses}
                            curriculum={curriculum}
                            setCurriculum={setCurriculum}
                            settings={classSettings}
                            onSaveSettings={setClassSettings}
                        />

                        <div className="mt-10 sticky bottom-6 z-20 flex justify-center">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                style={{ backgroundColor: isGenerating ? undefined : primaryColor }}
                                className={`
                                    group relative flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-all transform hover:-translate-y-1 text-white
                                    ${isGenerating ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'hover:shadow-lg'}
                                `}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Gerando Horário...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                        Gerar Horário
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <ScheduleView 
                        scheduleData={schedule} 
                        classes={classes}
                        onReset={() => { setSchedule(null); setCurrentScheduleName(undefined); }}
                        onUpdateSchedule={handleScheduleUpdate}
                        onSaveRequest={() => setIsSaveModalOpen(true)}
                        scheduleName={currentScheduleName}
                    />
                )}
            </div>
        )}
      </main>

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        schedules={savedSchedules}
        onLoad={handleLoadFromHistory}
        onDelete={handleDeleteFromHistory}
      />

      <SaveScheduleModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveToHistory}
        initialName={currentScheduleName || "Novo Horário"}
      />
    </div>
  );
};

export default App;