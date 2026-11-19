import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Compass,
  BookOpen,
  FlaskConical,
  PhoneCall,
  Activity,
  HelpCircle,
  Sparkles,
  Search,
  Filter,
  Bookmark,
  CheckCircle2,
  Clock,
  Languages,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Award,
  Brain,
  Scale,
  Thermometer,
  ShieldAlert,
  Flame,
  Layers,
  FileText,
  HeartPulse,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { EducationalContent, EducationalPath } from '../../types/entities';
import { PathCard } from './PathCard';
import { ContentCard } from './ContentCard';
import { ContentReader } from './ContentReader';
import { PathDetailView } from './PathDetailView';
import { BotanicalHero, BotanicalBadge, BotanicalLeafIcon, BotanicalWatermark } from '../Common/BotanicalDecor';

// Dedicated Rich Scientific & Health Modules
import { EndocannabinoidExplorer } from './modules/EndocannabinoidExplorer';
import { PharmacokineticsComparator } from './modules/PharmacokineticsComparator';
import { TerpeneSpectrumExplorer } from './modules/TerpeneSpectrumExplorer';
import { EuropeanLegalMatrix } from './modules/EuropeanLegalMatrix';
import { HarmReductionProtocol } from './modules/HarmReductionProtocol';
import { useLanguage, AppLanguage } from '../../context/LanguageContext';

