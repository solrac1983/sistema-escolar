import React, { useState, useMemo, useRef } from 'react';
import { GeneratedSchedule, ClassGroup, DAYS_OF_WEEK, ScheduleSlot } from '../types';
import { Download, ChevronLeft, Move, AlertCircle, FileText, Save, Calculator, Loader2 } from 'lucide-react';
import * as d3 from 'd3';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface ScheduleViewProps {
  scheduleData: GeneratedSchedule;
  classes: ClassGroup[];
  onReset: () => void;
  onUpdateSchedule: (newSchedule: GeneratedSchedule) => void;
  onSaveRequest: () => void;
  scheduleName?: string;
}

interface DragData {
    day: string;
    period: number;
    classId: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ 
    scheduleData, 
    classes, 
    onReset, 
    onUpdateSchedule,
    onSaveRequest,
    scheduleName
}) => {
  const [activeClassId, setActiveClassId] = useState<string>(classes[0]?.id || '');
  const [draggedSlot, setDraggedSlot] = useState<DragData | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const activeClass = classes.find(c => c.id === activeClassId);

  // --- PERFORMANCE OPTIMIZATION ---
  const scheduleMap = useMemo(() => {
      const map = new Map<string, ScheduleSlot>();
      scheduleData.schedule.forEach(slot => {
          map.set(`${slot.classId}-${slot.day}-${slot.period}`, slot);
      });
      return map;
  }, [scheduleData]);

  const getSlotData = (day: string, period: number) => {
    return scheduleMap.get(`${activeClassId}-${day}-${period}`);
  };

  // Calculate Summary Data
  const summaryData = useMemo(() => {
      if (!activeClassId) return { items: [], total: 0 };
      
      const classSlots = scheduleData.schedule.filter(s => s.classId === activeClassId);
      const counts: Record<string, number> = {};
      
      classSlots.forEach(slot => {
          counts[slot.subject] = (counts[slot.subject] || 0) + 1;
      });

      const items = Object.entries(counts)
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => a.subject.localeCompare(b.subject));
      
      const total = items.reduce((acc, item) => acc + item.count, 0);

      return { items, total };
  }, [scheduleData, activeClassId]);

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\ufeff";
    
    classes.forEach(cls => {
        csvContent += `TURMA: ${cls.name} (${cls.shift})\n`;
        csvContent += "Período," + DAYS_OF_WEEK.join(",") + "\n";

        const maxPeriods = Math.max(...Object.values(cls.periodsPerDay));

        for (let period = 1; period <= maxPeriods; period++) {
            let row = `${period}º Aula`;
            DAYS_OF_WEEK.forEach(day => {
                const slot = scheduleData.schedule.find(s => 
                    s.classId === cls.id && s.day === day && s.period === period
                );
                if (slot) {
                    const cellContent = `${slot.subject} (${slot.teacherName})`;
                    row += `,"${cellContent.replace(/"/g, '""')}"`;
                } else {
                    const limitForDay = cls.periodsPerDay[day] || 0;
                    row += period <= limitForDay ? `,"-"` : `,""`;
                }
            });
            csvContent += row + "\n";
        }
        csvContent += "\n\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `horario_escolar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !activeClass) return;
    setIsExporting(true);

    try {
        // Wait for UI to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(printRef.current, {
            scale: 2, // Retina quality
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            // Ensure we capture the full scroll width if needed, though container is usually tailored
            windowWidth: printRef.current.scrollWidth + 50
        });

        const imgData = canvas.toDataURL('image/png');
        
        // A4 Landscape
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        
        // Calculate ratios to fit page while maintaining aspect ratio
        const widthRatio = (pdfWidth - 20) / imgProps.width; // 10mm margin
        const heightRatio = (pdfHeight - 20) / imgProps.height;
        const ratio = Math.min(widthRatio, heightRatio);
        
        const w = imgProps.width * ratio;
        const h = imgProps.height * ratio;
        
        // Center on page
        const x = (pdfWidth - w) / 2;
        const y = (pdfHeight - h) / 2;

        pdf.addImage(imgData, 'PNG', x, y, w, h);
        pdf.save(`Horario_${activeClass.name.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Tente novamente ou use a impressão do navegador.");
    } finally {
        setIsExporting(false);
    }
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, day: string, period: number) => {
      if (!activeClassId) return;
      const slot = getSlotData(day, period);
      if (!slot) {
          e.preventDefault();
          return;
      }
      setDraggedSlot({ day, period, classId: activeClassId });
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetPeriod: number) => {
      e.preventDefault();
      setDropError(null);

      if (!draggedSlot || !activeClass) return;

      if (draggedSlot.day === targetDay && draggedSlot.period === targetPeriod) {
          setDraggedSlot(null);
          return;
      }

      const fullSchedule = [...scheduleData.schedule];
      const sourceSlotIndex = fullSchedule.findIndex(s => 
          s.classId === draggedSlot.classId && 
          s.day === draggedSlot.day && 
          s.period === draggedSlot.period
      );

      if (sourceSlotIndex === -1) return; 
      const sourceSlot = fullSchedule[sourceSlotIndex];

      const targetSlotIndex = fullSchedule.findIndex(s => 
          s.classId === activeClassId && 
          s.day === targetDay && 
          s.period === targetPeriod
      );
      const targetSlot = targetSlotIndex !== -1 ? fullSchedule[targetSlotIndex] : null;

      // VALIDATION
      const sourceTeacherBusy = fullSchedule.find(s => 
          s.classId !== activeClassId && 
          s.day === targetDay &&
          s.period === targetPeriod &&
          s.teacherName === sourceSlot.teacherName
      );

      if (sourceTeacherBusy) {
          const conflictingClass = classes.find(c => c.id === sourceTeacherBusy.classId)?.name || 'Outra turma';
          setDropError(`Conflito! ${sourceSlot.teacherName} já está dando aula na turma ${conflictingClass} neste horário.`);
          setDraggedSlot(null);
          return;
      }

      if (targetSlot) {
          const targetTeacherBusy = fullSchedule.find(s => 
              s.classId !== activeClassId &&
              s.day === draggedSlot.day &&
              s.period === draggedSlot.period &&
              s.teacherName === targetSlot.teacherName
          );

          if (targetTeacherBusy) {
              const conflictingClass = classes.find(c => c.id === targetTeacherBusy.classId)?.name || 'Outra turma';
              setDropError(`Conflito na troca! ${targetSlot.teacherName} já está dando aula na turma ${conflictingClass} no horário de origem.`);
              setDraggedSlot(null);
              return;
          }
      }

      fullSchedule[sourceSlotIndex] = { ...sourceSlot, day: targetDay, period: targetPeriod };
      if (targetSlot) {
          fullSchedule[targetSlotIndex] = { ...targetSlot, day: draggedSlot.day, period: draggedSlot.period };
      }

      onUpdateSchedule({ ...scheduleData, schedule: fullSchedule });
      setDraggedSlot(null);
  };

  if (!activeClass) return <div>Erro: Turma não encontrada.</div>;

  const maxPeriods = Math.max(...(Object.values(activeClass.periodsPerDay) as number[]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center no-print">
        <button 
            onClick={onReset}
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
        >
            <ChevronLeft className="w-5 h-5 mr-1" /> Voltar para Edição
        </button>
        
        <div className="flex gap-2 items-center">
             {dropError && (
                <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    {dropError}
                    <button onClick={() => setDropError(null)} className="ml-2 font-bold">X</button>
                </div>
            )}
             <button 
                onClick={onSaveRequest}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium border border-emerald-200"
            >
                <Save className="w-4 h-4" /> Salvar no Histórico
            </button>
            <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-200 ${isExporting ? 'opacity-70 cursor-wait' : ''}`}
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
            </button>
            <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
            >
                <Download className="w-4 h-4" /> Exportar CSV
            </button>
        </div>
      </div>

      {/* Main Content to Capture */}
      <div ref={printRef} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print-container">
        {/* Header visible only in Print/PDF usually, but we need it here for capture */}
        <div className="p-6 border-b border-slate-100 text-center bg-slate-50/50">
            <h1 className="text-2xl font-bold text-slate-800">{scheduleName || "Horário Escolar"}</h1>
            <p className="text-slate-500 text-sm font-medium">{activeClass.name} - {activeClass.shift}</p>
        </div>

        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print" data-html2canvas-ignore>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Visualização</h2>
                <p className="text-sm text-slate-500">Selecione a turma abaixo para visualizar</p>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                {classes.map(c => (
                    <button
                        key={c.id}
                        onClick={() => { setActiveClassId(c.id); setDropError(null); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                            activeClassId === c.id 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="p-6">
            <div className="overflow-x-auto mb-6">
                <div className="min-w-[600px]">
                    {/* Simplified Header for PDF Context */}
                    <div className="mb-4 text-center">
                        <h3 className="text-xl font-bold text-slate-800">{activeClass.name} <span className="text-slate-400 text-base font-normal">({activeClass.shift})</span></h3>
                    </div>
                    
                    <div className="grid grid-cols-6 gap-2 text-sm">
                        {/* Header Row */}
                        <div className="p-3 bg-slate-100 text-slate-500 font-semibold text-center rounded-lg text-xs uppercase tracking-wider flex items-center justify-center border border-slate-200">
                            Período
                        </div>
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="p-3 bg-slate-100 text-slate-700 font-bold text-center rounded-lg shadow-sm border border-slate-200">
                                {day}
                            </div>
                        ))}

                        {/* Grid Rows */}
                        {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(period => (
                            <React.Fragment key={period}>
                                <div className="p-4 bg-slate-50 text-slate-400 font-bold text-center rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                                    {period}º
                                </div>

                                {DAYS_OF_WEEK.map(day => {
                                    const limitForDay = activeClass.periodsPerDay[day];
                                    const isSlotAvailable = period <= limitForDay;
                                    const slot = getSlotData(day, period);
                                    const isDraggingThis = draggedSlot?.day === day && draggedSlot?.period === period;

                                    if (!isSlotAvailable) {
                                        return (
                                            <div key={`${day}-${period}`} className="bg-slate-50 border border-slate-100 rounded-lg relative overflow-hidden opacity-50">
                                                <div className="absolute inset-0 opacity-[0.03] bg-slate-900" 
                                                     style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '8px 8px' }} 
                                                />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div 
                                            key={`${day}-${period}`} 
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, day, period)}
                                            className={`
                                                relative p-3 rounded-lg border min-h-[100px] flex flex-col justify-center items-center text-center transition-all duration-200
                                                ${slot ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 border-dashed'}
                                                ${isDraggingThis ? 'opacity-30 scale-95' : 'opacity-100'}
                                                ${!isExporting && slot ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-md' : ''}
                                                ${draggedSlot && !isDraggingThis ? 'hover:border-blue-400 hover:bg-blue-50' : ''}
                                            `}
                                            draggable={!!slot && !isExporting}
                                            onDragStart={(e) => handleDragStart(e, day, period)}
                                            style={slot ? { borderLeft: `4px solid ${colorScale(slot.subject)}` } : {}}
                                        >
                                            {slot ? (
                                                <>
                                                    <span className="font-bold text-slate-800 text-sm pointer-events-none">{slot.subject}</span>
                                                    <span className="text-xs text-slate-500 mt-1 pointer-events-none">{slot.teacherName}</span>
                                                    {!isExporting && (
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 no-print">
                                                            <Move className="w-3 h-3 text-slate-300" />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-200 text-xs italic pointer-events-none">
                                                    {draggedSlot ? 'Solte aqui' : 'Livre'}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Table */}
            <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-800">Resumo da Carga Horária Semanal</h3>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm w-full md:w-2/3 lg:w-1/2">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Disciplina</th>
                                <th className="px-4 py-3 text-center w-32">Qtd. Aulas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {summaryData.items.length === 0 ? (
                                <tr><td colSpan={2} className="px-4 py-3 text-center text-slate-400 italic">Nenhuma aula alocada.</td></tr>
                            ) : (
                                summaryData.items.map(({ subject, count }) => (
                                    <tr key={subject}>
                                        <td className="px-4 py-2 text-slate-800 border-l-4" style={{ borderLeftColor: colorScale(subject) }}>{subject}</td>
                                        <td className="px-4 py-2 text-center font-medium text-slate-600">{count}</td>
                                    </tr>
                                ))
                            )}
                            <tr className="bg-slate-50 font-bold">
                                <td className="px-4 py-3 text-slate-800 text-right uppercase text-xs tracking-wider">Total Geral:</td>
                                <td className="px-4 py-3 text-center text-indigo-600 text-base">{summaryData.total}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {scheduleData.metadata?.message && (
                <div className="bg-amber-50 text-amber-800 px-6 py-3 text-sm border-t border-amber-100 mt-6 rounded-lg">
                    Nota: {scheduleData.metadata.message}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};