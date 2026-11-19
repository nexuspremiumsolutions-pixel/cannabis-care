import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Sparkles,
  ShieldAlert,
  Car,
  HelpCircle,
  ArrowRight,
  Info,
  Timer,
  FileCheck,
} from 'lucide-react';

interface PharmacokineticsComparatorProps {
  initialMode?: 'simple' | 'expert';
}

export const PharmacokineticsComparator: React.FC<PharmacokineticsComparatorProps> = ({
  initialMode = 'simple',
}) => {
  const [pedagogyMode, setPedagogyMode] = useState<'simple' | 'expert'>(initialMode);
  const [selectedRoute, setSelectedRoute] = useState<'inhalation' | 'ingestion' | 'sublingual'>('inhalation');
  const [activeFaq, setActiveFaq] = useState<string | null>('edible_trap');

  const routes = {
    inhalation: {
      title: 'Inhalation (Vaporisation / Inhalation)',
      simpleTitle: "L'Autoroute Directe vers le Cerveau",
      analogy: "Le coup d'accélérateur immédiat",
      icon: Flame,
      image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=600&q=80',
      simpleOnset: '2 à 5 minutes (très rapide)',
      simplePeak: '15 à 30 minutes',
      simpleDuration: '2 à 3 heures',
      simpleExplanation:
        'Quand la vapeur entre dans vos poumons, les molécules passent instantanément dans le sang sans faire de détour. Le cerveau est atteint en 30 secondes. Vous savez très vite si la dose vous convient.',
      simpleAdvice:
        'Conseil d’or : Attendez 15 à 20 minutes avant de décider si l’effet est suffisant. En vaporisation (sans combustion), vous évitez 95% des goudrons toxiques de la fumée.',
      bioavailability: '15% à 35% (Jusqu’à 50% en vaporisation contrôlée)',
      mechanism:
        'Diffusion passive ultra-rapide à travers la barrière alvéolo-capillaire (surface pulmonaire ~100 m²). Arrivée artérielle directe au SNC sans premier passage hépatique.',
      metabolite: 'Delta-9-THC circulant inchangé (ou CBD intact).',
      metaboliteAction:
        'Pic sérique très aigu puis redistribution rapide dans les tissus adipeux périphériques.',
      drivingRisk:
        'Test salivaire positif immédiat dès la 1ère minute, et jusqu’à 12-24h (parfois 48h chez l’usager régulier).',
    },
    ingestion: {
      title: 'Ingestion Orale (Gâteaux, Bonbons, Huiles avalées)',
      simpleTitle: 'Le Laboratoire Magique du Foie (Le Piège !)',
      analogy: 'La bombe à retardement décuplée',
      icon: Clock,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      simpleOnset: '45 à 120 minutes (parfois 2h30 !)',
      simplePeak: '3 à 4 heures',
      simpleDuration: '6 à 10 heures (parfois le lendemain matin)',
      simpleExplanation:
        'C’est le piège numéro 1 des débutants : vous mangez un bonbon ou gâteau, il ne se passe RIEN pendant 1 heure. Beaucoup pensent que le produit ne marche pas et en reprennent une part. ERREUR ! Votre foie est en train de transformer le THC en une super-molécule 3 fois plus puissante !',
      simpleAdvice:
        'Règle absolue : Ne JAMAIS redoser avant au moins 3 heures pleines. Prenez des micro-doses (2,5 à 5 mg) et prévoyez une soirée calme sans conduite.',
      bioavailability: '4% à 12% (Forte dégradation par l’acidité gastrique et le foie)',
      mechanism:
        'Absorption gastro-intestinale lente puis passage obligatoire par la veine porte hépatique. Les cytochromes hépatiques CYP2C9 et CYP3A4 métabolisent le Delta-9-THC en 11-Hydroxy-THC.',
      metabolite: '11-Hydroxy-THC (11-OH-THC)',
      metaboliteAction:
        'Possède une polarité différente lui permettant de franchir la barrière hémato-encéphalique 2 à 3 fois plus efficacement, avec des effets psychotropes plus immersifs et corporels.',
      drivingRisk:
        'Le test salivaire peut être faussement négatif ou retardé, mais le test sanguin reste massivement positif pendant 24 à 48 heures.',
    },
    sublingual: {
      title: 'Voie Sublinguale (Gouttes d’huile sous la langue)',
      simpleTitle: 'Le Compromis Idéal & Doux',
      analogy: 'Le compte-gouttes de précision',
      icon: Droplet,
      image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80',
      simpleOnset: '15 à 30 minutes',
      simplePeak: '1 à 2 heures',
      simpleDuration: '4 à 6 heures',
      simpleExplanation:
        'La peau sous votre langue est très fine et remplie de petits vaisseaux sanguins. En gardant les gouttes 60 à 90 secondes sous la langue sans avaler, une partie passe directement dans le sang, et le reste est avalé doucement.',
      simpleAdvice:
        'Le secret : Ne pas avaler sa salive immédiatement ! Comptez lentement jusqu’à 60 avant d’avaler pour un résultat optimal et stable.',
      bioavailability: '15% à 25%',
      mechanism:
        'Absorption mixte : fraction muqueuse transmucosale directe vers la veine jugulaire interne + fraction avalée suivant le cycle digestif entéro-hépatique classique.',
      metabolite: 'Profil mixte : Delta-9-THC inchangé + faible taux de 11-OH-THC.',
      metaboliteAction: 'Montée progressive sans à-coups ni tachycardie brutale.',
      drivingRisk:
        'Traces salivaires détectables en cas de passage sous la langue d’extraits contenant du THC.',
    },
  };

  const current = routes[selectedRoute];

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden transition-all duration-300">
      {/* 1. Header with Laboratory Visual */}
      <div className="relative bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=1200&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-rose-950/80 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                Pôle Santé • Pharmacocinétique
              </span>
              <span className="text-xs text-rose-200/70 hidden sm:inline">
                Délais d&apos;Action & Métabolisme
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Combien de Temps Ça Met ? Pourquoi Manger est Si Différent ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Selon la façon dont vous consommez, votre corps ne reçoit pas du tout la même molécule. Découvrez les temps d&apos;action, le piège du foie et les fenêtres de détection au volant.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-md">
            <span className="text-[10px] font-extrabold uppercase text-slate-300 block text-center mb-1">
              Niveau de Détail
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
                <Sparkles className="w-3.5 h-3.5 text-rose-950" />
                <span>En Clair & Pratique</span>
              </button>
              <button
                onClick={() => setPedagogyMode('expert')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'expert'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-950" />
                <span>Expert & Dépistage</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Route Selector Tabs */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['inhalation', 'ingestion', 'sublingual'] as const).map((key) => {
            const r = routes[key];
            const isSelected = selectedRoute === key;
            const Icon = r.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedRoute(key)}
                className={`p-4 rounded-2xl text-left transition-all border cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-rose-50/70 border-rose-500 shadow-md ring-2 ring-rose-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-slate-900 block truncate">
                    {key === 'inhalation' ? 'Inhalation / Vapo' : key === 'ingestion' ? 'Ingestion (Edibles)' : 'Huile Sublinguale'}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {r.simpleOnset}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Dynamic Route Detail Stage */}
        {pedagogyMode === 'simple' ? (
          /* ================= MODE SIMPLE / EN CLAIR ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200">
            {/* Left: Timing bars & Concrete explanations */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-rose-800 tracking-wider">
                  Analogie : {current.analogy}
                </span>
                <h4 className="text-xl font-black text-slate-900">{current.simpleTitle}</h4>
              </div>

              {/* Intuitive Visual Timing Gauge */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Premiers Effets</span>
                  <span className="text-sm sm:text-base font-black text-rose-900 mt-0.5 block">{current.simpleOnset}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Effet Maximal</span>
                  <span className="text-sm sm:text-base font-black text-amber-900 mt-0.5 block">{current.simplePeak}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Durée Totale</span>
                  <span className="text-sm sm:text-base font-black text-indigo-900 mt-0.5 block">{current.simpleDuration}</span>
                </div>
              </div>

              {/* Explanatory text */}
              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-200/80">
                {current.simpleExplanation}
              </p>

              {/* Practical Advice Banner */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-0.5">
                  <strong className="font-extrabold block">Le Conseil Sécurité :</strong>
                  <p className="leading-relaxed">{current.simpleAdvice}</p>
                </div>
              </div>
            </div>

            {/* Right: Photographic Card with Driving Warning */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3.5">
                  <span className="text-white text-xs font-black drop-shadow-md">
                    {current.title}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase">
                  <Car className="w-4 h-4" />
                  <span>Et au volant ? Dépistage & Vigilance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {current.drivingRisk}
                </p>
                <div className="text-[11px] p-2.5 rounded-xl bg-rose-50 text-rose-950 border border-rose-200/60 font-semibold">
                  ⚠️ En France, tolérance zéro au volant (1 ng/ml de salive suffit pour être verbalisé). Au Luxembourg, 1 ng/ml sanguin. En Allemagne, 3,5 ng/ml.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE EXPERT & PHARMACOLOGIE ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950 text-white rounded-2xl p-6 border border-slate-800">
            <div className="lg:col-span-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">
                  Données Pharmacocinétiques Cliniques
                </span>
                <h4 className="text-lg font-black text-white">{current.title}</h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Biodisponibilité Sérique :</span>
                  <span className="text-emerald-400 font-mono font-bold">{current.bioavailability}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Métabolite Majoritaire :</span>
                  <span className="text-amber-300 font-mono font-bold">{current.metabolite}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <strong className="text-rose-300 block font-bold">Mécanisme Physiologique d&apos;Absorption :</strong>
                <p>{current.mechanism}</p>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Transformation Hépatique & Barrière Hémato-Encéphalique
              </span>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Le Phénomène 11-OH-THC</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {current.metaboliteAction}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <Car className="w-4 h-4" />
                  <span>Cinétique de Détection Médico-Légale</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {current.drivingRisk}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Interactive Q&A for Everyday Situations */}
        <div className="pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Situations du Quotidien : Vos Questions Fréquentes
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'edible_trap',
                question: 'Pourquoi les gâteaux font-ils paniquer plus souvent ?',
                icon: '🧁',
                answer:
                  'Parce que le foie transforme le THC en 11-Hydroxy-THC, qui traverse la barrière du cerveau 2 à 3 fois plus facilement que le THC inhalé. La sensation est beaucoup plus corporelle et psychédélique, et l’usager surpris a l’impression que "ça ne s’arrêtera jamais".',
              },
              {
                id: 'detection_delay',
                question: 'Combien de temps le test salivaire reste-t-il positif ?',
                icon: '🚗',
                answer:
                  'Chez un usager occasionnel (1 joint le week-end) : 6 à 24 heures. Chez un consommateur quotidien régulier : les molécules se stockent dans les tissus et le test salivaire peut réagir jusqu’à 48h à 72h après la dernière prise !',
              },
            ].map((faq) => {
              const isOpen = activeFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isOpen
                      ? 'bg-rose-50/60 border-rose-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{faq.icon}</span>
                    <h5 className="font-bold text-xs text-slate-900 leading-tight">
                      {faq.question}
                    </h5>
                  </div>
                  {isOpen && (
                    <p className="text-xs text-slate-600 mt-2.5 pt-2 border-t border-rose-100 leading-relaxed">
                      {faq.answer}
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
