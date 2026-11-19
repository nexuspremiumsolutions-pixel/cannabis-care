import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { THCStatus, CBDStatus } from '../../types/entities';
import { StepSituation } from './StepSituation';
import { StepHabits } from './StepHabits';
import { StepGoals } from './StepGoals';
import { StepWellness } from './StepWellness';
import { StepCommunication } from './StepCommunication';
import { StepPrivacyConsent } from './StepPrivacyConsent';
import { StepSummary } from './StepSummary';

export const OnboardingFlow: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { profile, saveOnboardingStep, completeAdaptiveOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(profile?.currentStep || 1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STEP 1: Situation State
  const [nickname, setNickname] = useState<string>(profile?.nickname || '');
  const [thcStatus, setThcStatus] = useState<THCStatus>(THCStatus.CURRENT_USER);
  const [cbdStatus, setCbdStatus] = useState<CBDStatus>(CBDStatus.FORMER_USER);

  // STEP 2: Habits State
  const [formerUsageDetails, setFormerUsageDetails] = useState<{
    stoppedDuration?: string;
    formerFrequency?: string;
    wantsToUnderstandPast?: boolean;
    wantsToTrackProgression?: boolean;
  }>({
    stoppedDuration: '1_to_6_months',
    formerFrequency: 'daily_once',
    wantsToUnderstandPast: true,
    wantsToTrackProgression: true,
  });

  const [thcUsage, setThcUsage] = useState<{
    frequency?: string;
    quantity?: string;
    quantityUnit?: string;
    duration?: string;
    contexts?: string[];
    motivations?: string[];
    estimatedMonthlyBudget?: number;
  }>({
    frequency: 'daily_once',
    quantity: '1 à 2',
    quantityUnit: 'joints',
    duration: '1_to_3_years',
    contexts: ['alone_evening', 'stress_relief'],
    motivations: ['relaxation', 'sleep_aid'],
    estimatedMonthlyBudget: 60,
  });

  const [cbdUsage, setCbdUsage] = useState<{
    currentUse?: string;
    consumptionMethods?: string[];
    preferredProductTypes?: string[];
    products?: any[];
  }>({
    currentUse: 'occasional',
    consumptionMethods: ['oil_drops', 'edibles_beverages'],
    preferredProductTypes: ['oil', 'infusions'],
    products: [],
  });

  // STEP 3: Goals State
  const [thcGoal, setThcGoal] = useState<string>('reduce');
  const [reductionMotivations, setReductionMotivations] = useState<string[]>([
    'general_health',
    'mental_clarity',
    'save_money',
  ]);

  // STEP 4: Wellness State
  const [trackedCategories, setTrackedCategories] = useState<string[]>([
    'sleep',
    'physical_activity',
    'relaxation',
    'hydration',
  ]);
  const [sleepDetails, setSleepDetails] = useState<{
    averageDurationHours?: number;
    declaredQualityRating?: number;
    sleepOnsetDifficulty?: string;
    nightAwakenings?: string;
    generalSatisfaction?: string;
  }>({
    averageDurationHours: 7,
    declaredQualityRating: 3,
    sleepOnsetDifficulty: 'sometimes',
    nightAwakenings: '1_to_2',
    generalSatisfaction: 'medium',
  });
  const [physicalActivityDetails, setPhysicalActivityDetails] = useState<{
    frequency?: string;
    activityTypes?: string[];
  }>({
    frequency: '1_2_per_week',
    activityTypes: ['walking'],
  });

  // STEP 5: Communication State
  const [communication, setCommunication] = useState<{
    preferredTone?: 'neutral' | 'motivating' | 'benevolent' | 'direct' | 'pedagogical';
    preferredContentTypes?: string[];
    remindersEnabled?: boolean;
    journalReminderEnabled?: boolean;
    goalReminderEnabled?: boolean;
    encouragementsEnabled?: boolean;
    weeklySummaryEnabled?: boolean;
    programRemindersEnabled?: boolean;
    educationalUpdatesEnabled?: boolean;
    reminderTime?: string;
  }>({
    preferredTone: 'benevolent',
    preferredContentTypes: ['short_tips', 'statistics', 'journal', 'goals'],
    remindersEnabled: true,
    journalReminderEnabled: true,
    goalReminderEnabled: true,
    encouragementsEnabled: true,
    weeklySummaryEnabled: true,
    programRemindersEnabled: true,
    educationalUpdatesEnabled: false,
    reminderTime: '20:30',
  });

  // STEP 6: Privacy & Consents State
  const [consents, setConsents] = useState<{
    experiencePersonalization?: boolean;
    healthDisclaimer?: boolean;
    remindersNotifications?: boolean;
    anonymizedResearchTelemetry?: boolean;
  }>({
    experiencePersonalization: true,
    healthDisclaimer: true,
    remindersNotifications: true,
    anonymizedResearchTelemetry: false,
  });

  // Handle Next Step
  const handleNext = async () => {
    setErrorMessage(null);

    // Validation for Step 6: Required consents
    if (currentStep === 6) {
      if (!consents.experiencePersonalization || !consents.healthDisclaimer) {
        setErrorMessage(
          'Veuillez valider la personnalisation du profil et la charte déontologique pour continuer.'
        );
        return;
      }
    }

    // Save draft asynchronously
    const stepData = {
      step: currentStep,
      nickname,
      thcStatus,
      cbdStatus,
      formerUsageDetails,
      thcUsage,
      cbdUsage,
      thcGoal,
      reductionMotivations,
      trackedCategories,
      sleepDetails,
      physicalActivityDetails,
      communication,
      consents,
    };

    saveOnboardingStep(currentStep, stepData);

    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const fullPayload = {
      nickname: nickname || profile?.nickname || 'Ami(e)',
      thcStatus,
      cbdStatus,
      formerUsageDetails,
      thcUsage,
      cbdUsage,
      goals: {
        thcGoal,
        reductionMotivations,
        wishedReductionTimeline: '3_months',
      },
      wellness: {
        trackedCategories,
        sleep: sleepDetails,
        physicalActivity: physicalActivityDetails,
      },
      communication,
      consents,
    };

    const res = await completeAdaptiveOnboarding(fullPayload);
    setIsSubmitting(false);

    if (res.success) {
      onFinished();
    } else {
      setErrorMessage(res.error || 'Erreur lors de la finalisation du profil.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#042416] border border-amber-400/50 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
                alt="Logo officiel CANNABIS CARE"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-teal-400 font-bold block">
                Nexus Premium Solutions
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                CANNABIS CARE — Profil & Accompagnement
              </h2>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-300 bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700">
            Étape {currentStep} sur 7
          </div>
        </div>

        {/* Visual Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-teal-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          {currentStep === 1 && (
            <StepSituation
              thcStatus={thcStatus}
              setThcStatus={setThcStatus}
              cbdStatus={cbdStatus}
              setCbdStatus={setCbdStatus}
              nickname={nickname}
              setNickname={setNickname}
            />
          )}

          {currentStep === 2 && (
            <StepHabits
              thcStatus={thcStatus}
              formerUsageDetails={formerUsageDetails}
              setFormerUsageDetails={setFormerUsageDetails}
              thcUsage={thcUsage}
              setThcUsage={setThcUsage}
              cbdStatus={cbdStatus}
              cbdUsage={cbdUsage}
              setCbdUsage={setCbdUsage}
            />
          )}

          {currentStep === 3 && (
            <StepGoals
              thcStatus={thcStatus}
              thcGoal={thcGoal}
              setThcGoal={setThcGoal}
              reductionMotivations={reductionMotivations}
              setReductionMotivations={setReductionMotivations}
              cbdStatus={cbdStatus}
            />
          )}

          {currentStep === 4 && (
            <StepWellness
              trackedCategories={trackedCategories}
              setTrackedCategories={setTrackedCategories}
              sleepDetails={sleepDetails}
              setSleepDetails={setSleepDetails}
              physicalActivityDetails={physicalActivityDetails}
              setPhysicalActivityDetails={setPhysicalActivityDetails}
            />
          )}

          {currentStep === 5 && (
            <StepCommunication
              communication={communication}
              setCommunication={setCommunication}
            />
          )}

          {currentStep === 6 && (
            <StepPrivacyConsent consents={consents} setConsents={setConsents} />
          )}

          {currentStep === 7 && (
            <StepSummary
              thcStatus={thcStatus}
              cbdStatus={cbdStatus}
              thcGoal={thcGoal}
              nickname={nickname}
              trackedCategories={trackedCategories}
              isSubmitting={isSubmitting}
              onConfirm={handleFinalize}
            />
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {currentStep < 7 && (
          <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
