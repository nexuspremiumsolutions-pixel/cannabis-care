import React, { useState } from 'react';
import {
  Brain,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  HelpCircle,
  Eye,
  Sliders,
  BookOpen,
  Volume2,
  Key,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface EndocannabinoidExplorerProps {
  initialMode?: 'simple' | 'expert';
}

export const EndocannabinoidExplorer: React.FC<EndocannabinoidExplorerProps> = ({
  initialMode = 'simple',
}) => {
  // Hybrid Pedagogy Mode: 'simple' (Clear language, analogies, everyday consequences) vs 'expert' (Receptors, Ki affinity, GPCR, pharmacology)
  const [pedagogyMode, setPedagogyMode] = useState<'simple' | 'expert'>(initialMode);
  const [activeReceptor, setActiveReceptor] = useState<'CB1' | 'CB2'>('CB1');
  const [activeMolecule, setActiveMolecule] = useState<'THC' | 'CBD' | 'AEA' | '2AG'>('THC');

  // Interactive Question & Answer toggles for simple mode
  const [activeFaq, setActiveFaq] = useState<string | null>('munchies');

  const molecules = {
    THC: {
      name: 'Delta-9-THC',
      simpleTitle: 'La clé extérieure qui force le volume',
      type: 'Phytocannabinoïde (Origine Végétale)',
      analogy: 'La fausse clé passe-partout',
      simpleExplanation:
        'Le THC a une forme presque identique aux clés naturelles de votre cerveau. Il s’insère directement dans la serrure (récepteur CB1) et tourne le bouton du volume à fond. Vos neurones ralentissent certains messages et en accélèrent d’autres, ce qui modifie vos perceptions.',
      simpleEffects: [
        'Ralentissement de la perception du temps (les minutes semblent des heures).',
        'Forte stimulation de la faim ("fringales") car il réveille le centre de l’appétit.',
        'Perturbation temporaire de la mémoire immédiate ("Qu’est-ce que je disais déjà ?").',
        'Fous rires ou détente grâce à une libération indirecte de dopamine.',
      ],
      affinityCB1: 'Agoniste partiel puissant (Ki ~ 10 nM)',
      affinityCB2: 'Agoniste partiel modéré (Ki ~ 24 nM)',
      expertAction:
        'Mime l’anandamide avec une durée d’action beaucoup plus longue car il résiste à la dégradation par la FAAH. Stimule intensément les récepteurs couplés aux protéines Gi/Go, inhibe l’adénylate cyclase et réduit l’influx calcique présynaptique, diminuant le relargage de GABA et de glutamate.',
      psychoactive: true,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    CBD: {
      name: 'Cannabidiol (CBD)',
      simpleTitle: 'Le régulateur et bouclier amortisseur',
      type: 'Phytocannabinoïde (Origine Végétale)',
      analogy: 'Le cale-porte protecteur',
      simpleExplanation:
        'Le CBD ne cherche pas à entrer dans la serrure principale. Au contraire, il se place à côté pour empêcher le THC de s’y fixer trop brutalement. C’est un amortisseur naturel qui tempère l’emballement du cœur et l’angoisse.',
      simpleEffects: [
        'Ne fait pas "planer" et n’altère pas votre lucidité mentale.',
        'Atténue la nervosité et détend les tensions musculaires.',
        'Réduit les effets anxiogènes ou la tachycardie provoqués par le THC.',
        'Favorise l’endormissement en apaisant le système nerveux.',
      ],
      affinityCB1: 'Modulateur allostérique négatif (NAM)',
      affinityCB2: 'Agoniste inverse partiel / modulateur indirect',
      expertAction:
        'Modifie la conformation tridimensionnelle du récepteur CB1 sans l’activer, diminuant l’efficacité de fixation des agonistes orthostériques. Inhibe la recapture cellulaire de l’anandamide et stimule les récepteurs 5-HT1A (sérotonine) et TRPV1 (douleur thermique).',
      psychoactive: false,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    },
    AEA: {
      name: 'Anandamide',
      simpleTitle: 'La molécule du bonheur fabriquée par votre corps',
      type: 'Endocannabinoïde Humain Naturel',
      analogy: 'Le frein d’urgence automatique',
      simpleExplanation:
        'Votre cerveau fabrique lui-même son propre cannabis naturel ! Baptisée d’après le mot sanskrit "Ananda" (félicité suprême), l’anandamide est produite uniquement quand vous en avez besoin (après un jogging, un fou rire ou lors d’un câlin) puis disparaît en quelques minutes.',
      simpleEffects: [
        'Responsable de l’euphorie naturelle après le sport ("runner’s high").',
        'Régule l’humeur au quotidien sans risque d’accoutumance.',
        'Se détruit très vite pour que le cerveau retrouve son équilibre.',
        'Protège les neurones contre le stress et la surchauffe.',
      ],
      affinityCB1: 'Agoniste complet de haute affinité',
      affinityCB2: 'Faible affinité périphérique',
      expertAction:
        'Dérivé de l’acide arachidonique synthétisé à la demande par clivage du N-arachidonoyl phosphatidyléthanolamine (NAPE). Assure la rétro-inhibition synaptique avant d’être promptement hydrolysé par l’enzyme intracellulaire FAAH (Fatty Acid Amide Hydrolase).',
      psychoactive: false,
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    },
    '2AG': {
      name: '2-Arachidonoylglycérol (2-AG)',
      simpleTitle: 'Le grand gardien silencieux de nos organes',
      type: 'Endocannabinoïde Humain le plus abondant',
      analogy: 'Le thermostat central',
      simpleExplanation:
        'Le 2-AG est 170 fois plus présent dans notre cerveau que l’anandamide. Il veille jour et nuit sur l’équilibre de votre système immunitaire, de votre digestion et de votre sommeil.',
      simpleEffects: [
        'Maintient l’harmonie générale de tous vos organes (homéostasie).',
        'Aide à calmer les inflammations dans tout le corps.',
        'Participe à la régulation des cycles veille-sommeil.',
        'Assure que les connexions du cerveau restent saines.',
      ],
      affinityCB1: 'Agoniste total sur CB1',
      affinityCB2: 'Agoniste total sur CB2',
      expertAction:
        'Présent en concentration micromolaire élevée dans le SNC. Agit comme agoniste complet des récepteurs CB1 et CB2. Principalement dégradé par la monoacylglycerol lipase (MAGL) présynaptique et les carboxylestérases.',
      psychoactive: false,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
  };

  const selectedMol = molecules[activeMolecule];

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-lg overflow-hidden transition-all duration-300">
      {/* 1. Header Banner with High-Resolution Synaptic Photography */}
      <div className="relative bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 sm:p-8 overflow-hidden">
        {/* Real Scientific Synapse Photography Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1400&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-indigo-950/80 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                Pôle Sciences • Neurobiologie
              </span>
              <span className="text-xs text-indigo-200/70 hidden sm:inline">
                Système Endocannabinoïde (SEC)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Comment le Cannabis Interagit avec Vos Neurones
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Le corps humain produit naturellement ses propres cannabinoïdes. Découvrez comment cette "table de mixage interne" régule vos émotions, votre sommeil et votre appétit.
            </p>
          </div>

          {/* Interactive Dual-Mode Switcher: Simple vs Expert */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-md">
            <span className="text-[10px] font-extrabold uppercase text-slate-300 block text-center mb-1">
              Mode de Pédagogie
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPedagogyMode('simple')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'simple'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span>En Clair & Analogies</span>
              </button>
              <button
                onClick={() => setPedagogyMode('expert')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'expert'
                    ? 'bg-indigo-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-indigo-950" />
                <span>Mode Expert & Laboratoire</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Exploration Stage */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Molecule Selector Row */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" />
              1. Choisissez une molécule pour observer son action :
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Cliquez pour changer de molécule
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(molecules) as (keyof typeof molecules)[]).map((key) => {
              const mol = molecules[key];
              const isSelected = activeMolecule === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveMolecule(key)}
                  className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{key}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        mol.psychoactive
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {mol.psychoactive ? 'Modifie la perception' : 'Apaisant / Naturel'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-indigo-900 mt-1 truncate">
                    {pedagogyMode === 'simple' ? mol.analogy : mol.name}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{mol.type}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Card based on Selected Pedagogy Mode */}
        {pedagogyMode === 'simple' ? (
          /* ================= MODE EN CLAIR / GRAND PUBLIC ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200">
            {/* Left: Punchy Analogy & What happens to you */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Key className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">
                    L&apos;Analogie Parlante : {selectedMol.analogy}
                  </span>
                  <h4 className="text-lg font-black text-slate-900">
                    {selectedMol.simpleTitle}
                  </h4>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                {selectedMol.simpleExplanation}
              </p>

              {/* Consequence Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-600 block">
                  Ce que vous ressentez concrètement :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedMol.simpleEffects.map((effect, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2 text-xs text-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: The Body Thermostat Metaphor */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-indigo-100 space-y-3 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                  <Volume2 className="w-4 h-4" />
                  <span>Image Mentale Clé</span>
                </div>
                <h5 className="font-extrabold text-slate-900 text-sm">
                  Le Variateur de Lumière ou la Table de Mixage
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Imaginez une pièce où la musique est trop forte (stress, douleur, hyperactivité).
                  Normalement, vos neurones fabriquent de l&apos;<strong>Anandamide</strong> pour baisser le son.
                </p>
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                  <strong>Avec le THC :</strong> Un invité monte le son d’un coup sur certaines pistes (les sens, l’appétit) et coupe le micro de la mémoire immédiate.
                </div>
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-1">
                  <strong>Avec le CBD :</strong> C&apos;est le régulateur sage qui remet les curseurs au centre sans éteindre la lumière.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Vous souhaitez les détails biochimiques ?</span>
                <button
                  onClick={() => setPedagogyMode('expert')}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Passer en Mode Expert</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE EXPERT / LABORATOIRE ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950 text-white rounded-2xl p-6 border border-slate-800">
            {/* Left: Biochemical Details */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                  Pharmacodynamie & Affinités Réceptorielles
                </span>
                <h4 className="text-lg font-black text-white">{selectedMol.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{selectedMol.type}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-indigo-300 font-semibold">Affinité Récepteur CB1 :</span>
                  <span className="text-white font-mono text-[11px]">{selectedMol.affinityCB1}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-teal-300 font-semibold">Affinité Récepteur CB2 :</span>
                  <span className="text-white font-mono text-[11px]">{selectedMol.affinityCB2}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-900/40 text-xs text-slate-300 leading-relaxed space-y-2">
                <strong className="text-indigo-300 block">Mécanisme Moléculaire :</strong>
                <p>{selectedMol.expertAction}</p>
              </div>
            </div>

            {/* Right: Retrograde Transmission & Brain Anatomy */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Cartographie des Récepteurs Membranaires
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveReceptor('CB1')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeReceptor === 'CB1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CB1 (Cerveau)
                  </button>
                  <button
                    onClick={() => setActiveReceptor('CB2')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeReceptor === 'CB2' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CB2 (Immunité)
                  </button>
                </div>
              </div>

              {activeReceptor === 'CB1' ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-indigo-300 block font-bold">Cortex & Lobe Frontal</strong>
                    <span className="text-[11px] text-slate-400">Fonctions exécutives, prise de décision, raisonnement.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-indigo-300 block font-bold">Hippocampe</strong>
                    <span className="text-[11px] text-slate-400">Encodage des souvenirs et mémoire épisodique immédiate.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-indigo-300 block font-bold">Hypothalamus</strong>
                    <span className="text-[11px] text-slate-400">Stimulation de l’appétit (voie pro-opiomélanocortine / orexine).</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-indigo-300 block font-bold">Tronc Cérébral (quasi-nul)</strong>
                    <span className="text-[11px] text-emerald-400">Pas de récepteurs aux centres vitaux = pas d’overdose respiratoire mortelle.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-teal-300 block font-bold">Rate & Tissus Lymphoïdes</strong>
                    <span className="text-[11px] text-slate-400">Modulation de la réponse immunitaire et cytokines.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <strong className="text-teal-300 block font-bold">Microglie Cérébrale</strong>
                    <span className="text-[11px] text-slate-400">Contrôle de la neuro-inflammation et nettoyage synaptique.</span>
                  </div>
                </div>
              )}

              {/* Retrograde Transmission Note */}
              <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Transmission Rétrograde Synaptique :</strong> Les endocannabinoïdes voyagent à contre-courant, du neurone récepteur (post-synaptique) vers l’émetteur (pré-synaptique), agissant comme un régulateur de rétroaction négative.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Ludic Interactive "Le Saviez-Vous ?" Accordion */}
        <div className="pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Curiosités & Idées Reçues Décryptées :
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'munchies',
                title: 'Pourquoi a-t-on faim ("munchies") ?',
                icon: '🍕',
                answer:
                  'Le THC se fixe dans l’hypothalamus et trompe les neurones qui signalent la satiété. Votre cerveau pense littéralement qu’il est affamé et amplifie l’odorat et le goût des aliments !',
              },
              {
                id: 'runner',
                title: 'L’euphorie du coureur après le sport',
                icon: '🏃',
                answer:
                  'Pendant des décennies, on croyait que les endorphines expliquaient le bonheur après un jogging. La science a prouvé que c’est en réalité une déferlante d’Anandamide (notre propre cannabis) qui traverse la barrière du cerveau !',
              },
              {
                id: 'eyes',
                title: 'Pourquoi a-t-on les yeux rouges ?',
                icon: '👁️',
                answer:
                  'Le THC provoque une vasodilatation temporaire : la pression artérielle baisse et les vaisseaux sanguins des yeux se dilatent. C’est d’ailleurs cette propriété qui a inspiré les premières recherches contre le glaucome.',
              },
            ].map((item) => {
              const isOpen = activeFaq === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveFaq(isOpen ? null : item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isOpen
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <h5 className="font-bold text-xs text-slate-900 leading-tight">
                      {item.title}
                    </h5>
                  </div>
                  {isOpen && (
                    <p className="text-xs text-slate-600 mt-2.5 pt-2 border-t border-indigo-100 leading-relaxed">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