export const EducationView: React.FC = () => {
  // Navigation Tabs: Grand Hub overview, 3 Core Pillars, plus Paths, Library, Interactive & Resources
  const [activeTab, setActiveTab] = useState<
    'overview' | 'sciences' | 'sanitary' | 'social' | 'paths' | 'contents' | 'interactive' | 'resources'
  >('overview');

  // Global language synchronization
  const { language, setLanguage, t } = useLanguage();
  const currentLang = language;
  const setCurrentLang = (lang: 'fr' | 'en' | 'lu' | 'de' | 'es' | 'ar') => setLanguage(lang as AppLanguage);

  // Data states
  const [paths, setPaths] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [cannabinoids, setCannabinoids] = useState<any[]>([]);
  const [terpenes, setTerpenes] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({
    totalContentsCompleted: 0,
    totalContentsAvailable: 0,
    pathsCompleted: 0,
    totalPathsAvailable: 10,
    quizzesTaken: 0,
    exercisesCompleted: 0,
  });

  // Active view states
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [selectedPath, setSelectedPath] = useState<any | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [filterRecommendedOnly, setFilterRecommendedOnly] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Load initial educational data
  const loadData = async () => {
    setLoading(true);
    try {
      const [resPaths, resContents, resCan, resTer, resRecs, resProg] = await Promise.all([
        fetch(`/api/education/paths`),
        fetch(`/api/education/contents?language=${currentLang}`),
        fetch(`/api/education/cannabinoids`),
        fetch(`/api/education/terpenes`),
        fetch(`/api/education/recommendations`),
        fetch(`/api/education/user-progress`),
      ]);

      if (resPaths.ok) {
        const data = await resPaths.json();
        setPaths(data.paths || []);
      }
      if (resContents.ok) {
        const data = await resContents.json();
        setContents(data.contents || []);
      }
      if (resCan.ok) {
        const data = await resCan.json();
        setCannabinoids(data.cannabinoids || []);
      }
      if (resTer.ok) {
        const data = await resTer.json();
        setTerpenes(data.terpenes || []);
      }
      if (resRecs.ok) {
        const data = await resRecs.json();
        setRecommendations(data.recommendations || []);
      }
      if (resProg.ok) {
        const data = await resProg.json();
        if (data.stats) setUserStats(data.stats);
      }
    } catch (e) {
      console.error('Error loading education view data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentLang]);

  // Handle favorite toggle
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/education/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: id, targetType: 'content' }),
      });

      if (res.ok) {
        const data = await res.json();
        setContents((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isFavorite: data.isFavorite } : c))
        );
        if (selectedContent && selectedContent.id === id) {
          setSelectedContent({ ...selectedContent, isFavorite: data.isFavorite });
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Handle marking content as completed
  const handleMarkCompleted = async (
    contentId: string,
    quizScore?: number,
    exerciseData?: any
  ) => {
    try {
      const res = await fetch(`/api/education/contents/${contentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizScore, exerciseData }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local status
        setContents((prev) =>
          prev.map((c) =>
            c.id === contentId ? { ...c, userStatus: 'completed', quizScore } : c
          )
        );
        if (selectedContent && selectedContent.id === contentId) {
          setSelectedContent({
            ...selectedContent,
            userStatus: 'completed',
            quizScore,
          });
        }
        // Refresh progress stats
        if (data.stats) setUserStats(data.stats);
      }
    } catch (err) {
      console.error('Error completing content:', err);
    }
  };

  // Handle selecting a path
  const handleSelectPath = async (path: EducationalPath) => {
    try {
      const res = await fetch(`/api/education/paths/${path.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPath(data.path);
      } else {
        setSelectedPath(path);
      }
    } catch {
      setSelectedPath(path);
    }
  };

  // Handle open a step content from path detail
  const handleOpenStep = (contentId: string) => {
    const item = contents.find((c) => c.id === contentId);
    if (item) {
      setSelectedContent(item);
    }
  };

  // Filter contents
  const filteredContents = contents.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchSummary = c.summary?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchCat) return false;
    }
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedLevel !== 'all' && c.level !== selectedLevel) return false;
    if (selectedType !== 'all' && c.contentType !== selectedType) return false;
    if (filterFavoritesOnly && !c.isFavorite) return false;

    if (selectedDuration !== 'all') {
      const d = c.estimatedMinutes || c.readTimeMinutes || 5;
      if (selectedDuration === 'short' && d > 5) return false;
      if (selectedDuration === 'medium' && (d <= 5 || d > 10)) return false;
      if (selectedDuration === 'long' && d <= 10) return false;
    }

    return true;
  });

  // Top Recommendation if available
  const topRec = recommendations.length > 0 ? recommendations[0] : null;

  // RTL Direction for Arabic
  const isRtl = currentLang === 'ar';

  return (
    <div
      id="education-module-root"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`space-y-6 ${isRtl ? 'font-sans' : ''}`}
    >
      {/* 1. Thematic Botanical Hero Banner with Language Picker */}
      <BotanicalHero
        title={
          currentLang === 'ar'
            ? 'المركز العلمي الشامل: علوم القنب، الصحة، والمجتمع'
            : currentLang === 'en'
            ? 'Grand Knowledge & Science Hub: Biology, Health & Society'
            : 'Grand Hub du Savoir Botanique, Scientifique & Sanitaire'
        }
        subtitle={
          currentLang === 'ar'
            ? 'معلومات علمية دقيقة ومحايدة، مبنية على أدلة طبية، لمرافقتك في فهم النباتات، الآليات العصبية، والحد من المخاطر.'
            : currentLang === 'en'
            ? 'Complete, rigorous scientific and harm-reduction encyclopedia. Explore the endocannabinoid system, pharmacokinetics, thermal spectra, and European legal matrices.'
            : 'Encyclopédie scientifique exhaustive et indépendante. Maîtrisez le système endocannabinoïde, la pharmacocinétique des molécules, les spectres thermiques et les cadres juridiques européens.'
        }
        badge={
          currentLang === 'ar'
            ? 'المرجع العلمي والحد من المخاطر'
            : currentLang === 'en'
            ? 'Scientific Reference & Evidence-Based Hub'
            : 'Sanctuaire Académique & Référence Scientifique'
        }
        badgeVariant="emerald"
        actionButton={
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-xs">
            {[
              { code: 'fr', label: '🇫🇷 FR' },
              { code: 'en', label: '🇬🇧 EN' },
              { code: 'lu', label: '🇱🇺 LU' },
              { code: 'de', label: '🇩🇪 DE' },
              { code: 'es', label: '🇪🇸 ES' },
              { code: 'ar', label: '🇸🇦 AR' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => setCurrentLang(l.code as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentLang === l.code
                    ? 'bg-white text-emerald-950 shadow-xs font-black'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        }
      />

      {/* 2. Primary Navigation Bar - Botanical Sanctuary Tabs */}
      <div className="bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-emerald-950/10 shadow-xl space-y-4">
        {/* Core Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {currentLang === 'ar' ? 'المحتويات المكتملة' : currentLang === 'en' ? 'Completed Modules' : 'Modules Validés'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-900">
                {userStats.totalContentsCompleted}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {userStats.totalContentsAvailable || contents.length}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {currentLang === 'ar' ? 'المسارات المنجزة' : currentLang === 'en' ? 'Paths Mastered' : 'Parcours Maîtrisés'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-teal-800">
                {userStats.pathsCompleted}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 10</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {currentLang === 'ar' ? 'الاختبارات' : currentLang === 'en' ? 'Quizzes Passed' : 'Quiz Validés'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-indigo-800">
                {userStats.quizzesTaken}
              </span>
              <span className="text-xs text-slate-400 font-medium">évaluations</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              {currentLang === 'ar' ? 'التمارين العملية' : currentLang === 'en' ? 'Exercises' : 'Exercices Pratiques'}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-amber-800">
                {userStats.exercisesCompleted}
              </span>
              <span className="text-xs text-slate-400 font-medium">enregistrés</span>
            </div>
          </div>
        </div>

        {/* 8 Botanical Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-950/10">
          {[
            { id: 'overview', label: t('Vue Globale & Pôles'), icon: Sparkles },
            { id: 'sciences', label: t('1. Sciences & Neurobiologie'), icon: Brain },
            { id: 'sanitary', label: t('2. Santé, Cinétique & RDR'), icon: HeartPulse },
            { id: 'social', label: t('3. Droit, Société & Conduite'), icon: Scale },
            { id: 'paths', label: t('10 Parcours Guidés'), icon: Compass },
            { id: 'contents', label: t('Bibliothèque Exhaustive'), icon: BookOpen },
            { id: 'interactive', label: t('Exercices & Quiz'), icon: Activity },
            { id: 'resources', label: t('Lignes d\'Écoute & CSAPA'), icon: PhoneCall },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !selectedContent && !selectedPath;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedContent(null);
                  setSelectedPath(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-md shadow-emerald-950/15 ring-1 ring-emerald-600/50'
                    : 'bg-emerald-950/5 text-slate-700 hover:bg-emerald-950/10 hover:text-emerald-950'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Top Recommendation Banner */}
      {!selectedContent && !selectedPath && topRec && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-emerald-500/10 pointer-events-none">
            <BotanicalLeafIcon size={120} />
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Orientation Recommandée Selon Votre Profil</span>
            </div>
            <h3 className="text-base font-bold text-white">{topRec.title}</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">{topRec.reason}</p>
          </div>

          <button
            onClick={() => {
              if (topRec.type === 'path') {
                const targetPath = paths.find((p) => p.id === topRec.targetId);
                if (targetPath) handleSelectPath(targetPath);
              } else {
                const targetContent = contents.find((c) => c.id === topRec.targetId);
                if (targetContent) setSelectedContent(targetContent);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer shrink-0 shadow-md relative z-10"
          >
            <span>Démarrer l&apos;Étude</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. CONDITIONAL VIEWS: READER / PATH DETAIL / TAB VIEWS */}
      {selectedContent ? (
        <ContentReader
          content={selectedContent}
          onBack={() => setSelectedContent(null)}
          onToggleFavorite={handleToggleFavorite}
          onMarkCompleted={handleMarkCompleted}
          lang={currentLang}
        />
      ) : selectedPath ? (
        <PathDetailView
          path={selectedPath}
          onBack={() => setSelectedPath(null)}
          onOpenStep={handleOpenStep}
          lang={currentLang}
        />
      ) : (
        <>
          {/* TAB 0: OVERVIEW & 3 MAJOR PILLARS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* 3 Major Visual Pillar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Pillar 1: Sciences */}
                <div
                  onClick={() => setActiveTab('sciences')}
                  className="p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-950/10 hover:border-emerald-600/50 hover:shadow-xl transition-all cursor-pointer space-y-4 group relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-emerald-700 tracking-wider">Pôle 1</span>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-900 transition-colors">
                      Sciences & Neurobiologie
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Explorez le système endocannabinoïde, les récepteurs CB1/CB2, la transmission rétrograde synaptique et les affinités biochimiques du THC, CBD et cannabinoïdes mineurs.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition">
                    <span>Explorer le laboratoire</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Pillar 2: Sanitary & Harm Reduction */}
                <div
                  onClick={() => setActiveTab('sanitary')}
                  className="p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-950/10 hover:border-emerald-600/50 hover:shadow-xl transition-all cursor-pointer space-y-4 group relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-teal-700 tracking-wider">Pôle 2</span>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-900 transition-colors">
                      Santé, Cinétique & RDR
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Comparateur de pharmacocinétique sanguine, métabolite 11-OH-THC, spectre thermique des terpènes, vaporisation sans combustion et protocole d&apos;urgence anti-malaise.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition">
                    <span>Consulter le guide santé</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Pillar 3: Legal & Social */}
                <div
                  onClick={() => setActiveTab('social')}
                  className="p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-950/10 hover:border-emerald-600/50 hover:shadow-xl transition-all cursor-pointer space-y-4 group relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-cyan-700 tracking-wider">Pôle 3</span>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-900 transition-colors">
                      Droit, Société & Conduite
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Matrice juridique comparée (Luxembourg, Allemagne, France, Espagne, Suisse), dépistage salivaire au volant, droit du travail et repères sociologiques.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition">
                    <span>Accéder aux repères légaux</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Interactive Neurobiology Studio Teaser */}
              <EndocannabinoidExplorer />

              {/* Pharmacokinetics Interactive Teaser */}
              <PharmacokineticsComparator />

              {/* Terpene Spectrum Teaser */}
              <TerpeneSpectrumExplorer />

              {/* European Legal Matrix Teaser */}
              <EuropeanLegalMatrix />

              {/* Harm Reduction Emergency Guide */}
              <HarmReductionProtocol />
            </div>
          )}

          {/* TAB 1: SCIENCES & NEUROBIOLOGY */}
          {activeTab === 'sciences' && (
            <div className="space-y-8">
              <EndocannabinoidExplorer />

              {/* Cannabinoid Directory */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Encyclopédie Moléculaire des Phytocannabinoïdes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Structure biochimique, interactions avec les récepteurs membranaires et métabolites.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cannabinoids.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-950/10 shadow-xs space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-950 font-black text-sm">
                          {c.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            c.psychoactive || c.isPsychoactive
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-teal-100 text-teal-900 border border-teal-300'
                          }`}
                        >
                          {c.psychoactive || c.isPsychoactive
                            ? 'Psychotrope'
                            : 'Non Psychotrope'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          {c.fullName || c.name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      {c.observedPropertiesNonMedical && (
                        <div className="space-y-1 pt-2 border-t border-emerald-950/10 text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Effets & Propriétés Documentées :
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {c.observedPropertiesNonMedical.map((prop: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full bg-emerald-950/5 text-emerald-900 text-[11px] font-semibold"
                              >
                                {prop}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {c.legalStatusSummary && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                          <strong>Cadre légal :</strong> {c.legalStatusSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SANITARY & HARM REDUCTION */}
          {activeTab === 'sanitary' && (
            <div className="space-y-8">
              <PharmacokineticsComparator />
              <TerpeneSpectrumExplorer />
              <HarmReductionProtocol />
            </div>
          )}

          {/* TAB 3: LEGAL & SOCIAL */}
          {activeTab === 'social' && (
            <div className="space-y-8">
              <EuropeanLegalMatrix />

              {/* Historical & Sociological Context */}
              <div className="p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-950/10 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Perspective Historique & Sociologique du Cannabis</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Des Pharmacopées Antiques à la Régulation Moderne
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 font-bold block text-sm">2700 av. J.-C. — Pharmacopée Chinoise</strong>
                    <p>
                      Première mention écrite du cannabis par l’Empereur Shennong pour soulager la goutte, les rhumatismes et le paludisme. Usage millénaire du chanvre textile pour les cordages et voilures.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 font-bold block text-sm">1937 — Le Marihuana Tax Act & Prohibition</strong>
                    <p>
                      Sous l’impulsion de Harry Anslinger, les États-Unis criminalisent la plante sur fond de stigmatisation sociale des minorités et de concurrence avec les fibres synthétiques (nylon).
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 font-bold block text-sm">1992 — Découverte de l&apos;Anandamide</strong>
                    <p>
                      Raphael Mechoulam isole le premier endocannabinoïde chez l’humain. La science démontre que le corps possède son propre réseau régulateur interne, amorçant le renouveau médical mondial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 10 GUIDED PATHS */}
          {activeTab === 'paths' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Les 10 Parcours Thématiques Structurés
                  </h3>
                  <p className="text-xs text-slate-500">
                    Des programmes pas à pas adaptés à vos objectifs personnels : initiation, sommeil, tolérance ou modération.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paths.map((path) => (
                  <PathCard
                    key={path.id}
                    path={path}
                    onSelectPath={handleSelectPath}
                    lang={currentLang}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXHAUSTIVE LIBRARY */}
          {activeTab === 'contents' && (
            <div className="space-y-5">
              {/* Search & Advanced Filters Bar */}
              <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-950/10 shadow-sm space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-emerald-800 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par mot-clé (ex: THC, récepteur, insomnie, sevrage, tolérance)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-emerald-950/10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Category dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 rounded-xl border border-emerald-950/10 bg-white text-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="cannabis_thc">Cannabis & THC</option>
                    <option value="cbd">CBD & Bien-être</option>
                    <option value="body_brain">Corps & Cerveau</option>
                    <option value="habits_behavior">Habitudes & Mental</option>
                    <option value="reduction_cessation">Modération & Arrêt</option>
                    <option value="wellness">Sommeil & Sérénité</option>
                    <option value="harm_reduction">Réduction des Risques</option>
                  </select>

                  {/* Level dropdown */}
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="p-2 rounded-xl border border-emerald-950/10 bg-white text-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="all">Tous niveaux</option>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Expert</option>
                  </select>

                  {/* Type dropdown */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="p-2 rounded-xl border border-emerald-950/10 bg-white text-slate-700 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="all">Tous formats</option>
                    <option value="article">Articles Scientifiques</option>
                    <option value="micro_lesson">Micro-leçons</option>
                    <option value="exercise">Exercices Pratiques</option>
                    <option value="quiz">Quiz de Maîtrise</option>
                    <option value="guide">Guides Complets</option>
                  </select>

                  {/* Favorites toggle */}
                  <button
                    onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      filterFavoritesOnly
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-600 border-emerald-950/10 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>Favoris</span>
                  </button>

                  {(selectedCategory !== 'all' || selectedLevel !== 'all' || selectedType !== 'all' || filterFavoritesOnly || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedLevel('all');
                        setSelectedType('all');
                        setFilterFavoritesOnly(false);
                        setSearchQuery('');
                      }}
                      className="text-xs text-emerald-800 hover:underline font-bold ml-auto cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </div>

              {/* Contents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContents.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onSelect={(c) => setSelectedContent(c)}
                    onToggleFavorite={handleToggleFavorite}
                    lang={currentLang}
                  />
                ))}
              </div>

              {filteredContents.length === 0 && (
                <div className="p-8 text-center bg-white rounded-3xl border border-emerald-950/10 space-y-2">
                  <BookOpen className="w-8 h-8 text-emerald-800/40 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">Aucun contenu trouvé</h4>
                  <p className="text-xs text-slate-400">
                    Essayez de modifier vos filtres ou termes de recherche.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PRACTICAL EXERCISES & QUIZZES */}
          {activeTab === 'interactive' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white space-y-2 border border-emerald-800/40">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                  <Activity className="w-4 h-4" />
                  <span>Entraînement Comportemental & Auto-Évaluation</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Exercices Pratiques & Tests de Connaissances
                </h3>
                <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
                  Des outils concrets pour observer vos déclencheurs émotionnels, temporiser face aux envies et valider vos acquis scientifiques.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 px-1">
                  Exercices Comportementaux Guidés
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contents
                    .filter((c) => c.contentType === 'exercise')
                    .map((c) => (
                      <ContentCard
                        key={c.id}
                        content={c}
                        onSelect={(item) => setSelectedContent(item)}
                        onToggleFavorite={handleToggleFavorite}
                        lang={currentLang}
                      />
                    ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-emerald-950/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 px-1">
                  Quiz & Auto-Évaluation des Savoirs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contents
                    .filter((c) => c.contentType === 'quiz')
                    .map((c) => (
                      <ContentCard
                        key={c.id}
                        content={c}
                        onSelect={(item) => setSelectedContent(item)}
                        onToggleFavorite={handleToggleFavorite}
                        lang={currentLang}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: RESOURCES & OFFICIAL SUPPORT */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white space-y-3 border border-emerald-800/40">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-emerald-400" />
                  <span>Services Publics d&apos;Écoute, de Soins et d&apos;Orientation</span>
                </h3>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
                  Ces dispositifs officiels sont 100% gratuits, anonymes et bienveillants. Ils vous mettent en relation avec des professionnels de santé formés sans aucun jugement moral.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold text-[10px]">
                    Dispositif National de Prévention
                  </span>
                  <h4 className="text-base font-bold text-slate-900">Drogues Info Service</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Écoute personnalisée par des écoutants professionnels formés. Informations sur les effets, les risques et les solutions d&apos;aide.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href="tel:0800231313"
                      className="text-sm font-extrabold text-emerald-800 hover:underline"
                    >
                      0 800 23 13 13 (Gratuit 7j/7, 8h-2h)
                    </a>
                    <a
                      href="https://www.drogues-info-service.fr"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
                    >
                      <span>Site web</span> <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                    Centres de Soins de Proximité
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    CSAPA & CJC (Consultations Jeunes Consommateurs)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Centres de Soins, d&apos;Accompagnement et de Prévention en Addictologie. Équipes pluridisciplinaires (médecins, psychologues, éducateurs) gratuites et confidentielles.
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                    Présents dans chaque département. Carte vitale non obligatoire.
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-xs space-y-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                    Santé des Jeunes
                  </span>
                  <h4 className="text-base font-bold text-slate-900">Fil Santé Jeunes</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Espace d&apos;échange confidentiel pour les 12-25 ans sur la santé physique, mentale, les consommations et le bien-être.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href="tel:0800235236"
                      className="text-sm font-extrabold text-amber-800 hover:underline"
                    >
                      0 800 235 236 ou 3224
                    </a>
                    <span className="text-xs text-slate-400">Gratuit et anonyme</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-rose-200 shadow-xs space-y-3 bg-rose-50/20">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold text-[10px]">
                    Urgences Médicales
                  </span>
                  <h4 className="text-base font-bold text-slate-900">En cas d&apos;urgence vitale</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    En cas de malaise intense, détresse respiratoire, crise d&apos;angoisse aiguë (&quot;bad trip&quot; persistant) ou confusion extrême :
                  </p>
                  <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-rose-700">SAMU : 15</span>
                    <span className="text-sm font-extrabold text-slate-900">Numéro Européen : 112</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
