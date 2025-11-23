import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Teacher, ClassGroup, CurriculumItem, GeneratedSchedule, DAYS_OF_WEEK } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const scheduleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, enum: DAYS_OF_WEEK },
          period: { type: Type.INTEGER, description: "Period number (1-based index)" },
          classId: { type: Type.STRING },
          subject: { type: Type.STRING },
          teacherName: { type: Type.STRING }
        },
        required: ["day", "period", "classId", "subject", "teacherName"]
      }
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: "Any warnings or notes about the generation" }
      }
    }
  },
  required: ["schedule"]
};

/**
 * Validates if the requirements are mathematically possible before asking AI.
 * Optimized with Maps for O(1) lookups.
 */
const validateInputs = (teachers: Teacher[], classes: ClassGroup[], curriculum: CurriculumItem[]) => {
  const errors: string[] = [];

  // --- PRE-INDEXING DATA (Performance Optimization) ---
  const classesById = new Map<string, ClassGroup>();
  classes.forEach(c => classesById.set(c.id, c));

  const curriculumByClass = new Map<string, CurriculumItem[]>();
  const curriculumByTeacher = new Map<string, CurriculumItem[]>();

  curriculum.forEach(item => {
    // Group by Class
    const classList = curriculumByClass.get(item.classId) || [];
    classList.push(item);
    curriculumByClass.set(item.classId, classList);

    // Group by Teacher
    const teacherList = curriculumByTeacher.get(item.teacherId) || [];
    teacherList.push(item);
    curriculumByTeacher.set(item.teacherId, teacherList);
  });

  // 1. Check Class Capacity vs Demand
  classes.forEach(cls => {
    // Calculate total available slots for this class
    const totalSlots = Object.values(cls.periodsPerDay).reduce((sum, periods) => sum + periods, 0);
    
    // Get items from Map (O(1)) instead of .filter (O(N))
    const classItems = curriculumByClass.get(cls.id) || [];
    const requiredLessons = classItems.reduce((sum, c) => sum + c.lessonsPerWeek, 0);

    if (requiredLessons > totalSlots) {
      errors.push(`ERRO NA TURMA '${cls.name}': Você adicionou ${requiredLessons} aulas, mas a semana só tem ${totalSlots} horários disponíveis (soma dos períodos configurados).`);
    }
  });

  // 2. Check Teacher Constraints
  teachers.forEach(teacher => {
    const teacherItems = curriculumByTeacher.get(teacher.id);
    if (!teacherItems || teacherItems.length === 0) return;

    // Group items by Shift to analyze capacity contextually
    const shiftGroups = new Map<string, CurriculumItem[]>();
    
    teacherItems.forEach(item => {
        const cls = classesById.get(item.classId);
        if (cls) {
            const list = shiftGroups.get(cls.shift) || [];
            list.push(item);
            shiftGroups.set(cls.shift, list);
        }
    });

    shiftGroups.forEach((itemsInShift, shift) => {
        // A. Check Shift Availability
        if (!teacher.availableShifts.includes(shift)) {
             errors.push(`ERRO DE DISPONIBILIDADE: O professor '${teacher.name}' tem aulas atribuídas no turno '${shift}', mas não marcou disponibilidade para este turno.`);
             return; 
        }

        // Calculate Total Demand (Lessons assigned)
        const totalLessonsAssigned = itemsInShift.reduce((sum, i) => sum + i.lessonsPerWeek, 0);

        // Calculate Real Physical Capacity
        // Get classes in this shift involved with this teacher to check period limits
        // We look at ALL classes in this shift to determine the "School Structure" for that shift
        // Optimization: Filter classes once per shift logic check
        // However, since classes array is usually small (<50), filter is acceptable here, 
        // but we can optimize by checking the specific class limits.
        
        // Better logic: The teacher's capacity is defined by the DAYS they work.
        // On "Monday", if the school runs 5 periods in the morning, the teacher has 5 slots.
        let totalCapacitySlots = 0;

        teacher.availableDays.forEach(day => {
            // We need to know the MAX periods offered by the school in this shift on this day.
            // Instead of iterating all classes, let's look at the classes the teacher is actually assigned to first,
            // or generally assume the max structure of the assigned classes.
            let maxPeriodsOnDay = 0;
            
            // Optimization: Only check classes this teacher is actually teaching in this shift
            itemsInShift.forEach(item => {
                const cls = classesById.get(item.classId);
                if (cls && cls.periodsPerDay[day]) {
                    maxPeriodsOnDay = Math.max(maxPeriodsOnDay, cls.periodsPerDay[day]);
                }
            });
            
            // Fallback: If assigned classes don't define it well, assume 5 (or check all classes in shift if needed)
            if (maxPeriodsOnDay === 0) maxPeriodsOnDay = 5; 

            totalCapacitySlots += maxPeriodsOnDay;
        });

        // B. Check Overload
        if (totalLessonsAssigned > totalCapacitySlots) {
            errors.push(
                `ERRO DE SOBRECARGA (${shift}): O professor '${teacher.name}' tem ${totalLessonsAssigned} aulas atribuídas, mas baseando-se nos seus dias disponíveis (${teacher.availableDays.length} dias: ${teacher.availableDays.join(', ')}) e na grade horária das turmas, ele só possui capacidade para aprox. ${totalCapacitySlots} aulas.`
            );
        }

        // C. Check Single Subject Density (Impossible squeeze)
        itemsInShift.forEach(item => {
            const cls = classesById.get(item.classId);
            if (!cls) return;

            // Calculate max capacity just for the days this teacher is available for this specific class
            let maxPossibleLessons = 0;
            teacher.availableDays.forEach(day => {
                maxPossibleLessons += (cls.periodsPerDay[day] || 0);
            });

            if (item.lessonsPerWeek > maxPossibleLessons) {
                 errors.push(
                    `ERRO DE ALOCAÇÃO: A disciplina '${item.subjectName}' exige ${item.lessonsPerWeek} aulas, mas o professor '${teacher.name}' não tem dias/horários suficientes disponíveis compatíveis com a turma '${cls.name}' (Máximo possível: ${maxPossibleLessons}).`
                );
            }
        });
    });
  });

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
};

