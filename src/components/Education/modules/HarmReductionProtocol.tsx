import React, { useState } from 'react';
import {
  ShieldAlert,
  HeartPulse,
  PhoneCall,
  Wind,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  Info,
  Droplets,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface HarmReductionProtocolProps {
  initialMode?: 'simple' | 'expert';
}

export const HarmReductionProtocol: React.FC<HarmReductionProtocolProps> = ({
  initialMode = 'simple',
}) => {
  const [pedagogyMode, setPedagogyMode] = useState<'simple' | 'expert'>(initialMode);
  const [activeStep, setActiveStep] = useState<number>(1);

  const emergencySteps = [
    {
      step: 1,
      title: 'Sécuriser & Se Rappeler la Règle d’Or',
      icon: '🛋️',
      simpleAction:
        'Personne n’a jamais fait d’overdose mortelle de cannabis pur. Votre corps élimine la molécule minute après minute. Tout va bien se passer.',
      simpleDetail:
        'Installez la personne dans un endroit calme, assis ou allongé, avec une couverture douce, lumière tamisée et sans musique agressive. Parlez calmement et répétez : "C’est juste l’effet du produit, ça va redescendre."',
      expertPhysiology:
        'Les centres cardio-respiratoires autonomes du tronc cérébral sont dépourvus de récepteurs CB1. Contrairement aux opioïdes, une saturation totale des récepteurs cannabinoïdes n’induit aucune apnée centrale ni dépression respiratoire mortelle.',
    },
    {
      step: 2,
      title: 'Hydratation & Rétablissement Glycémique',
      icon: '🍯',
      simpleAction:
        'Boire un grand verre d’eau fraîche ou une boisson tiède sucrée (infusion avec du miel, jus d’orange frais).',
      simpleDetail:
        'Le cannabis fait baisser la tension artérielle et peut provoquer un coup de pompe ou des vertiges. Le sucre doux et l’eau redonnent de l’énergie au corps. Évitez absolument le café, l’alcool ou les sodas énergisants !',
      expertPhysiology:
        'Vasodilatation périphérique induite par le THC avec hypotension orthostatique réflexe et stimulation transitoire de la glycogénolyse. L’apport hydrique et glucidique normalise le volume plasmatique et restaure la pression de perfusion cérébrale.',
    },
    {
      step: 3,
      title: 'L’Astuce Magique : Le Poivre Noir ou le CBD Pur',
      icon: '🧂',
      simpleAction:
        'Mâcher 2 ou 3 grains de poivre noir entier ou prendre quelques gouttes d’huile de CBD pur.',
      simpleDetail:
        'Ce n’est pas une légende urbaine : le poivre noir contient une molécule (le caryophyllène) qui calme instantanément l’angoisse. Le CBD, lui, joue le rôle de bouclier pour empêcher le THC d’exciter vos neurones.',
      expertPhysiology:
        'Le Bêta-Caryophyllène contenu dans Piper nigrum est un agoniste sélectif des récepteurs CB2 exerçant un effet anxiolytique sans sédation. Le CBD agit en tant que modulateur allostérique négatif (NAM) sur CB1, diminuant l’affinité et l’efficacité de transduction du THC.',
    },
    {
      step: 4,
      title: 'Respiration Guidée 5-5 (Le Frein à Main Naturel)',
      icon: '🫁',
      simpleAction:
        'Inspirer lentement par le nez sur 5 secondes, expirer doucement par la bouche sur 5 secondes.',
      simpleDetail:
        'Faites cela pendant 3 minutes chrono. Cette respiration force biologiquement votre cœur à ralentir et envoie un signal au cerveau : "Danger écarté, tout est sous contrôle".',
      expertPhysiology:
        'Stimulation de la branche efférente du nerf vague (nerf crânien X). L’augmentation de l’acétylcholine sur les récepteurs muscariniques M2 du nœud sinusal ralentit la tachycardie réflexe et inhibe l’hyperactivité de l’amygdale cérébrale.',
    },
    {
      step: 5,
      title: 'Quand Contacter les Secours (15 ou 112)',
      icon: '🚑',
      simpleAction:
        'Le secret médical est total et absolu : les médecins ne sont jamais là pour juger ou dénoncer.',
      simpleDetail:
        'Appelez immédiatement le SAMU (15) ou le numéro européen (112) si la personne s’évanouit sans réaction, ressent une violente douleur dans la poitrine ou présente une confusion délirante incontrôlable.',
      expertPhysiology:
        'Les secours d’urgence sont régis par l’article L1110-4 du Code de la Santé Publique et le secret médical. Les soignants interviennent pour écarter un syndrome coronarien aigu, un choc vagal décompensé ou une intoxication poly-substances à risque.',
    },
  ];

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden transition-all duration-300">
      {/* 1. Header with Reassuring Human Wellness Photography */}
      <div className="relative bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/90 via-slate-950/75 to-indigo-950/85 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Sécurité Sanitaire & Bienveillance
              </span>
              <span className="text-xs text-rose-200/70 hidden sm:inline">
                Réduction des Risques (RDR)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Protocole d&apos;Urgence : Que Faire en Cas de Malaise ("Green-Out" / Bad Trip) ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cœur qui s&apos;emballe, sueurs froides, vertiges ou crise d&apos;angoisse passagère : voici les 5 gestes simples et prouvés scientifiquement pour désamorcer la crise en quelques minutes.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-md">
            <span className="text-[10px] font-extrabold uppercase text-slate-300 block text-center mb-1">
              Affichage du Protocole
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPedagogyMode('simple')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'simple'
                    ? 'bg-rose-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5 text-rose-950" />
                <span>Gestes Simples d&apos;Urgence</span>
              </button>
              <button
                onClick={() => setPedagogyMode('expert')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'expert'
                    ? 'bg-indigo-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-indigo-950" />
                <span>Physiologie Clinique</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Steps Accordion */}
      <div className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Protocole en 5 étapes chronologiques :
          </span>
          <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Validé Addictologie & Urgences
          </span>
        </div>

        <div className="space-y-3">
          {emergencySteps.map((s) => {
            const isCurrent = activeStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900 text-white border-rose-500 shadow-md ring-2 ring-rose-400/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isCurrent ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.step}
                    </span>
                    <h4
                      className={`font-black text-sm sm:text-base ${
                        isCurrent ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {s.title}
                    </h4>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl shrink-0 ${
                      isCurrent ? 'bg-white/10 text-rose-300' : 'text-slate-400'
                    }`}
                  >
                    {isCurrent ? 'Détails actifs' : 'Voir les consignes'}
                  </span>
                </div>

                {isCurrent && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 text-white font-medium">
                      👉 {s.simpleAction}
                    </div>

                    <p className="text-slate-300 pl-1">{s.simpleDetail}</p>

                    {pedagogyMode === 'expert' && (
                      <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-700/50 text-indigo-200 space-y-1">
                        <strong className="text-indigo-300 block font-bold">
                          Explication Neuro-Physiologique :
                        </strong>
                        <p>{s.expertPhysiology}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Secret Médical Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Rappel légal : Le 15 et le 112 sont strictement couverts par le secret médical.</span>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium hidden sm:inline">
            Aucun risque de poursuite policière pour avoir appelé les urgences.
          </span>
        </div>
      </div>
    </div>
  );
};
