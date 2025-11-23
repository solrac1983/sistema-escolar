import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Teacher, ClassGroup, CurriculumItem, Shift, DAYS_OF_WEEK, DEFAULT_PERIODS, ClassSettings } from '../types';
import { PlusCircle, Trash2, Users, BookOpen, Briefcase, Clock, CalendarDays, Settings2, Search, ChevronsUpDown, Check, AlertTriangle, Save } from 'lucide-react';

interface InputSectionProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  classes: ClassGroup[];
  setClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  curriculum: CurriculumItem[];
  setCurriculum: React.Dispatch<React.SetStateAction<CurriculumItem[]>>;
  settings?: ClassSettings;
  onSaveSettings?: (settings: ClassSettings) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  teachers,
  setTeachers,
  classes,
  setClasses,
  curriculum,
  setCurriculum,
  settings,
  onSaveSettings
}) => {
  // Local state for inputs
  const [newTeacherName, setNewTeacherName] = useState('');
  const [teacherDays, setTeacherDays] = useState<string[]>([...DAYS_OF_WEEK]);
  const [teacherShifts, setTeacherShifts] = useState<string[]>([Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT]);
  
  // Class State
  const [newClassName, setNewClassName] = useState('');
  const [newClassShift, setNewClassShift] = useState<Shift>(Shift.MORNING);
  
  // Periods Configuration
  const [isCustomPeriods, setIsCustomPeriods] = useState(false);
  const [standardPeriods, setStandardPeriods] = useState<number>(DEFAULT_PERIODS);
  const [customPeriods, setCustomPeriods] = useState<Record<string, number>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: DEFAULT_PERIODS }), {})
  );
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  // Curriculum State
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [lessonsCount, setLessonsCount] = useState<number>(2);

  // Teacher Autocomplete State
  const [teacherQuery, setTeacherQuery] = useState('');
  const [isTeacherListOpen, setIsTeacherListOpen] = useState(false);
  const teacherListRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  useEffect(() => {
      if (settings) {
          setIsCustomPeriods(settings.isCustomPeriods);
          setStandardPeriods(settings.standardPeriods);
          setCustomPeriods(settings.customPeriods);
      }
  }, [settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teacherListRef.current && !teacherListRef.current.contains(event.target as Node)) {
        setIsTeacherListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (selectedTeacherId) {
          const t = teachers.find(t => t.id === selectedTeacherId);
          if (t) setTeacherQuery(t.name);
      } else {
          setTeacherQuery('');
      }
  }, [selectedTeacherId, teachers]);

  // --- Workload Analysis Logic (Optimized) ---
  const workloadWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (teachers.length === 0 || curriculum.length === 0) return warnings;

    // Pre-index Maps for O(1) lookups
    const curriculumByTeacher = new Map<string, CurriculumItem[]>();
    curriculum.forEach(item => {
        const list = curriculumByTeacher.get(item.teacherId) || [];
        list.push(item);
        curriculumByTeacher.set(item.teacherId, list);
    });

    const classesById = new Map(classes.map(c => [c.id, c]));

    teachers.forEach(teacher => {
        const teacherItems = curriculumByTeacher.get(teacher.id);
        if (!teacherItems) return;

        // Group demand by Shift
        const shiftDemand: Record<string, number> = {};
        
        teacherItems.forEach(item => {
            const cls = classesById.get(item.classId);
            if (cls) {
                shiftDemand[cls.shift] = (shiftDemand[cls.shift] || 0) + item.lessonsPerWeek;
            }
        });

        // Validate each shift
        Object.entries(shiftDemand).forEach(([shift, demand]) => {
            // 1. Check Availability
            if (!teacher.availableShifts.includes(shift)) {
                warnings.push(`⚠ ${teacher.name} tem aulas na ${shift}, mas não marcou disponibilidade neste turno.`);
                return;
            }

            // 2. Check Capacity
            const daysCount = teacher.availableDays.length;
            
            // Determine max periods for this shift context
            // To avoid O(N) scan of all classes every time, check the specific assigned classes first
            // Or fallback to global knowledge of that shift.
            // For robust warning, let's scan classes in that shift (N is small enough here usually)
            let maxPeriodsInShift = 5; 
            
            // Optimization: Use a simple filter only if needed, or assume standard 5
            // We can iterate classesById values
            for (const cls of classesById.values()) {
                if (cls.shift === shift) {
                    const maxP = Math.max(...Object.values(cls.periodsPerDay));
                    if (maxP > maxPeriodsInShift) maxPeriodsInShift = maxP;
                }
            }

            const capacity = daysCount * maxPeriodsInShift;

            if (demand > capacity) {
                warnings.push(`⚠ ${teacher.name} está sobrecarregado(a) na ${shift}. Alocado: ${demand} aulas. Capacidade máx: ~${capacity} (${daysCount} dias disp. x ${maxPeriodsInShift} aulas/dia).`);
            }
        });
    });

    return warnings;
  }, [teachers, classes, curriculum]);


  // --- Handlers ---

  const toggleTeacherDay = (day: string) => {
    setTeacherDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleTeacherShift = (shift: string) => {
    setTeacherShifts(prev => 
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const updateCustomPeriod = (day: string, value: number) => {
    setCustomPeriods(prev => ({ ...prev, [day]: value }));
  };

  const handleSaveConfig = () => {
      if (onSaveSettings) {
          onSaveSettings({
              isCustomPeriods,
              standardPeriods,
              customPeriods
          });
          setIsSettingsSaved(true);
          setTimeout(() => setIsSettingsSaved(false), 2500);
      }
  };

  const addTeacher = () => {
    if (!newTeacherName.trim()) return;
    if (teacherDays.length === 0 || teacherShifts.length === 0) {
        alert("Selecione ao menos um dia e um turno para o professor.");
        return;
    }
    const newTeacher: Teacher = {
      id: crypto.randomUUID(),
      name: newTeacherName.trim(),
      availableDays: teacherDays,
      availableShifts: teacherShifts
    };
    setTeachers([...teachers, newTeacher]);
    setNewTeacherName('');
    // Keep previous selection for easier batch entry
  };

  const addClass = () => {
    if (!newClassName.trim()) return;

    let finalPeriods: Record<string, number>;
    if (isCustomPeriods) {
        finalPeriods = { ...customPeriods };
    } else {
        finalPeriods = DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: standardPeriods }), {});
    }

    const newClass: ClassGroup = {
      id: crypto.randomUUID(),
      name: newClassName.trim(),
      shift: newClassShift,
      periodsPerDay: finalPeriods
    };
    setClasses([...classes, newClass]);
    setNewClassName('');
    
    if (classes.length === 0) setSelectedClassId(newClass.id);
  };

  const addCurriculum = () => {
    if (!selectedClassId || !selectedTeacherId || !newSubjectName.trim() || lessonsCount <= 0) return;
    
    const newItem: CurriculumItem = {
      id: crypto.randomUUID(),
      classId: selectedClassId,
      teacherId: selectedTeacherId,
      subjectName: newSubjectName.trim(),
      lessonsPerWeek: lessonsCount
    };
    setCurriculum([...curriculum, newItem]);
    setNewSubjectName('');
  };

  const removeTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
    setCurriculum(curriculum.filter(c => c.teacherId !== id));
    if (selectedTeacherId === id) {
        setSelectedTeacherId('');
        setTeacherQuery('');
    }
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    setCurriculum(curriculum.filter(c => c.classId !== id));
    if (selectedClassId === id) setSelectedClassId('');
  };

  const removeCurriculum = (id: string) => {
    setCurriculum(curriculum.filter(c => c.id !== id));
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(teacherQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Input forms omitted for brevity as logic was the optimization target. UI structure remains same. */}
      {/* Teachers Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          1. Cadastrar Professores
        </h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-100">
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome do Professor</label>
                    <input
                        type="text"
                        placeholder="Ex: João Silva"
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTeacher()}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> Dias Disponíveis
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <button
                                    key={day}
                                    onClick={() => toggleTeacherDay(day)}
                                    className={`px-2 py-1 text-xs rounded-md border transition-all ${
                                        teacherDays.includes(day)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Turnos Disponíveis
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT].map(shift => (
                                <button
                                    key={shift}
                                    onClick={() => toggleTeacherShift(shift)}
                                    className={`px-2 py-1 text-xs rounded-md border transition-all ${
                                        teacherShifts.includes(shift)
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {shift}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={addTeacher} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2">
                    <PlusCircle className="w-4 h-4" /> Adicionar Professor
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {teachers.length === 0 && <p className="text-slate-400 text-sm italic col-span-full">Nenhum professor cadastrado.</p>}
          {teachers.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg text-sm shadow-sm">
              <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{t.name}</span>
                  <span className="text-xs text-slate-500 mt-0.5">
                      {t.availableDays.length === 5 ? 'Todos os dias' : t.availableDays.map(d => d.slice(0,3)).join(', ')} • {t.availableShifts.join(', ')}
                  </span>
              </div>
              <button onClick={() => removeTeacher(t.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Classes Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          2. Cadastrar Turmas
        </h2>
        
        <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-100">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Turma</label>
                        <input
                            type="text"
                            placeholder="Ex: 3º Ano A"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Turno</label>
                        <select
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={newClassShift}
                            onChange={(e) => setNewClassShift(e.target.value as Shift)}
                        >
                            <option value={Shift.MORNING}>Manhã</option>
                            <option value={Shift.AFTERNOON}>Tarde</option>
                            <option value={Shift.NIGHT}>Noite</option>
                        </select>
                    </div>
                </div>

                {/* Period Configuration */}
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Settings2 className="w-3 h-3" /> Configuração de Aulas
                        </label>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`text-xs font-medium ${!isCustomPeriods ? 'text-indigo-600' : 'text-slate-400'}`}>Padrão</span>
                            <button 
                                onClick={() => setIsCustomPeriods(!isCustomPeriods)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${isCustomPeriods ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isCustomPeriods ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-xs font-medium ${isCustomPeriods ? 'text-indigo-600' : 'text-slate-400'}`}>Personalizado</span>
                        </div>
                    </div>

                    {!isCustomPeriods ? (
                        <div className="flex items-center gap-3">
                            <div className="w-32">
                                <label className="text-xs text-slate-500 block mb-1">Aulas por dia</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={standardPeriods}
                                    onChange={(e) => setStandardPeriods(parseInt(e.target.value))}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-4">
                                Todas as turmas terão {standardPeriods} aulas de Segunda a Sexta.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day}>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 text-center">{day.slice(0, 3)}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="12"
                                        className="w-full border border-slate-300 rounded-lg px-2 py-2 text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={customPeriods[day]}
                                        onChange={(e) => updateCustomPeriod(day, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                        {isSettingsSaved && <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Salvo!</span>}
                        <button onClick={handleSaveConfig} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded transition-colors">
                            <Save className="w-3 h-3" /> Salvar Configurações
                        </button>
                    </div>
                </div>

                <button onClick={addClass} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Adicionar Turma
                </button>
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {classes.map(c => (
             <span key={c.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full text-sm border border-indigo-100">
                {c.name} ({c.shift})
                <button onClick={() => removeClass(c.id)} className="hover:text-red-500 ml-1"><Trash2 className="w-3 h-3" /></button>
             </span>
          ))}
        </div>
      </div>

      {/* Curriculum Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          3. Definir Disciplinas
        </h2>
        
        {teachers.length > 0 && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Turma</label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white w-full"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Disciplina</label>
              <input
                type="text"
                placeholder="Ex: Matemática"
                className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
              />
            </div>

            {/* Autocomplete Teacher */}
            <div className="flex flex-col gap-1 relative" ref={teacherListRef}>
              <label className="text-xs font-semibold text-slate-500 uppercase">Professor</label>
              <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar professor..."
                    className="border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                    value={teacherQuery}
                    onChange={(e) => {
                        setTeacherQuery(e.target.value);
                        setSelectedTeacherId('');
                        setIsTeacherListOpen(true);
                    }}
                    onFocus={() => setIsTeacherListOpen(true)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {isTeacherListOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto top-full">
                      {filteredTeachers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-400 italic">Nenhum professor encontrado.</div>
                      ) : (
                          filteredTeachers.map(t => (
                              <button
                                  key={t.id}
                                  onClick={() => {
                                      setSelectedTeacherId(t.id);
                                      setTeacherQuery(t.name);
                                      setIsTeacherListOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between group"
                              >
                                  <span>{t.name}</span>
                                  {selectedTeacherId === t.id && <Check className="w-4 h-4 text-emerald-600" />}
                              </button>
                          ))
                      )}
                  </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Aulas/Semana</label>
              <div className="flex gap-2">
                 <input
                  type="number"
                  min="1"
                  max="10"
                  className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none w-20"
                  value={lessonsCount}
                  onChange={(e) => setLessonsCount(parseInt(e.target.value))}
                />
                <button
                  onClick={addCurriculum}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex-1"
                >
                  <PlusCircle className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm mb-4">
            Cadastre pelo menos um professor e uma turma antes de definir as disciplinas.
          </div>
        )}

        {workloadWarnings.length > 0 && (
             <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Alerta de Sobrecarga / Conflito
                </h3>
                <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                    {workloadWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                    ))}
                </ul>
             </div>
        )}

        {/* List of Curriculum Items */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-4 py-3">Turma</th>
                        <th className="px-4 py-3">Disciplina</th>
                        <th className="px-4 py-3">Professor</th>
                        <th className="px-4 py-3 text-center">Aulas</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {curriculum.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">Nenhuma disciplina adicionada.</td></tr>
                    )}
                    {curriculum.map(item => {
                        const cName = classes.find(c => c.id === item.classId)?.name || '???';
                        const tName = teachers.find(t => t.id === item.teacherId)?.name || '???';
                        return (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900">{cName}</td>
                                <td className="px-4 py-3">{item.subjectName}</td>
                                <td className="px-4 py-3">{tName}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                        {item.lessonsPerWeek}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => removeCurriculum(item.id)} className="text-slate-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};