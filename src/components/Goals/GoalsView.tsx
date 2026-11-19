import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Target, Award, Plus, CheckCircle, Flame, Sparkles } from 'lucide-react';
import { BotanicalWatermark, BotanicalBadge, BotanicalLeafIcon } from '../Common/BotanicalDecor';

export const GoalsView: React.FC = () => {
  const { token, profile } = useAuth();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [myGoals, setMyGoals] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCatalog(data.catalog || []);
        setMyGoals(data.myGoals || []);
        setBadges(data.badges || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleActivateGoal = async (goalId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/goals/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white shadow-xl relative overflow-hidden border border-emerald-800/20">
        <BotanicalWatermark position="top-right" size={240} className="text-emerald-400/5 pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
            <BotanicalLeafIcon size={14} className="text-emerald-400" variant="minimal" />
            <span>Objectifs Comportementaux & Succès Durables</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Vos Victoires & Jalons Personnels
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Fixez des étapes réalistes adaptées à votre rythme biologique. Chaque journée d&apos;engagement renforce votre autonomie, votre vitalité et votre maîtrise naturelle.
          </p>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active User Goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-700" />
            <span>Mes Objectifs en Cours ({myGoals.length})</span>
          </h3>
        </div>

        {myGoals.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-emerald-950/8 text-center text-xs text-slate-500 space-y-3 shadow-xs">
            <BotanicalLeafIcon size={28} className="text-emerald-600/40 mx-auto" />
            <p className="font-semibold text-slate-700">Vous n&apos;avez pas encore d&apos;objectif actif.</p>
            <p className="max-w-md mx-auto text-slate-500">Choisissez un défi dans le catalogue ci-dessous pour démarrer votre progression pas à pas !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGoals.map((ug) => (
              <div key={ug.id} className="p-5 rounded-3xl bg-white border border-emerald-950/10 shadow-[0_4px_20px_-4px_rgba(6,78,59,0.06)] space-y-3 hover:border-emerald-700/30 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <BotanicalLeafIcon size={10} className="text-emerald-600" variant="minimal" />
                    <span>En cours</span>
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Cible : {ug.customTargetDays} jours
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{ug.title}</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Progression</span>
                    <span className="font-bold text-emerald-800">{ug.currentStreakDays} / {ug.customTargetDays} j</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-950/5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (ug.currentStreakDays / ug.customTargetDays) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog of Goals */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Catalogue des Objectifs Disponibles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((catGoal) => {
            const isAlreadyActive = myGoals.some((g) => g.goalId === catGoal.id && g.status === 'active');
            return (
              <div key={catGoal.id} className="p-5 rounded-3xl bg-white border border-emerald-950/8 shadow-xs hover:border-emerald-700/25 transition flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    {catGoal.category === 'reduction' ? 'Réduction THC' : catGoal.category === 'cessation' ? 'Arrêt Définitif' : 'Bien-Être & Rituels'}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900">{catGoal.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{catGoal.description}</p>
                </div>

                <div className="pt-3 border-t border-emerald-950/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{catGoal.defaultTargetDays} jours</span>
                  <button
                    disabled={isAlreadyActive}
                    onClick={() => handleActivateGoal(catGoal.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isAlreadyActive
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-700" />
                    <span>{isAlreadyActive ? 'Déjà actif' : 'Activer cet objectif'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Rewards Showcase */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Badges & Succès Débloquables</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {badges.map((badge, idx) => (
            <div
              key={badge.id || idx}
              className="p-4 rounded-3xl bg-white border border-emerald-950/8 shadow-xs text-center space-y-2 hover:border-amber-300 transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-xl shadow-xs group-hover:scale-105 transition-transform">
                🏆
              </div>
              <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
              <p className="text-[11px] text-slate-500 leading-tight">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