export const generateSchedule = async (
  teachers: Teacher[],
  classes: ClassGroup[],
  curriculum: CurriculumItem[]
): Promise<GeneratedSchedule> => {
  
  // STEP 1: Validate mathematically before calling AI
  validateInputs(teachers, classes, curriculum);

  // Prepare data for the prompt
  const resources = {
    teachers: teachers.map(t => ({ 
        id: t.id, 
        name: t.name,
        availableDays: t.availableDays,
        availableShifts: t.availableShifts
    })),
    classes: classes.map(c => ({ 
      id: c.id, 
      name: c.name, 
      shift: c.shift,
      periodsPerDay: c.periodsPerDay
    })),
    requirements: curriculum.map(c => {
      const teacher = teachers.find(t => t.id === c.teacherId);
      return {
        classId: c.classId,
        subject: c.subjectName,
        teacherId: c.teacherId,
        teacherName: teacher ? teacher.name : "Unknown",
        count: c.lessonsPerWeek
      };
    })
  };

  const prompt = `
    You are a highly intelligent school scheduler. Your task is to generate a weekly class schedule (timetable) based on the provided resources and requirements.

    Constraint 1: The week has 5 days: ${DAYS_OF_WEEK.join(', ')}.
    Constraint 2: 'periodsPerDay' defines the maximum period index for each specific day. Do not schedule a lesson for a class on [Day] if the period number is greater than periodsPerDay[Day].
    Constraint 3: NO CONFLICTS allowed. A teacher cannot teach two different classes at the same [Day, Period]. A class cannot have two subjects at the same [Day, Period].
    Constraint 4: Fulfill the "count" of lessons per week for each requirement as closely as possible.
    Constraint 5: Respect the class shift. If a class is "Morning", all its lessons must happen in the Morning (you cannot schedule a Morning class to have a lesson in the afternoon).
    Constraint 6: Respect TEACHER AVAILABILITY. A teacher can ONLY be scheduled for a lesson if:
        a) The [Day] is listed in the teacher's 'availableDays'.
        b) The shift of the class matches one of the teacher's 'availableShifts'.

    Input Data:
    ${JSON.stringify(resources, null, 2)}

    Return a clean JSON object following the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
        temperature: 0.2, 
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedSchedule;
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw error;
  }
};