import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UnifiedJournalEntry, ProfileType, THCStatus, CBDStatus } from '../../types/entities';
import { BotanicalWatermark, BotanicalBadge, BotanicalLeafIcon } from '../Common/BotanicalDecor';
import { UnifiedAddModal, AddModalType } from './UnifiedAddModal';
import { useLanguage } from '../../context/LanguageContext';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Moon,
  Smile,
  Flame,
  Zap,
  Activity,
  Utensils,
  Droplets,
  Feather,
  StickyNote,
  Flag,
  Leaf,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tag,
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  Layers,
  ListFilter,
  Eye,
  ArrowRight,
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const { token, profile } = useAuth();
  const { t, language } = useLanguage();

  // Active Main View Tab
  const [activeTab, setActiveTab] = useState<'today' | 'timeline' | 'calendar' | 'notes'>('today');

  // Selected Day for "Ma journée"
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayData, setDayData] = useState<any>(null);
  const [isDayLoading, setIsDayLoading] = useState(false);

  // Timeline state
  const [timelineEntries, setTimelineEntries] = useState<UnifiedJournalEntry[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [timelineTypeFilter, setTimelineTypeFilter] = useState('ALL');
  const [timelinePeriod, setTimelinePeriod] = useState<'today' | 'yesterday' | '7days' | '30days' | 'all'>('7days');
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar state
  const [currentCalYear, setCurrentCalYear] = useState(new Date().getFullYear());
  const [currentCalMonth, setCurrentCalMonth] = useState(new Date().getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Notes state
  const [notesList, setNotesList] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Weekly prep / observation stats
  const [weeklyStats, setWeeklyStats] = useState<any>(null);

  // Modals & AI
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<AddModalType>('mood');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Profile context flags
  const isTHCUser =
    profile?.profileType === ProfileType.THC ||
    profile?.thcStatus === THCStatus.CURRENT_USER ||
    profile?.thcStatus === THCStatus.FORMER_USER;

  const isCBDUser =
    profile?.profileType === ProfileType.CBD ||
    profile?.cbdStatus === CBDStatus.CURRENT_USER ||
    profile?.cbdStatus === CBDStatus.FORMER_USER;

  // 1. Fetch Day Data
  const fetchDayData = async (targetDate: string) => {
    if (!token) return;
    setIsDayLoading(true);
    try {
      const res = await fetch(`/api/journal/day/${targetDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDayData(data);
      }
    } catch (err) {
      console.error('Error fetching day breakdown:', err);
    } finally {
      setIsDayLoading(false);
    }
  };

  // 2. Fetch Timeline Entries
  const fetchTimeline = async () => {
    if (!token) return;
    setIsTimelineLoading(true);
    try {
      const params = new URLSearchParams();
      if (timelineTypeFilter !== 'ALL') params.append('type', timelineTypeFilter);
      if (timelinePeriod !== 'all') params.append('period', timelinePeriod);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/journal/timeline?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTimelineEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  // 3. Fetch Calendar Indicators
  const fetchCalendar = async (year: number, month: number) => {
    if (!token) return;
    setIsCalendarLoading(true);
    try {
      const res = await fetch(`/api/journal/calendar?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarDays(data.days || []);
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  // 4. Fetch Notes & Tags
  const fetchNotesAndTags = async () => {
    if (!token) return;
    try {
      const notesRes = await fetch('/api/journal/notes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notesRes.ok) {
        const d = await notesRes.json();
        setNotesList(d.notes || []);
      }

      const tagsRes = await fetch('/api/journal/tags', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tagsRes.ok) {
        const d = await tagsRes.json();
        setAvailableTags(d.tags || []);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  // 5. Fetch Weekly Prep
  const fetchWeeklyPrep = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/journal/weekly-prep', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setWeeklyStats(d.metrics);
      }
    } catch (err) {
      console.error('Error fetching weekly stats:', err);
    }
  };

  // Initial and reactive loads
  useEffect(() => {
    if (token) {
      fetchDayData(selectedDate);
      fetchTimeline();
      fetchCalendar(currentCalYear, currentCalMonth);
      fetchNotesAndTags();
      fetchWeeklyPrep();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDayData(selectedDate);
    }
  }, [selectedDate, token]);

  useEffect(() => {
    if (token) {
      fetchTimeline();
    }
  }, [timelinePeriod, timelineTypeFilter, searchQuery, token]);

  useEffect(() => {
    if (token) {
      fetchCalendar(currentCalYear, currentCalMonth);
    }
  }, [currentCalYear, currentCalMonth, token]);

  // Refresh all data on save
  const handleDataSaved = () => {
    fetchDayData(selectedDate);
    fetchTimeline();
    fetchCalendar(currentCalYear, currentCalMonth);
    fetchNotesAndTags();
    fetchWeeklyPrep();
  };

  // Day navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Delete item handler
  const handleDeleteItem = async (entry: UnifiedJournalEntry) => {
    if (!window.confirm(`Supprimer cette observation de type ${entry.title} ?`)) return;
    try {
      let endpoint = '';
      if (entry.entryType === 'THC_CONSUMPTION') endpoint = `/api/journal/${entry.sourceId}`;
      else if (entry.entryType === 'SLEEP') endpoint = `/api/journal/sleep/${entry.sourceId}`;
      else if (entry.entryType === 'NOTE') endpoint = `/api/journal/notes/${entry.sourceId}`;
      else if (entry.entryType === 'CBD_CONSUMPTION') endpoint = `/api/cbd/consumptions/${entry.sourceId}`;
      else endpoint = `/api/journal/${entry.sourceId}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        handleDataSaved();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = (type: AddModalType, prefilledDate?: string) => {
    setAddModalType(type);
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!token) return;
    window.location.href = `/api/journal/export/csv`;
  };

  const handleExportJSON = () => {
    if (!token) return;
    window.location.href = `/api/journal/export/json`;
  };

  const handleAnalyzeAI = async () => {
    if (!token) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calendar rendering helpers
  const daysInMonth = new Date(currentCalYear, currentCalMonth, 0).getDate();
  const firstDayOfWeek = (new Date(currentCalYear, currentCalMonth - 1, 1).getDay() + 6) % 7; // Monday = 0

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

  // Formatting date in French human format
  const formatFrenchDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get icon by entry type
  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'SLEEP':
        return <Moon className="w-4 h-4 text-indigo-600" />;
      case 'MOOD':
        return <Smile className="w-4 h-4 text-amber-600" />;
      case 'STRESS':
        return <Flame className="w-4 h-4 text-rose-600" />;
      case 'ENERGY':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'ACTIVITY':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'NUTRITION':
        return <Utensils className="w-4 h-4 text-orange-600" />;
      case 'HYDRATION':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'RELAXATION':
        return <Feather className="w-4 h-4 text-teal-600" />;
      case 'NOTE':
        return <StickyNote className="w-4 h-4 text-purple-600" />;
      case 'EVENT':
        return <Flag className="w-4 h-4 text-violet-600" />;
      case 'THC_CONSUMPTION':
        return <Shield className="w-4 h-4 text-teal-700" />;
      case 'CBD_CONSUMPTION':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'CRAVING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Top Banner & Header */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white shadow-xl relative overflow-hidden border border-emerald-800/20">
        <BotanicalWatermark position="top-right" size={260} className="text-emerald-400/5 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3 backdrop-blur-xs">
              <BotanicalLeafIcon size={14} className="text-emerald-400" variant="minimal" />
              <span>{t('Sanctuaire & Carnet d\'Observations Personnel')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
              {t('sub_journal', 'Mon Journal Quotidien')}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t('Espace d’observation scientifique, bienveillant et sans jugement pour consigner vos ressentis, sommeil, activités, rituels phytothérapie et consommations.')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAdd('mood')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{t('Noter une observation')}</span>
            </button>

            <button
              onClick={handleAnalyzeAI}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-2xl text-xs font-bold transition cursor-pointer backdrop-blur-xs"
              title="Générer une synthèse bienveillante"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
              <span>{isAnalyzing ? t('Analyse...') : t('Synthèse IA')}</span>
            </button>

            <div className="flex items-center border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xs">
              <button
                onClick={handleExportCSV}
                title="Exporter en CSV"
                className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button
                onClick={handleExportJSON}
                title="Exporter toutes mes données (JSON)"
                className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <FileJson className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Analysis Box (if requested) */}
        {aiAnalysis && (
          <div className="mt-6 p-4 md:p-5 bg-emerald-900/40 border border-emerald-500/30 rounded-2xl relative animate-fadeIn backdrop-blur-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  {t('Observation & Perspectives Personnalisées IA')}
                </span>
              </div>
              <button
                onClick={() => setAiAnalysis(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {t('Fermer')}
              </button>
            </div>
            <div className="text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
              {aiAnalysis}
            </div>
          </div>
        )}

        {/* Weekly Stats Bar */}
        {weeklyStats && (
          <div className="mt-6 pt-5 border-t border-emerald-800/30 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">{t('Suivi 7 jours')}</span>
              <span className="text-sm font-black text-white">{weeklyStats.activeTrackingDays} / 7 {t('jours')}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">{t('Moy. Sommeil')}</span>
              <span className="text-sm font-black text-indigo-300">{weeklyStats.avgSleepFormatted}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">{t('Activité totale')}</span>
              <span className="text-sm font-black text-teal-300">{weeklyStats.totalActivityFormatted}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">{t('Humeur moyenne')}</span>
              <span className="text-sm font-black text-amber-300">{weeklyStats.avgMood ? `${weeklyStats.avgMood} / 5` : '-'}</span>
            </div>
            {isTHCUser && (
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">{t('Cravings gérés')}</span>
                <span className="text-sm font-black text-emerald-300">{weeklyStats.totalCravingsHandled}</span>
              </div>
            )}
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">{t('Prises CBD')}</span>
              <span className="text-sm font-black text-emerald-300">{weeklyStats.totalCbdLogs}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'today'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeTab === 'today' ? 'text-white' : 'text-slate-500'}`} />
          <span>{t('Ma journée')}</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${activeTab === 'timeline' ? 'text-white' : 'text-slate-500'}`} />
          <span>{t('Flux chronologique (Timeline)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <CalendarIcon className={`w-3.5 h-3.5 ${activeTab === 'calendar' ? 'text-white' : 'text-slate-500'}`} />
          <span>{t('Vue Calendrier')}</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'notes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <StickyNote className={`w-3.5 h-3.5 ${activeTab === 'notes' ? 'text-white' : 'text-slate-500'}`} />
          <span>{t('Notes & Tags')}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MA JOURNÉE (DAY VIEW) */}
      {/* ======================================================== */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          
          {/* Day Navigation Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleSetToday}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer ml-1"
              >
                Aujourd&apos;hui
              </button>
            </div>

            <div className="text-center">
              <span className="text-xs font-black text-slate-900 capitalize block md:text-sm">
                {formatFrenchDate(selectedDate)}
              </span>
            </div>

            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              />
            </div>
          </div>

          {isDayLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              Chargement de la journée...
            </div>
          ) : !dayData ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Aucune information chargée pour cette date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Mon État (Sommeil, Humeur, Stress, Énergie) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Smile className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Mon État Général</h3>
                  </div>
                  <button
                    onClick={() => handleOpenAdd('mood', selectedDate)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Note d&apos;état
                  </button>
                </div>

                {/* Sub-rows */}
                <div className="space-y-3">
                  
                  {/* Sommeil */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Sommeil</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.state.sleep
                            ? `${dayData.state.sleep.bedTime} → ${dayData.state.sleep.wakeTime} (${Math.floor(dayData.state.sleep.durationMinutes / 60)}h${dayData.state.sleep.durationMinutes % 60 ? dayData.state.sleep.durationMinutes % 60 : ''}) • Qualité ${dayData.state.sleep.sleepQuality}/5`
                            : 'Aucune nuit enregistrée'}
                        </div>
                      </div>
                    </div>
                    {dayData.state.sleep ? (
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {dayData.state.sleep.sleepQuality}/5 ★
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenAdd('sleep', selectedDate)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        + Sommeil
                      </button>
                    )}
                  </div>

                  {/* Humeur */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Smile className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Humeur</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.state.latestMoodRating
                            ? `Dernière note: ${dayData.state.latestMoodRating}/5 (${dayData.state.moods[dayData.state.moods.length - 1]?.primaryMood || 'Ressenti noté'})`
                            : 'Aucune humeur consignée'}
                        </div>
                      </div>
                    </div>
                    {dayData.state.latestMoodRating ? (
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        {dayData.state.latestMoodRating}/5
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenAdd('mood', selectedDate)}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        + Humeur
                      </button>
                    )}
                  </div>

                  {/* Stress */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Niveau de Stress</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.state.latestStressRating
                            ? `Niveau: ${dayData.state.latestStressRating}/5`
                            : 'Non renseigné aujourd’hui'}
                        </div>
                      </div>
                    </div>
                    {dayData.state.latestStressRating ? (
                      <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        {dayData.state.latestStressRating}/5
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenAdd('stress', selectedDate)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        + Stress
                      </button>
                    )}
                  </div>

                  {/* Énergie */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Énergie & Vitalité</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.state.latestEnergyRating
                            ? `Niveau: ${dayData.state.latestEnergyRating}/5`
                            : 'Non renseigné aujourd’hui'}
                        </div>
                      </div>
                    </div>
                    {dayData.state.latestEnergyRating ? (
                      <span className="text-xs font-extrabold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                        {dayData.state.latestEnergyRating}/5 ⚡
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenAdd('energy', selectedDate)}
                        className="text-[11px] font-bold text-yellow-700 hover:text-yellow-900 bg-yellow-50 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        + Énergie
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Mes Habitudes (Activité, Hydratation, Relaxation, Alimentation) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Mes Habitudes & Pratiques</h3>
                  </div>
                  <button
                    onClick={() => handleOpenAdd('activity', selectedDate)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Activité Physique */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Activité physique</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.habits.totalActivityMinutes > 0
                            ? `${dayData.habits.totalActivityMinutes} min d'activité cumulée`
                            : 'Aucune séance renseignée'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenAdd('activity', selectedDate)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {dayData.habits.totalActivityMinutes > 0 ? `${dayData.habits.totalActivityMinutes} min` : '+ Activité'}
                    </button>
                  </div>

                  {/* Hydratation */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Droplets className="w-4 h-4 text-sky-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Hydratation (Eau)</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.habits.totalHydrationMl > 0
                            ? `${dayData.habits.totalHydrationMl} ml bus (~${Math.round(dayData.habits.totalHydrationMl / 250)} verres)`
                            : 'Aucun apport consigné'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenAdd('hydration', selectedDate)}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {dayData.habits.totalHydrationMl > 0 ? `${dayData.habits.totalHydrationMl} ml` : '+ Eau'}
                    </button>
                  </div>

                  {/* Relaxation / Cohérence */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Feather className="w-4 h-4 text-teal-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Relaxation & Sérénité</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.habits.totalRelaxationMinutes > 0
                            ? `${dayData.habits.totalRelaxationMinutes} min de détente`
                            : 'Aucune pause consignée'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenAdd('relaxation', selectedDate)}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {dayData.habits.totalRelaxationMinutes > 0 ? `${dayData.habits.totalRelaxationMinutes} min` : '+ Détente'}
                    </button>
                  </div>

                  {/* Alimentation */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Utensils className="w-4 h-4 text-orange-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Alimentation</div>
                        <div className="text-[11px] text-slate-500">
                          {dayData.habits.nutritions.length > 0
                            ? `${dayData.habits.nutritions.length} repas consigné(s)`
                            : 'Aucun repas consigné'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenAdd('nutrition', selectedDate)}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-800 bg-orange-50 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      + Repas
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Mes Consommations (THC & CBD) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Consommations & Rituels</h3>
                  </div>
                  <div className="flex gap-2">
                    {isTHCUser && (
                      <button
                        onClick={() => handleOpenAdd('thc', selectedDate)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                      >
                        + Prise THC
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenAdd('cbd', selectedDate)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      + Prise CBD
                    </button>
                  </div>
                </div>

                {dayData.consumptions.thc.length === 0 && dayData.consumptions.cbd.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center">
                    <p className="text-xs font-medium text-slate-500">
                      Aucune consommation consignée ce jour.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayData.consumptions.thc.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-teal-700" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {t.productName || 'Cannabis THC'} • {t.quantity} {t.unit}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {t.time} • {t.consumptionMode} • {t.context}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded-md">
                          THC
                        </span>
                      </div>
                    ))}

                    {dayData.consumptions.cbd.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-emerald-700" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {c.productName || 'CBD'} • {c.quantity} {c.quantityUnit}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {c.time} • {c.consumptionMethod} • {c.context || 'Usage quotidien'}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                          CBD
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 4: Notes & Événements de la journée */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <StickyNote className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Notes & Événements</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenAdd('note', selectedDate)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                    >
                      + Note
                    </button>
                    <button
                      onClick={() => handleOpenAdd('event', selectedDate)}
                      className="text-xs font-bold text-violet-700 hover:text-violet-900 cursor-pointer"
                    >
                      + Événement
                    </button>
                  </div>
                </div>

                {dayData.notesAndEvents.notes.length === 0 && dayData.notesAndEvents.events.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center">
                    <p className="text-xs font-medium text-slate-500">
                      Aucune note ni événement consigné pour ce jour.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayData.notesAndEvents.events.map((evt: any) => (
                      <div
                        key={evt.id}
                        className="p-3 bg-violet-50/60 border border-violet-100 rounded-2xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5 text-violet-600" />
                            {evt.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                            {evt.category}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-slate-600">{evt.description}</p>
                        )}
                      </div>
                    ))}

                    {dayData.notesAndEvents.notes.map((n: any) => (
                      <div
                        key={n.id}
                        className="p-3 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-1"
                      >
                        {n.title && <div className="text-xs font-bold text-slate-900">{n.title}</div>}
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{n.content}</p>
                        {n.tags && n.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {n.tags.map((tg: string) => (
                              <span key={tg} className="text-[9px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md">
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TIMELINE (CHRONOLOGICAL FEED) */}
      {/* ======================================================== */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          
          {/* Filters and Search Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par mot-clé, produit, ressenti, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Period Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                {[
                  { id: 'today', label: "Aujourd'hui" },
                  { id: 'yesterday', label: 'Hier' },
                  { id: '7days', label: '7 jours' },
                  { id: '30days', label: '30 jours' },
                  { id: 'all', label: 'Tout' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTimelinePeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      timelinePeriod === p.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filters Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-slate-100">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'WELLNESS', label: 'Bien-être' },
                { id: 'SLEEP', label: 'Sommeil' },
                { id: 'ACTIVITY', label: 'Activité' },
                { id: 'RELAXATION', label: 'Relaxation' },
                { id: 'NOTE', label: 'Notes' },
                { id: 'THC', label: 'THC' },
                { id: 'CBD', label: 'CBD' },
                { id: 'CRAVING', label: 'Cravings' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimelineTypeFilter(tf.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    timelineTypeFilter === tf.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Stream */}
          {isTimelineLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              Chargement du flux chronologique...
            </div>
          ) : timelineEntries.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Aucune observation trouvée</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Commencez à noter vos observations quotidiennes, ressentis ou rituels pour enrichir votre suivi.
              </p>
              <button
                onClick={() => handleOpenAdd('mood')}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-teal-700 cursor-pointer"
              >
                + Ajouter une entrée
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineEntries.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getEntryIcon(item.entryType)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          {item.date} à {item.time}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>

                      {/* Metadata / Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.map((tg) => (
                            <span
                              key={tg}
                              className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    <button
                      onClick={() => handleDeleteItem(item)}
                      title="Supprimer"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CALENDAR VIEW */}
      {/* ======================================================== */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          
          {/* Calendar Header with navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {monthNames[currentCalMonth - 1]} {currentCalYear}
              </h3>
              <p className="text-xs text-slate-500">
                Vue d&apos;ensemble de vos jours d&apos;observation et régularité.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentCalMonth === 1) {
                    setCurrentCalMonth(12);
                    setCurrentCalYear((y) => y - 1);
                  } else {
                    setCurrentCalMonth((m) => m - 1);
                  }
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentCalYear(now.getFullYear());
                  setCurrentCalMonth(now.getMonth() + 1);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 rounded-xl transition cursor-pointer"
              >
                Ce mois
              </button>

              <button
                onClick={() => {
                  if (currentCalMonth === 12) {
                    setCurrentCalMonth(1);
                    setCurrentCalYear((y) => y + 1);
                  } else {
                    setCurrentCalMonth((m) => m + 1);
                  }
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] bg-slate-50/50 rounded-2xl border border-transparent" />
            ))}

            {/* Real Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentCalYear}-${currentCalMonth.toString().padStart(2, '0')}-${dayNum
                .toString()
                .padStart(2, '0')}`;
              const dayInfo = calendarDays.find((d) => d.date === dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setActiveTab('today');
                  }}
                  className={`min-h-[85px] p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer hover:border-teal-500 ${
                    isSelected
                      ? 'bg-teal-50/40 border-teal-600 ring-2 ring-teal-600/20'
                      : isToday
                      ? 'bg-slate-50 border-slate-300 font-bold'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-teal-700 font-black' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    )}
                  </div>

                  {/* Indicator Dots & Badges */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayInfo?.sleepLogged && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" title="Sommeil consigné" />
                    )}
                    {dayInfo?.moodCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Humeur consignée" />
                    )}
                    {dayInfo?.activityCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="Activité physique" />
                    )}
                    {dayInfo?.relaxationCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-teal-500" title="Relaxation" />
                    )}
                    {dayInfo?.thcCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-slate-800" title="Consommation THC" />
                    )}
                    {dayInfo?.cbdCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" title="Prise CBD" />
                    )}
                    {dayInfo?.cravingCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500" title="Craving géré" />
                    )}
                    {dayInfo?.noteCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-purple-500" title="Note personnelle" />
                    )}
                  </div>

                  {dayInfo?.totalItems > 0 && (
                    <div className="text-[10px] text-slate-400 font-bold self-end">
                      {dayInfo.totalItems} obs.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Sommeil
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Humeur
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Activité
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Relaxation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> CBD
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" /> THC
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Note
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: NOTES & TAGS */}
      {/* ======================================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          
          {/* Tag Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Filtrer par thématique / Tag
              </span>
              <button
                onClick={() => handleOpenAdd('note')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Nouvelle note
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedTag === null ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Toutes les notes
              </button>
              {availableTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(t === selectedTag ? null : t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    selectedTag === t
                      ? 'bg-purple-700 text-white font-bold'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Grid */}
          {notesList.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <StickyNote className="w-8 h-8 text-purple-600 mx-auto" />
              <h4 className="text-sm font-black text-slate-900">Aucune note personnelle</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Consignez vos pensées, idées, bilans ou réflexions personnelles à tout moment.
              </p>
              <button
                onClick={() => handleOpenAdd('note')}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 cursor-pointer"
              >
                + Écrire une note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notesList
                .filter((n) => !selectedTag || (n.tags || []).includes(selectedTag))
                .map((n) => (
                  <div
                    key={n.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {n.date} à {n.time}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(n);
                              setAddModalType('note');
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {n.title && <h4 className="text-sm font-black text-slate-900">{n.title}</h4>}

                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {n.content}
                      </p>
                    </div>

                    {n.tags && n.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-50">
                        {n.tags.map((tg: string) => (
                          <span
                            key={tg}
                            className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md"
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Unified Fast Entry Modal */}
      <UnifiedAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={handleDataSaved}
        initialType={addModalType}
        initialDate={selectedDate}
        itemToEdit={editingItem}
      />
    </div>
  );
};
