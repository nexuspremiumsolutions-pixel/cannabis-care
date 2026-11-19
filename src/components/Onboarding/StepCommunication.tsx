import React from 'react';
import { MessageSquare, Bell, Sparkles, Check } from 'lucide-react';

interface StepCommunicationProps {
  communication: {
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
  };
  setCommunication: React.Dispatch<React.SetStateAction<{
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
  }>>;
}

export const StepCommunication: React.FC<StepCommunicationProps> = ({
  communication,
  setCommunication,
}) => {
  const tones = [
    {
      id: 'benevolent',
      label: 'Bienveillant & Rassurant',
      desc: 'Accompagnement doux, sans pression, valorisant les efforts accomplis.',
    },
    {
      id: 'motivating',
      label: 'Motivant & Stimulant',
      desc: 'Orienté défis, dépassement de soi et objectifs mesurables.',
    },
    {
      id: 'pedagogical',
      label: 'Pédagogique & Scientifique',
      desc: 'Explications claires basées sur la recherche, la neurobiologie et les faits.',
    },
    {
      id: 'neutral',
      label: 'Neutre & Factuel',
      desc: 'Sobriété descriptive, axée sur les statistiques et vos données brutes.',
    },
    {
      id: 'direct',
      label: 'Direct & Synthétique',
      desc: 'Messages courts, conseils actionnables en un coup d’œil.',
    },
  ];

  const contentTypes = [
    { id: 'short_tips', label: 'Conseils courts & astuces' },
    { id: 'statistics', label: 'Statistiques & graphiques' },
    { id: 'challenges', label: 'Défis & jalons progressifs' },
    { id: 'reminders', label: 'Rappels de routine' },
    { id: 'educational_content', label: 'Articles éducatifs approfondis' },
    { id: 'journal', label: 'Journal de bord interactif' },
    { id: 'goals', label: 'Suivi rigoureux d’objectifs' },
    { id: 'ai_assistant', label: 'Accompagnement IA Nexus' },
  ];

  const toggleContentType = (typeId: string) => {
    const list = communication.preferredContentTypes || [];
    if (list.includes(typeId)) {
      setCommunication((prev) => ({
        ...prev,
        preferredContentTypes: list.filter((t) => t !== typeId),
      }));
    } else {
      setCommunication((prev) => ({
        ...prev,
        preferredContentTypes: [...list, typeId],
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Étape 5 sur 7 — Préférences de communication et tonalité
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Comment préférez-vous que l’application échange avec vous ?
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Personnalisez la tonalité de l’assistant IA et les canaux de notification selon votre sensibilité.
        </p>
      </div>

      {/* Tone selection */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Tonalité générale souhaitée
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tones.map((t) => {
            const isSelected = (communication.preferredTone || 'benevolent') === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setCommunication((prev) => ({
                    ...prev,
                    preferredTone: t.id as any,
                  }))
                }
                className={`p-3.5 rounded-2xl border-2 transition text-left flex items-start justify-between cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <span className="font-bold text-slate-900 text-xs block">{t.label}</span>
                  <span className="text-[11px] text-slate-500 block leading-tight">{t.desc}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content types */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <label className="block text-xs font-bold text-slate-900">
          Formats d’accompagnement appréciés
        </label>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((item) => {
            const isChecked = (communication.preferredContentTypes || []).includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleContentType(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isChecked
                    ? 'bg-teal-800 text-white border-teal-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications toggles */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-700" />
            <h4 className="font-bold text-slate-900 text-xs">Rappels & Notifications</h4>
          </div>
          <input
            type="time"
            value={communication.reminderTime || '20:30'}
            onChange={(e) => setCommunication((prev) => ({ ...prev, reminderTime: e.target.value }))}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900"
          />
        </div>

        <div className="space-y-2">
          {[
            { key: 'journalReminderEnabled', label: 'Rappel quotidien pour compléter le journal' },
            { key: 'goalReminderEnabled', label: 'Suivi hebdomadaire de mes objectifs' },
            { key: 'encouragementsEnabled', label: 'Messages d’encouragement lors des jalons atteints' },
            { key: 'weeklySummaryEnabled', label: 'Bilan synthétique chaque dimanche soir' },
          ].map((item) => {
            const isChecked = (communication as any)[item.key] ?? true;
            return (
              <label key={item.key} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    setCommunication((prev) => ({
                      ...prev,
                      [item.key]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-700 font-medium">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
