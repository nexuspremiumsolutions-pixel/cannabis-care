import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Trophy,
  Flame,
  Gift,
  Share2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Tag,
  QrCode,
  Compass,
  HeartHandshake,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { UserLoyaltySummary } from '../../../backend/services/loyalty/loyaltyService';
import { RewardCard } from './RewardCard';
import { BadgeCard } from './BadgeCard';
import { ChallengeCard } from './ChallengeCard';
import { VoucherModal } from './VoucherModal';
import { Reward, RewardRedemption } from '../../types/entities';
import { BotanicalWatermark, BotanicalBadge, BotanicalLeafIcon } from '../Common/BotanicalDecor';

export const LoyaltyView: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<UserLoyaltySummary | null>(null);
  const [rewardsList, setRewardsList] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rewards' | 'challenges' | 'badges' | 'history' | 'referral'
  >('overview');

  // Modals & feedback
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null);
  const [selectedRewardTitle, setSelectedRewardTitle] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [selectedRewardFilter, setSelectedRewardFilter] = useState<string>('ALL');

  const fetchLoyaltyData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [sumRes, rewRes] = await Promise.all([
        fetch(`/api/loyalty/summary?userId=${user.id}`, {
          headers: { 'x-user-id': user.id },
        }),
        fetch('/api/loyalty/rewards'),
      ]);

      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data.summary);
      }
      if (rewRes.ok) {
        const rData = await rewRes.json();
        setRewardsList(rData.rewards || []);
      }
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyData();
  }, [user]);

  // Flash message helper
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Redeem Reward Action
  const handleRedeemReward = async (rewardId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/loyalty/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, rewardId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback(
          'success',
          `Félicitations ! Vous avez obtenu : ${data.reward.title}. Votre code a été généré.`
        );
        setSelectedRewardTitle(data.reward.title);
        setSelectedRedemption(data.redemption);
        fetchLoyaltyData();
      } else {
        showFeedback('error', data.error || "Impossible d'obtenir cette récompense.");
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // 2. Cancel / Refund Redemption
  const handleCancelRedemption = async (redemptionId: string) => {
    try {
      const res = await fetch('/api/loyalty/redemptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redemptionId,
          reason: "Annulation demandée par l'utilisateur",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Bon annulé et points remboursés sur votre compte !');
        setSelectedRedemption(null);
        fetchLoyaltyData();
      } else {
        showFeedback('error', data.error || "Impossible d'annuler le bon.");
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // 3. Challenge Actions
  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/loyalty/challenges/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, challengeId }),
      });
      if (res.ok) {
        showFeedback('success', 'Défi rejoint ! Bon courage dans votre progression.');
        fetchLoyaltyData();
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleProgressChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/loyalty/challenges/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, challengeId, increment: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.completed) {
          showFeedback(
            'success',
            `🎉 Défi relevé avec succès ! +${data.pointsAwarded} points crédités !`
          );
        } else {
          showFeedback('success', 'Étape validée avec succès !');
        }
        fetchLoyaltyData();
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleAbandonChallenge = async (challengeId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/loyalty/challenges/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, challengeId }),
      });
      if (res.ok) {
        showFeedback('success', 'Défi abandonné sans pénalité sur vos points.');
        fetchLoyaltyData();
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // 4. Validate Daily Streak activity
  const handleRecordStreak = async (type: 'JOURNAL' | 'WELLNESS' | 'THC_ABSTINENCE' | 'EDUCATION') => {
    if (!user) return;
    try {
      const res = await fetch('/api/loyalty/streaks/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.isNewDay) {
          showFeedback('success', `Bravo ! Série validée pour aujourd'hui (${data.streak.currentCount} jours consécutifs).`);
        } else {
          showFeedback('success', "Activité déjà comptabilisée pour aujourd'hui ! Continuez ainsi.");
        }
        fetchLoyaltyData();
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // 5. Apply Referral Code
  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !friendCodeInput.trim()) return;
    setIsApplyingReferral(true);
    try {
      const res = await fetch('/api/loyalty/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, referralCode: friendCodeInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Code de parrainage validé avec succès ! Vos récompenses seront débloquées.');
        setFriendCodeInput('');
        fetchLoyaltyData();
      } else {
        showFeedback('error', data.error || 'Code de parrainage invalide.');
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setIsApplyingReferral(false);
    }
  };

  // Copy Referral Link
  const handleCopyReferral = () => {
    if (!summary?.referral?.referralCode) return;
    navigator.clipboard.writeText(summary.referral.referralCode);
    setIsCopying(true);
    showFeedback('success', 'Code de parrainage copié dans le presse-papier !');
    setTimeout(() => setIsCopying(false), 2000);
  };

  if (isLoading || !summary) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">
          Chargement de votre programme fidélité...
        </p>
      </div>
    );
  }

  const { account, levelInfo, streaks, badges, challenges, redemptions, referral } = summary;

  const filteredRewards = rewardsList.filter((r) => {
    if (selectedRewardFilter === 'ALL') return true;
    return r.type === selectedRewardFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 max-w-md border animate-in slide-in-from-bottom-3 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span className="text-xs font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Hero Header & Tier Status */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/20 relative overflow-hidden">
        <BotanicalWatermark position="top-right" size={260} className="text-emerald-400/5 pointer-events-none" />
        
        {/* Background Decorative Element */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Level Info & Points */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                <BotanicalLeafIcon size={13} className="text-emerald-400" variant="minimal" />
                Niveau {levelInfo.currentLevel.order} • {levelInfo.currentLevel.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Multiplicateur x{levelInfo.currentLevel.multiplier}
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                Club Fidélité Botanique & Récompenses
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed">
                Chaque rituel d'auto-soin compte. Enregistrez vos routines, participez aux défis et profitez d'avantages exclusifs sur notre catalogue d'apothicaire.
              </p>
            </div>

            {/* Perks list */}
            <div className="flex flex-wrap gap-2 pt-2">
              {levelInfo.currentLevel.perks.map((perk, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-white/10 hover:bg-white/15 px-3 py-1 rounded-xl text-emerald-100 font-medium transition backdrop-blur-xs"
                >
                  ✓ {perk}
                </span>
              ))}
            </div>
          </div>

          {/* Points Counter & Level Progress Box */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 min-w-[280px] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
                  Solde disponible
                </span>
                <span className="text-3xl font-black text-white font-mono">
                  {account.pointsBalance.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-200 ml-1.5 font-bold">points</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Points à vie
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  {account.lifetimePoints.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* Progress to next level */}
            {levelInfo.nextLevel ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-emerald-200 font-medium">
                  <span>Vers Niveau {levelInfo.nextLevel.order} ({levelInfo.nextLevel.name})</span>
                  <span className="font-bold">{levelInfo.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                    style={{ width: `${levelInfo.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  Encore {levelInfo.pointsNeeded} points pour débloquer le palier supérieur
                </p>
              </div>
            ) : (
              <div className="text-xs text-amber-300 font-bold text-center py-1">
                ⭐ Niveau Maximum Atteint (Ambassadeur Botanique)
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-emerald-950/5 rounded-2xl border border-emerald-950/8">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-950 hover:bg-white/60'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-emerald-300' : 'text-slate-500'}`} />
          <span>Aperçu & Missions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-950 hover:bg-white/60'
          }`}
        >
          <Gift className={`w-3.5 h-3.5 ${activeTab === 'rewards' ? 'text-emerald-300' : 'text-slate-500'}`} />
          <span>Boutique Récompenses</span>
          {redemptions.activeVouchers.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
              {redemptions.activeVouchers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'challenges'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Séries & Défis</span>
          {challenges.active.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-teal-200 text-teal-950 text-[10px] font-black">
              {challenges.active.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Badges & Trophées ({badges.totalUnlocked}/{badges.totalAvailable})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Historique Points</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'referral'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Parrainage</span>
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. OVERVIEW TAB */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Daily Streaks Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  Vos Séries Quotidiennes
                </h3>
                <p className="text-xs text-slate-500">
                  Validez vos routines chaque jour pour maintenir vos séries et gagner des bonus.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {streaks.map((s) => {
                const getLabel = () => {
                  switch (s.type) {
                    case 'JOURNAL':
                      return { title: 'Journal de Bord', icon: BookOpen };
                    case 'WELLNESS':
                      return { title: 'Routine Bien-être', icon: Compass };
                    case 'THC_ABSTINENCE':
                      return { title: 'Journée Sans THC', icon: CheckCircle2 };
                    default:
                      return { title: 'Micro-Leçon & Guide', icon: Trophy };
                  }
                };
                const info = getLabel();
                const IconComp = info.icon;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">
                          Record : {s.longestCount}j
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{info.title}</h4>

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{s.currentCount}</span>
                        <span className="text-xs text-slate-500 font-semibold">jours d'affilée</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRecordStreak(s.type)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valider aujourd'hui (+10 pts)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Vouchers & Coupons Ready to Use */}
          {redemptions.activeVouchers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-teal-700" />
                  Vos Bons d'Achat Actifs & Prêts à l'Emploi
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('rewards')}
                  className="text-xs font-bold text-teal-800 hover:underline flex items-center gap-1"
                >
                  Voir toute la boutique <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {redemptions.activeVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border-2 border-dashed border-teal-300 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md">
                          Bon Prêt
                        </span>
                        {v.discountAmount && (
                          <span className="text-sm font-black text-slate-900">
                            -{v.discountAmount} €
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <span className="text-[11px] text-slate-400 font-mono block">Code Unique :</span>
                        <span className="text-lg font-mono font-black text-slate-900 tracking-wider">
                          {v.redemptionCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRewardTitle('Bon Partenaire Nexus');
                        setSelectedRedemption(v);
                      }}
                      className="w-full py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Afficher le code / QR</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Showcase: Active Challenges & Available Rewards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Active Challenges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Missions & Défis en cours
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('challenges')}
                  className="text-xs font-bold text-teal-800 hover:underline"
                >
                  Tous les défis
                </button>
              </div>

              {challenges.active.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                  <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    Aucun défi actif pour l'instant. Choisissez une mission pour booster vos points !
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('challenges')}
                    className="py-2 px-4 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition cursor-pointer"
                  >
                    Découvrir les défis
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.active.slice(0, 2).map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      onJoin={handleJoinChallenge}
                      onProgress={handleProgressChallenge}
                      onAbandon={handleAbandonChallenge}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Rewards Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-teal-700" />
                  Récompenses à votre portée
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('rewards')}
                  className="text-xs font-bold text-teal-800 hover:underline"
                >
                  Catalogue complet
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rewardsList.slice(0, 2).map((r) => (
                  <RewardCard
                    key={r.id}
                    reward={r}
                    userPoints={account.pointsBalance}
                    userLevelOrder={levelInfo.currentLevel.order}
                    onRedeem={handleRedeemReward}
                  />
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. REWARDS CATALOG & VOUCHERS TAB */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'rewards' && (
        <div className="space-y-8">
          
          {/* Header & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-teal-700" />
                Boutique des Récompenses Responsables
              </h3>
              <p className="text-xs text-slate-500">
                Échangez vos points contre des réductions partenaires, des produits exclusifs ou des dons pour l'environnement.
              </p>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit">
              <button
                type="button"
                onClick={() => setSelectedRewardFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRewardFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedRewardFilter('COUPON')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRewardFilter === 'COUPON' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Bons d'achat
              </button>
              <button
                type="button"
                onClick={() => setSelectedRewardFilter('EXPERIENCE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRewardFilter === 'EXPERIENCE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Ateliers
              </button>
              <button
                type="button"
                onClick={() => setSelectedRewardFilter('DONATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRewardFilter === 'DONATION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Éco-Dons
              </button>
            </div>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={account.pointsBalance}
                userLevelOrder={levelInfo.currentLevel.order}
                onRedeem={handleRedeemReward}
              />
            ))}
          </div>

          {/* User's Issued Vouchers Section */}
          <div className="pt-8 border-t border-slate-200 space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-700" />
              Historique de vos Bons d'Achat & Coupons Obtenus
            </h4>

            {summary.redemptions.activeVouchers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Vous n'avez pas encore échangé de récompense. Choisissez une offre ci-dessus !
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.redemptions.activeVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {v.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(v.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-mono font-bold text-slate-900 select-all">
                          {v.redemptionCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRewardTitle('Bon Partenaire Nexus');
                        setSelectedRedemption(v);
                      }}
                      className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      Détails & Code QR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. STREAKS & CHALLENGES TAB */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'challenges' && (
        <div className="space-y-8">
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              Catalogue des Défis & Objectifs Bien-être
            </h3>
            <p className="text-xs text-slate-500">
              Engagez-vous dans des défis stimulants adaptés à votre rythme, sans pression et sans jugement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.active.concat(
              // Add other challenges that aren't joined yet
              []
            )}
            {/* Let's fetch all challenges from API */}
            {rewardsList && challenges.active.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onJoin={handleJoinChallenge}
                onProgress={handleProgressChallenge}
                onAbandon={handleAbandonChallenge}
              />
            ))}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. BADGES & ACHIEVEMENTS TAB */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                Vos Badges & Trophées
              </h3>
              <p className="text-xs text-slate-500">
                Célébrez chaque étape franchie dans votre parcours santé et bien-être.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-extrabold">
              {badges.totalUnlocked} / {badges.totalAvailable} débloqués
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.unlocked.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. HISTORY TAB */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                Historique des Mouvements de Points
              </h3>
              <p className="text-xs text-slate-500">
                Traçabilité complète de vos gains, récompenses et bonus.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {summary.transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic">
                Aucune transaction enregistrée pour le moment.
              </div>
            ) : (
              summary.transactions.map((tx: any) => (
                <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      {tx.description}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • {tx.sourceType}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black font-mono ${
                        tx.points > 0 ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Solde : {tx.balanceAfter} pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. REFERRAL TAB */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'referral' && (
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                Parrainage Responsable & Bienveillant
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Invitez un proche dans une démarche bien-être
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Partagez votre code unique. Dès que votre filleul s'inscrit et valide ses premiers pas (journal ou première leçon), vous recevez chacun{' '}
                <strong className="text-teal-800">{referral.rewardPerReferral} points bonus</strong>.
              </p>
            </div>

            {/* My Referral Code Box */}
            <div className="bg-slate-50 border-2 border-dashed border-teal-300 rounded-2xl p-6 text-center space-y-4">
              <span className="text-xs font-semibold text-slate-500 block">
                Votre code de parrainage personnel :
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-wider">
                  {referral.referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="p-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white transition cursor-pointer shadow-xs"
                  title="Copier le code"
                >
                  {isCopying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <span className="text-2xl font-black text-slate-900">{referral.totalInvited}</span>
                <span className="text-xs text-slate-500 block font-medium mt-1">Amis invités</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <span className="text-2xl font-black text-emerald-700">{referral.totalQualified}</span>
                <span className="text-xs text-slate-500 block font-medium mt-1">Filleuls qualifiés</span>
              </div>
            </div>

            {/* Apply a friend's code */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Vous avez reçu un code de parrainage d'un ami ?
              </h4>
              <form onSubmit={handleApplyReferral} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: REF-ALEX-83FA"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
                <button
                  type="submit"
                  disabled={isApplyingReferral || !friendCodeInput.trim()}
                  className="py-2.5 px-5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isApplyingReferral ? 'Validation...' : 'Valider'}
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* Voucher Modal */}
      <VoucherModal
        redemption={selectedRedemption}
        rewardTitle={selectedRewardTitle}
        onClose={() => setSelectedRedemption(null)}
        onCancel={handleCancelRedemption}
      />

    </div>
  );
};
