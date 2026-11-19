import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
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
  Clock,
  Calendar,
  Tag,
  Check,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileType, THCStatus, CBDStatus } from '../../types/entities';

export type AddModalType =
  | 'sleep'
  | 'mood'
  | 'stress'
  | 'energy'
  | 'activity'
  | 'nutrition'
  | 'hydration'
  | 'relaxation'
  | 'note'
  | 'event'
  | 'thc'
  | 'cbd'
  | 'craving';

interface UnifiedAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialType?: AddModalType;
  initialDate?: string;
  itemToEdit?: any;
}

export const UnifiedAddModal: React.FC<UnifiedAddModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialType = 'mood',
  initialDate,
  itemToEdit,
}) => {
  const { token, profile } = useAuth();
  const [selectedType, setSelectedType] = useState<AddModalType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common fields
  const [entryDate, setEntryDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [entryTime, setEntryTime] = useState<string>(
    new Date().toTimeString().substring(0, 5)
  );

  // 1. Sleep state
  const [bedTime, setBedTime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [nightAwakenings, setNightAwakenings] = useState(0);
  const [sleepNotes, setSleepNotes] = useState('');

  // 2. Mood state
  const [moodRating, setMoodRating] = useState(4);
  const [primaryMood, setPrimaryMood] = useState('Serein');
  const [moodNotes, setMoodNotes] = useState('');

  // 3. Stress state
  const [stressRating, setStressRating] = useState(2);
  const [stressFactors, setStressFactors] = useState<string[]>([]);
  const [stressNotes, setStressNotes] = useState('');

  // 4. Energy state
  const [energyRating, setEnergyRating] = useState(4);
  const [energySlot, setEnergySlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [energyNotes, setEnergyNotes] = useState('');

  // 5. Activity state
  const [activityType, setActivityType] = useState('marche');
  const [customActivityName, setCustomActivityName] = useState('');
  const [activityDuration, setActivityDuration] = useState(30);
  const [activityIntensity, setActivityIntensity] = useState<'douce' | 'moderee' | 'soutenue'>('moderee');
  const [activityNotes, setActivityNotes] = useState('');

  // 6. Nutrition state
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [nutritionQuality, setNutritionQuality] = useState(4);
  const [appetite, setAppetite] = useState<'faible' | 'normal' | 'bon' | 'tres_bon'>('bon');
  const [nutritionNotes, setNutritionNotes] = useState('');

  // 7. Hydration state
  const [amountMl, setAmountMl] = useState(500);
  const [glassCount, setGlassCount] = useState(2);
  const [hydrationNotes, setHydrationNotes] = useState('');

  // 8. Relaxation state
  const [relaxationType, setRelaxationType] = useState('respiration');
  const [customRelaxationName, setCustomRelaxationName] = useState('');
  const [relaxationDuration, setRelaxationDuration] = useState(15);
  const [relaxationBenefit, setRelaxationBenefit] = useState(4);
  const [relaxationNotes, setRelaxationNotes] = useState('');

  // 9. Personal Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // 10. Life Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<string>('vacances');
  const [eventImpact, setEventImpact] = useState<'positive' | 'neutral' | 'challenging'>('positive');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTags, setEventTags] = useState<string[]>([]);

  // 11. THC state
  const [thcProductType, setThcProductType] = useState('THC_herb');
  const [thcProductName, setThcProductName] = useState('Cannabis THC');
  const [thcQuantity, setThcQuantity] = useState(1);
  const [thcUnit, setThcUnit] = useState('joints');
  const [thcMode, setThcMode] = useState('combustion');
  const [thcContext, setThcContext] = useState('Soirée à la maison');
  const [thcMoodBefore, setThcMoodBefore] = useState(3);
  const [thcMoodAfter, setThcMoodAfter] = useState(3);
  const [thcCost, setThcCost] = useState(5);
  const [thcNotes, setThcNotes] = useState('');

  // 12. CBD state
  const [cbdProductName, setCbdProductName] = useState('Huile CBD 10%');
  const [cbdCategory, setCbdCategory] = useState('oil');
  const [cbdMethod, setCbdMethod] = useState('sublingual');
  const [cbdQuantity, setCbdQuantity] = useState(3);
  const [cbdUnit, setCbdUnit] = useState('drops');
  const [cbdContext, setCbdContext] = useState('Avant le coucher');
  const [cbdEffects, setCbdEffects] = useState<string[]>(['détente']);
  const [cbdNotes, setCbdNotes] = useState('');

  // 13. Craving state
  const [cravingIntensity, setCravingIntensity] = useState(6);
  const [cravingTrigger, setCravingTrigger] = useState('Stress de fin de journée');
  const [cravingContext, setCravingContext] = useState('Après le travail');
  const [cravingDuration, setCravingDuration] = useState(15);
  const [cravingStrategy, setCravingStrategy] = useState('breathing_4d');
  const [cravingOutcome, setCravingOutcome] = useState('craving_passed');
  const [cravingNotes, setCravingNotes] = useState('');

  // Reset or prefill on open
  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
    if (initialDate) {
      setEntryDate(initialDate);
    } else {
      setEntryDate(new Date().toISOString().split('T')[0]);
    }
    setEntryTime(new Date().toTimeString().substring(0, 5));
    setErrorMessage(null);

    if (itemToEdit) {
      // Prefill if editing
      if (itemToEdit.content !== undefined) {
        // Note
        setSelectedType('note');
        setNoteTitle(itemToEdit.title || '');
        setNoteContent(itemToEdit.content || '');
        setNoteTags(itemToEdit.tags || []);
        if (itemToEdit.date) setEntryDate(itemToEdit.date);
        if (itemToEdit.time) setEntryTime(itemToEdit.time);
      } else if (itemToEdit.bedTime !== undefined) {
        // Sleep
        setSelectedType('sleep');
        setBedTime(itemToEdit.bedTime || '23:30');
        setWakeTime(itemToEdit.wakeTime || '07:30');
        setSleepQuality(itemToEdit.sleepQuality || 4);
        setNightAwakenings(itemToEdit.nightAwakenings || 0);
        setSleepNotes(itemToEdit.notes || '');
        if (itemToEdit.date) setEntryDate(itemToEdit.date);
      }
    }
  }, [isOpen, initialType, initialDate, itemToEdit]);

  if (!isOpen) return null;

  // Determine available dynamic menu items based on profile
  const isTHCRelevant =
    profile?.profileType === ProfileType.THC ||
    profile?.thcStatus === THCStatus.CURRENT_USER ||
    profile?.thcStatus === THCStatus.FORMER_USER;

  const isCBDRelevant =
    profile?.profileType === ProfileType.CBD ||
    profile?.cbdStatus === CBDStatus.CURRENT_USER ||
    profile?.cbdStatus === CBDStatus.FORMER_USER;

  const menuOptions: { type: AddModalType; label: string; icon: any; color: string; bg: string }[] = [
    { type: 'sleep', label: 'Sommeil', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    { type: 'mood', label: 'Humeur', icon: Smile, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { type: 'stress', label: 'Stress', icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    { type: 'energy', label: 'Énergie', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    { type: 'activity', label: 'Activité', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { type: 'relaxation', label: 'Relaxation', icon: Feather, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
    { type: 'hydration', label: 'Hydratation', icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
    { type: 'nutrition', label: 'Alimentation', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
    { type: 'note', label: 'Note', icon: StickyNote, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { type: 'event', label: 'Événement', icon: Flag, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  ];

  if (isTHCRelevant) {
    menuOptions.push(
      { type: 'thc', label: 'Prise THC', icon: Shield, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-300' },
      { type: 'craving', label: 'Envie / Craving', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' }
    );
  }

  // CBD option is accessible to everyone or highlighted if relevant
  menuOptions.push({
    type: 'cbd',
    label: 'Prise CBD',
    icon: Leaf,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-300',
  });

  // Calculate duration display for sleep
  const [bH, bM] = bedTime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let sleepDurationMin = 0;
  if (!isNaN(bH) && !isNaN(bM) && !isNaN(wH) && !isNaN(wM)) {
    let bedM = bH * 60 + bM;
    let wakeM = wH * 60 + wM;
    if (wakeM < bedM) wakeM += 24 * 60;
    sleepDurationMin = wakeM - bedM;
  }
  const sleepHours = Math.floor(sleepDurationMin / 60);
  const sleepRemainMin = sleepDurationMin % 60;

  // Toggle factor selection
  const toggleFactor = (f: string) => {
    if (stressFactors.includes(f)) {
      setStressFactors(stressFactors.filter((item) => item !== f));
    } else {
      setStressFactors([...stressFactors, f]);
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase();
    if (!noteTags.includes(cleanTag)) {
      setNoteTags([...noteTags, cleanTag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNoteTags(noteTags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let endpoint = '/api/journal';
      let payload: any = {};

      switch (selectedType) {
        case 'sleep':
          endpoint = '/api/journal/sleep';
          payload = {
            date: entryDate,
            bedTime,
            wakeTime,
            sleepQuality,
            nightAwakenings,
            durationMinutes: sleepDurationMin,
            notes: sleepNotes,
          };
          break;

        case 'mood':
          endpoint = '/api/journal/mood';
          payload = {
            date: entryDate,
            time: entryTime,
            rating: moodRating,
            primaryMood,
            notes: moodNotes,
          };
          break;

        case 'stress':
          endpoint = '/api/journal/stress';
          payload = {
            date: entryDate,
            time: entryTime,
            rating: stressRating,
            influencingFactors: stressFactors,
            notes: stressNotes,
          };
          break;

        case 'energy':
          endpoint = '/api/journal/energy';
          payload = {
            date: entryDate,
            time: entryTime,
            rating: energyRating,
            timeOfDay: energySlot,
            notes: energyNotes,
          };
          break;

        case 'activity':
          endpoint = '/api/journal/activity';
          payload = {
            date: entryDate,
            time: entryTime,
            activityType,
            customActivityName: customActivityName || undefined,
            durationMinutes: activityDuration,
            intensity: activityIntensity,
            notes: activityNotes,
          };
          break;

        case 'nutrition':
          endpoint = '/api/journal/nutrition';
          payload = {
            date: entryDate,
            time: entryTime,
            mealType,
            perceivedQuality: nutritionQuality,
            appetite,
            notes: nutritionNotes,
          };
          break;

        case 'hydration':
          endpoint = '/api/journal/hydration';
          payload = {
            date: entryDate,
            time: entryTime,
            amountMl,
            glassCount,
            notes: hydrationNotes,
          };
          break;

        case 'relaxation':
          endpoint = '/api/journal/relaxation';
          payload = {
            date: entryDate,
            time: entryTime,
            activityType: relaxationType,
            customActivityName: customRelaxationName || undefined,
            durationMinutes: relaxationDuration,
            perceivedBenefit: relaxationBenefit,
            notes: relaxationNotes,
          };
          break;

        case 'note':
          if (itemToEdit?.id) {
            endpoint = `/api/journal/notes/${itemToEdit.id}`;
          } else {
            endpoint = '/api/journal/notes';
          }
          payload = {
            date: entryDate,
            time: entryTime,
            title: noteTitle || null,
            content: noteContent,
            tags: noteTags,
          };
          break;

        case 'event':
          endpoint = '/api/journal/events';
          payload = {
            date: entryDate,
            time: entryTime,
            title: eventTitle,
            category: eventCategory,
            impact: eventImpact,
            description: eventDescription,
            tags: eventTags,
          };
          break;

        case 'thc':
          endpoint = '/api/journal';
          payload = {
            date: entryDate,
            time: entryTime,
            productType: thcProductType,
            productName: thcProductName,
            quantity: thcQuantity,
            unit: thcUnit,
            consumptionMode: thcMode,
            context: thcContext,
            moodBefore: thcMoodBefore,
            moodAfter: thcMoodAfter,
            costEstimated: thcCost,
            personalNotes: thcNotes,
          };
          break;

        case 'cbd':
          endpoint = '/api/cbd/consumptions';
          payload = {
            date: entryDate,
            time: entryTime,
            productName: cbdProductName,
            productType: cbdCategory,
            consumptionMethod: cbdMethod,
            quantity: cbdQuantity,
            quantityUnit: cbdUnit,
            context: cbdContext,
            subjectiveEffects: cbdEffects,
            notes: cbdNotes,
          };
          break;

        case 'craving':
          endpoint = '/api/thc-journey/cravings';
          payload = {
            date: entryDate,
            time: entryTime,
            intensity: cravingIntensity,
            trigger: cravingTrigger,
            context: cravingContext,
            durationMinutes: cravingDuration,
            copingMethod: cravingStrategy,
            outcome: cravingOutcome,
            consumedAfter: cravingOutcome === 'consumed',
            notes: cravingNotes,
          };
          break;
      }

      const method = itemToEdit?.id && selectedType === 'note' ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de l'enregistrement.");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {itemToEdit ? 'Modifier une entrée' : 'Ajouter à mon journal'}
            </h3>
            <p className="text-xs text-slate-500">
              Observation bienveillante & sans jugement de vos rituels et habitudes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Selector Tabs (horizontal scrollable pills) */}
        {!itemToEdit && (
          <div className="px-6 py-2.5 border-b border-slate-100 bg-white overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(opt.type);
                    setErrorMessage(null);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-300' : opt.color}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Heure
              </label>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* 1. SLEEP FORM */}
          {selectedType === 'sleep' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heure de coucher</label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heure de réveil</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold">Durée calculée de sommeil :</span>
                </div>
                <span className="font-bold text-sm text-indigo-700">
                  {sleepHours} h {sleepRemainMin.toString().padStart(2, '0')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qualité de sommeil perçue ({sleepQuality}/5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSleepQuality(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        sleepQuality === val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {val}★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de réveils nocturnes : {nightAwakenings}
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setNightAwakenings(cnt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        nightAwakenings === cnt
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cnt === 4 ? '4+' : cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note libre sur votre nuit</label>
                <input
                  type="text"
                  placeholder="Ex : Réveil en forme, rêves vifs, léger retard d'endormissement..."
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 2. MOOD FORM */}
          {selectedType === 'mood' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Comment vous sentez-vous ?</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { rating: 1, emoji: '😞', label: 'Difficile' },
                    { rating: 2, emoji: '🙁', label: 'Mitigé' },
                    { rating: 3, emoji: '😐', label: 'Neutre' },
                    { rating: 4, emoji: '🙂', label: 'Agréable' },
                    { rating: 5, emoji: '😄', label: 'Excellent' },
                  ].map((m) => (
                    <button
                      key={m.rating}
                      type="button"
                      onClick={() => {
                        setMoodRating(m.rating);
                        if (!moodNotes) setPrimaryMood(m.label);
                      }}
                      className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border transition cursor-pointer ${
                        moodRating === m.rating
                          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 text-slate-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl mb-1">{m.emoji}</span>
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot-clé d'état émotionnel</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Serein', 'Motivé', 'Calme', 'Fatigué', 'Anxieux', 'Joyeux', 'Irrité', 'Concentré'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPrimaryMood(k)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                        primaryMood === k
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou précisez un ressenti..."
                  value={primaryMood}
                  onChange={(e) => setPrimaryMood(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commentaire facultatif</label>
                <input
                  type="text"
                  placeholder="Ex : Bonne discussion avec un ami, journée stimulante..."
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 3. STRESS FORM */}
          {selectedType === 'stress' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Niveau de stress perçu ({stressRating}/5)
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { val: 1, label: 'Très faible' },
                    { val: 2, label: 'Léger' },
                    { val: 3, label: 'Modéré' },
                    { val: 4, label: 'Élevé' },
                    { val: 5, label: 'Très élevé' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setStressRating(s.val)}
                      className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                        stressRating === s.val
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <div className="text-sm">{s.val}</div>
                      <div className="text-[9px] font-normal">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qu&apos;est-ce qui a influencé votre niveau de stress ?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Travail',
                    'Famille',
                    'Finances',
                    'Sommeil',
                    'Relations',
                    'Événement imprévu',
                    'Environnement / Bruit',
                    'Autre',
                  ].map((f) => {
                    const active = stressFactors.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFactor(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-rose-700" />}
                        <span>{f}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commentaire libre</label>
                <input
                  type="text"
                  placeholder="Ex : Réunion chargée mais bonne coupure ensuite..."
                  value={stressNotes}
                  onChange={(e) => setStressNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 4. ENERGY FORM */}
          {selectedType === 'energy' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Moment de la journée</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { slot: 'morning', label: 'Matin' },
                    { slot: 'afternoon', label: 'Après-midi' },
                    { slot: 'evening', label: 'Soir' },
                  ].map((s) => (
                    <button
                      key={s.slot}
                      type="button"
                      onClick={() => setEnergySlot(s.slot as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        energySlot === s.slot
                          ? 'bg-yellow-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Niveau d&apos;énergie ({energyRating}/5)
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { val: 1, label: 'Épuisé' },
                    { val: 2, label: 'Bas' },
                    { val: 3, label: 'Moyen' },
                    { val: 4, label: 'Dynamique' },
                    { val: 5, label: 'Plein essor' },
                  ].map((e) => (
                    <button
                      key={e.val}
                      type="button"
                      onClick={() => setEnergyRating(e.val)}
                      className={`flex-1 py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                        energyRating === e.val
                          ? 'bg-yellow-500 text-slate-950 shadow-xs font-extrabold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <div className="text-sm">{e.val}⚡</div>
                      <div className="text-[9px] font-normal">{e.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note facultative</label>
                <input
                  type="text"
                  placeholder="Ex : Bon coup de boost après la marche..."
                  value={energyNotes}
                  onChange={(e) => setEnergyNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 5. ACTIVITY FORM */}
          {selectedType === 'activity' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Type d&apos;activité</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'marche', label: 'Marche' },
                    { type: 'course', label: 'Course' },
                    { type: 'musculation', label: 'Musculation' },
                    { type: 'velo', label: 'Vélo' },
                    { type: 'yoga', label: 'Yoga' },
                    { type: 'natation', label: 'Natation' },
                    { type: 'sport_collectif', label: 'Sport d’équipe' },
                    { type: 'mobilite', label: 'Étirements' },
                    { type: 'autre', label: 'Autre' },
                  ].map((act) => (
                    <button
                      key={act.type}
                      type="button"
                      onClick={() => setActivityType(act.type)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        activityType === act.type
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {activityType === 'autre' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l&apos;activité</label>
                  <input
                    type="text"
                    placeholder="Ex : Escalade, Randonnée, Danse..."
                    value={customActivityName}
                    onChange={(e) => setCustomActivityName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Intensité</label>
                  <select
                    value={activityIntensity}
                    onChange={(e) => setActivityIntensity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  >
                    <option value="douce">Douce</option>
                    <option value="moderee">Modérée</option>
                    <option value="soutenue">Soutenue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commentaire</label>
                <input
                  type="text"
                  placeholder="Ex : 5 km au parc, bonne aération d'esprit..."
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 6. NUTRITION FORM */}
          {selectedType === 'nutrition' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type de repas</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'breakfast', label: 'Petit-déj' },
                    { id: 'lunch', label: 'Déjeuner' },
                    { id: 'dinner', label: 'Dîner' },
                    { id: 'snack', label: 'Collation' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMealType(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        mealType === m.id
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Qualité perçue ({nutritionQuality}/5)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setNutritionQuality(q)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                          nutritionQuality === q ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Appétit</label>
                  <select
                    value={appetite}
                    onChange={(e) => setAppetite(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                  >
                    <option value="faible">Faible</option>
                    <option value="normal">Normal</option>
                    <option value="bon">Bon</option>
                    <option value="tres_bon">Très bon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note facultative</label>
                <input
                  type="text"
                  placeholder="Ex : Repas équilibré cuisiné maison..."
                  value={nutritionNotes}
                  onChange={(e) => setNutritionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 7. HYDRATION FORM */}
          {selectedType === 'hydration' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantité d&apos;eau bue</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { ml: 250, label: '1 verre (250 ml)' },
                    { ml: 500, label: 'Gourde (500 ml)' },
                    { ml: 1000, label: '1 Litre' },
                    { ml: 1500, label: '1.5 Litre' },
                  ].map((h) => (
                    <button
                      key={h.ml}
                      type="button"
                      onClick={() => {
                        setAmountMl(h.ml);
                        setGlassCount(Math.round(h.ml / 250));
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                        amountMl === h.ml
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Volume précis (ml)</label>
                  <input
                    type="number"
                    step="50"
                    min="50"
                    max="5000"
                    value={amountMl}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAmountMl(v);
                      setGlassCount(Math.round(v / 250));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de verres</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={glassCount}
                    onChange={(e) => {
                      const g = Number(e.target.value);
                      setGlassCount(g);
                      setAmountMl(g * 250);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note libre</label>
                <input
                  type="text"
                  placeholder="Ex : Eau citronnée, tisane sans sucre..."
                  value={hydrationNotes}
                  onChange={(e) => setHydrationNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 8. RELAXATION FORM */}
          {selectedType === 'relaxation' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Activité de relaxation</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'respiration', label: 'Cohérence cardiaque / 4D' },
                    { type: 'meditation', label: 'Méditation / Pleine conscience' },
                    { type: 'promenade', label: 'Promenade nature' },
                    { type: 'lecture', label: 'Lecture au calme' },
                    { type: 'musique', label: 'Écoute musicale' },
                    { type: 'relaxation_musculaire', label: 'Relaxation corporelle' },
                    { type: 'activite_sociale', label: 'Échange bienveillant' },
                    { type: 'autre', label: 'Autre rituel' },
                  ].map((r) => (
                    <button
                      key={r.type}
                      type="button"
                      onClick={() => setRelaxationType(r.type)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                        relaxationType === r.type
                          ? 'bg-teal-700 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={relaxationDuration}
                    onChange={(e) => setRelaxationDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bénéfice perçu ({relaxationBenefit}/5)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setRelaxationBenefit(b)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                          relaxationBenefit === b ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ressenti / Commentaire</label>
                <input
                  type="text"
                  placeholder="Ex : Sensation d'apaisement respiratoire instantané..."
                  value={relaxationNotes}
                  onChange={(e) => setRelaxationNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 9. PERSONAL NOTE FORM */}
          {selectedType === 'note' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de la note (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex : Bilan de ma journée, Pensée du soir, Idée..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contenu de la note *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Écrivez librement ce que vous souhaitez consigner..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  Tags associés
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {noteTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-purple-600 hover:text-purple-900 ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter un tag (ex: sport, travail, sérénité)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Tag
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 10. LIFE EVENT FORM */}
          {selectedType === 'event' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l&apos;événement *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Début des vacances, Reprise du travail, Examen réussi..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  >
                    <option value="vacances">Vacances / Congés</option>
                    <option value="travail">Travail / Professionnel</option>
                    <option value="examen">Examen / Échéance</option>
                    <option value="competition">Compétition / Défi</option>
                    <option value="famille">Famille / Personnel</option>
                    <option value="social">Sortie sociale</option>
                    <option value="habitudes">Changement d’habitude</option>
                    <option value="objectif">Objectif atteint</option>
                    <option value="autre">Autre événement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Impact perçu</label>
                  <select
                    value={eventImpact}
                    onChange={(e) => setEventImpact(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  >
                    <option value="positive">Positif / Épanouissant</option>
                    <option value="neutral">Neutre / Quotidien</option>
                    <option value="challenging">Exigeant / Demandeur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Contexte</label>
                <textarea
                  rows={3}
                  placeholder="Détails pour se rappeler du contexte lors des bilans..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* 11. THC CONSUMPTION FORM */}
          {selectedType === 'thc' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Produit</label>
                  <select
                    value={thcProductType}
                    onChange={(e) => {
                      setThcProductType(e.target.value);
                      if (e.target.value === 'THC_herb') setThcProductName('Fleurs séchées');
                      if (e.target.value === 'THC_resin') setThcProductName('Résine / Haschich');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  >
                    <option value="THC_herb">Fleurs THC</option>
                    <option value="THC_resin">Résine THC</option>
                    <option value="THC_edible">Alimentaire</option>
                    <option value="other">Autre format</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mode de prise</label>
                  <select
                    value={thcMode}
                    onChange={(e) => setThcMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  >
                    <option value="combustion">Combustion (Fumée)</option>
                    <option value="vaporisation">Vaporisation (Herbes)</option>
                    <option value="ingestion">Ingestion</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={thcQuantity}
                    onChange={(e) => setThcQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unité</label>
                  <select
                    value={thcUnit}
                    onChange={(e) => setThcUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="joints">Joint(s)</option>
                    <option value="g">Gramme(s)</option>
                    <option value="sessions">Session(s)</option>
                    <option value="puffs">Bouffée(s)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contexte de la prise</label>
                <input
                  type="text"
                  placeholder="Ex : Soirée seul, avec des amis, après le travail..."
                  value={thcContext}
                  onChange={(e) => setThcContext(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Humeur avant ({thcMoodBefore}/5)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setThcMoodBefore(v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                          thcMoodBefore === v ? 'bg-teal-700 text-white' : 'bg-slate-100'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Humeur après ({thcMoodAfter}/5)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setThcMoodAfter(v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                          thcMoodAfter === v ? 'bg-teal-700 text-white' : 'bg-slate-100'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note personnelle</label>
                <input
                  type="text"
                  placeholder="Remarques sans jugement..."
                  value={thcNotes}
                  onChange={(e) => setThcNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* 12. CBD CONSUMPTION FORM */}
          {selectedType === 'cbd' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nom du produit</label>
                  <input
                    type="text"
                    value={cbdProductName}
                    onChange={(e) => setCbdProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Format</label>
                  <select
                    value={cbdCategory}
                    onChange={(e) => setCbdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="oil">Huile sublinguale</option>
                    <option value="infusion">Infusion / Tisane</option>
                    <option value="flower">Fleur séchée</option>
                    <option value="capsule">Gélule</option>
                    <option value="cosmetic">Baume / Crème</option>
                    <option value="vape">Vape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={cbdQuantity}
                    onChange={(e) => setCbdQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unité</label>
                  <select
                    value={cbdUnit}
                    onChange={(e) => setCbdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="drops">Gouttes</option>
                    <option value="mg">mg</option>
                    <option value="cups">Tasses</option>
                    <option value="g">Grammes</option>
                    <option value="capsules">Gélules</option>
                    <option value="puffs">Bouffées</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Moment / Contexte</label>
                <input
                  type="text"
                  placeholder="Ex : Avant le coucher, après l'entraînement, pause calme..."
                  value={cbdContext}
                  onChange={(e) => setCbdContext(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effets observés</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Détente', 'Calme mental', 'Confort musculaire', 'Sommeil favorisé', 'Neutre'].map((eff) => {
                    const active = cbdEffects.includes(eff.toLowerCase());
                    return (
                      <button
                        key={eff}
                        type="button"
                        onClick={() => {
                          const tag = eff.toLowerCase();
                          if (cbdEffects.includes(tag)) {
                            setCbdEffects(cbdEffects.filter((x) => x !== tag));
                          } else {
                            setCbdEffects([...cbdEffects, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          active
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {eff}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 13. CRAVING FORM */}
          {selectedType === 'craving' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intensité de l&apos;envie ({cravingIntensity}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={cravingIntensity}
                  onChange={(e) => setCravingIntensity(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>1 Légère</span>
                  <span>5 Moyenne</span>
                  <span>10 Irrésistible</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Déclencheur identifié</label>
                <input
                  type="text"
                  placeholder="Ex : Fin de journée, contrariété, habitude du café..."
                  value={cravingTrigger}
                  onChange={(e) => setCravingTrigger(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stratégie 4D utilisée</label>
                  <select
                    value={cravingStrategy}
                    onChange={(e) => setCravingStrategy(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="breathing_4d">Respiration profonde</option>
                    <option value="move_walk">Changer de pièce / Marcher</option>
                    <option value="drink_water">Boire un grand verre d'eau</option>
                    <option value="timer_delay">Différer de 10 min</option>
                    <option value="occupy_activity">Activité manuelle</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue</label>
                  <select
                    value={cravingOutcome}
                    onChange={(e) => setCravingOutcome(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="craving_passed">Envie dissipée</option>
                    <option value="reduced">Intensité réduite</option>
                    <option value="postponed">Reportée</option>
                    <option value="consumed">Consommation</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-teal-700 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer dans mon journal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
