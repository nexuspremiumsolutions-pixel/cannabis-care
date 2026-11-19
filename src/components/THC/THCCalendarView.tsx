import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  ShieldCheck,
  HeartHandshake,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DayCalendarItem } from '../../../backend/services/thcAnalyticsService';

interface THCCalendarViewProps {
  token: string | null;
  onOpenNewEntry: () => void;
  onOpenCravingModal: () => void;
}

export const THCCalendarView: React.FC<THCCalendarViewProps> = ({
  token,
  onOpenNewEntry,
  onOpenCravingModal,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<DayCalendarItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayCalendarItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const fetchCalendar = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/thc-journey/calendar?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data.calendar || []);
        // Auto select today or first day
        const todayItem = (data.calendar || []).find((d: DayCalendarItem) => d.isToday);
        setSelectedDay(todayItem || (data.calendar && data.calendar[0]) || null);
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [token, year, month]);

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  // Day status styling helper
  const getDayStatusStyle = (day: DayCalendarItem) => {
    if (day.isFuture) {
      return 'bg-slate-50 text-slate-400 border-dashed border-slate-200 cursor-default';
    }

    switch (day.status) {
      case 'thc_free_day':
        return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 ring-emerald-500/20';
      case 'goal_achieved':
        return 'bg-teal-50 hover:bg-teal-100 text-teal-950 border-teal-300 ring-teal-500/20';
      case 'goal_exceeded':
      case 'consumption_recorded':
        return 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 ring-amber-500/20';
      case 'slip_recorded':
        return 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-300 ring-purple-500/20';
      default:
        return 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 flex items-center justify-center text-white shadow-xs">
            <CalendarIcon className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Calendrier & Suivi Mensuel
            </h2>
            <p className="text-xs text-slate-500">
              Visualisez vos jours d’autonomie, vos objectifs atteints et vos prises enregistrées.
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-extrabold text-slate-900 min-w-[130px] text-center px-3 py-1.5 rounded-xl bg-slate-100">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
            title="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-400" />
          <span>Jour sans THC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-teal-100 border border-teal-400" />
          <span>Objectif de modération atteint</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-400" />
          <span>Prise déclarée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-purple-100 border border-purple-400" />
          <span>Écart avec réflexion</span>
        </div>
      </div>

      {/* Grid & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
            <span>Sam</span>
            <span>Dim</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day) => {
              const isSelected = selectedDay?.date === day.date;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[64px] sm:min-h-[76px] p-2 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer relative shadow-2xs ${getDayStatusStyle(
                    day
                  )} ${isSelected ? 'ring-2 ring-teal-700 border-teal-700 z-10' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-black ${day.isToday ? 'px-1.5 py-0.5 rounded-md bg-teal-700 text-white' : ''}`}>
                      {day.dayNumber}
                    </span>
                    {day.cravingsCount > 0 && (
                      <span className="text-[10px] font-bold px-1 rounded-full bg-rose-200 text-rose-900" title={`${day.cravingsCount} envie(s) enregistrée(s)`}>
                        {day.cravingsCount}⚡
                      </span>
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="text-[10px] font-bold truncate">
                    {day.status === 'thc_free_day' && (
                      <span className="text-emerald-700 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="hidden sm:inline">0 THC</span>
                      </span>
                    )}
                    {day.totalQuantity > 0 && (
                      <span className="text-amber-800 font-extrabold">
                        {day.totalQuantity} {day.unit === 'joints' ? 'j' : day.unit}
                      </span>
                    )}
                    {day.status === 'slip_recorded' && (
                      <span className="text-purple-800 flex items-center gap-0.5">
                        <HeartHandshake className="w-3 h-3" />
                        <span className="hidden sm:inline">Écart</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                Détails de la journée
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                {selectedDay ? selectedDay.date : 'Sélectionnez un jour'}
              </h3>
            </div>
            {selectedDay?.isToday && (
              <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold">
                Aujourd'hui
              </span>
            )}
          </div>

          {selectedDay ? (
            <div className="space-y-4 text-xs">
              
              {/* Status Badge */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Statut de la journée :</span>
                <span className="text-sm font-black text-slate-900 capitalize">
                  {selectedDay.status === 'thc_free_day'
                    ? '🌿 Journée 100% sans THC'
                    : selectedDay.status === 'goal_achieved'
                    ? '🎯 Objectif de modération atteint'
                    : selectedDay.status === 'slip_recorded'
                    ? '🤝 Écart avec réflexion constructive'
                    : selectedDay.entriesCount > 0
                    ? `💨 Consommation déclarée (${selectedDay.totalQuantity} ${selectedDay.unit})`
                    : 'En attente / Aucune donnée'}
                </span>
              </div>

              {/* Entries summary */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">
                  Prises enregistrées ({selectedDay.entriesCount}) :
                </span>
                {selectedDay.entries.length === 0 ? (
                  <p className="text-slate-500 italic">Aucune prise enregistrée pour ce jour.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDay.entries.map((entry) => (
                      <div key={entry.id} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{entry.time || '20:00'} — {entry.productName || 'Cannabis THC'}</span>
                          <span className="text-teal-800">{entry.quantity} {entry.unit}</span>
                        </div>
                        {entry.context && <p className="text-slate-500 text-[11px]">Contexte : {entry.context}</p>}
                        {entry.trigger && <p className="text-teal-700 text-[11px]">Déclencheur : {entry.trigger}</p>}
                        {entry.isSlip && entry.slipReflection && (
                          <div className="p-2 rounded-lg bg-purple-50 text-purple-900 text-[11px] space-y-0.5 border border-purple-200">
                            <span className="font-bold block">Réflexion bienveillante :</span>
                            <p>Prochaine aide : {entry.slipReflection.futureHelpIdea}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cravings summary */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">
                  Envies intenses notées ({selectedDay.cravingsCount}) :
                </span>
                {selectedDay.cravings.length === 0 ? (
                  <p className="text-slate-500 italic">Aucun pic de craving enregistré.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDay.cravings.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{c.time || '18:00'} — Envie</span>
                          <span className="text-rose-700 font-extrabold">{c.intensity}/10</span>
                        </div>
                        <p className="text-slate-500">Issue : {c.outcome === 'craving_passed' ? 'Envie surmontée ✨' : c.outcome}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onOpenNewEntry}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  + Ajouter une prise sur ce jour
                </button>
                <button
                  onClick={onOpenCravingModal}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  ⚡ Outil d'urgence craving
                </button>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Cliquez sur un jour pour inspecter ses données.</p>
          )}
        </div>

      </div>

    </div>
  );
};
