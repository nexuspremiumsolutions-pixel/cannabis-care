import React, { useState } from 'react';
import {
  Thermometer,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Wind,
  ShieldCheck,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';

interface TerpeneSpectrumExplorerProps {
  initialMode?: 'simple' | 'expert';
}

export const TerpeneSpectrumExplorer: React.FC<TerpeneSpectrumExplorerProps> = ({
  initialMode = 'simple',
}) => {
  const [pedagogyMode, setPedagogyMode] = useState<'simple' | 'expert'>(initialMode);
  const [temperature, setTemperature] = useState<number>(185);
  const [selectedTerpene, setSelectedTerpene] = useState<string>('myrcene');

  const terpenes = {
    caryophyllene: {
      name: 'Bêta-Caryophyllène',
      aromaSimple: 'Poivre noir, clou de girofle & boisé',
      temp: 119,
      image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=400&q=80',
      simpleRole: 'L’antidote naturel contre le stress et les crampes. C’est le seul terpène capable de parler directement aux récepteurs du corps comme un cannabinoïde !',
      simpleTip: 'Si vous vous sentez trop angoissé, croquer 2 grains de poivre noir libère ce terpène et aide à redescendre sur terre.',
      expertRole: 'Unique terpène agoniste des récepteurs CB2. Puissant anti-inflammatoire et analgésique périphérique sans effet psychotrope.',
      family: 'Sesquiterpène',
    },
    pinene: {
      name: 'Alpha-Pinène',
      aromaSimple: 'Aiguilles de pin fraîches, romarin & grand air',
      temp: 156,
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
      simpleRole: 'Le bouclier pour la mémoire et la clarté d’esprit. Il ouvre les voies respiratoires et empêche le THC de vous rendre trop amnésique.',
      simpleTip: 'Idéal en journée quand on veut rester alerte et lucide.',
      expertRole: 'Bronchodilatateur et inhibiteur de l’acétylcholinestérase (AChE). Préserve la concentration synaptique d’acétylcholine pour contrebalancer les déficits de mémoire immédiate induits par le THC.',
      family: 'Monoterpène bicyclique',
    },
    myrcene: {
      name: 'Bêta-Myrcène',
      aromaSimple: 'Mangue très mûre, terre humide & clou de girofle',
      temp: 168,
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80',
      simpleRole: 'L’effet "canapé" ("Couch-lock") ! Très sédatif et relaxant musculaire. Il ouvre grand la porte du cerveau pour laisser entrer les cannabinoïdes.',
      simpleTip: 'Parfait le soir pour déconnecter et trouver le sommeil.',
      expertRole: 'Augmente la perméabilité de la barrière hémato-encéphalique. Synergie sédative puissante avec le THC et le CBN via la modulation des canaux calciques.',
      family: 'Monoterpène acyclique',
    },
    limonene: {
      name: 'D-Limonène',
      aromaSimple: 'Écorces de citron, orange sanguine & pamplemousse',
      temp: 176,
      image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=400&q=80',
      simpleRole: 'Le booster d’humeur et d’optimisme ! Il apporte un coup de soleil immédiat, dissipe la morosité et stimule la créativité.',
      simpleTip: 'Très recherché pour lutter contre les coups de blues passagers et la fatigue mentale.',
      expertRole: 'Agit sur l’axe sérotoninergique via les récepteurs 5-HT1A. Propriétés anxiolytiques, immunostimulantes et gastroprotectrices documentées.',
      family: 'Monoterpène cyclique',
    },
    linalool: {
      name: 'Linalol',
      aromaSimple: 'Fleurs de lavande, douceur florale & bergamote',
      temp: 198,
      image: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=400&q=80',
      simpleRole: 'Le calmant absolu contre l’anxiété. Tout comme l’huile essentielle de lavande, il apaise les battements du cœur et détend les mâchoires crispées.',
      simpleTip: 'Recommandé lors des périodes de stress intense ou de tension nerveuse accumulée.',
      expertRole: 'Modulateur allostérique positif des récepteurs GABA-A. Diminue l’excitabilité neuronale, réduit le glutamate et possède des vertus anticonvulsivantes.',
      family: 'Alcool monoterpénique',
    },
  };

  const currentTerp = terpenes[selectedTerpene as keyof typeof terpenes] || terpenes.myrcene;

  // Thermal zones
  const getTempZone = (t: number) => {
    if (t < 160) {
      return {
        label: 'Zone Douce & Arômes Délicats (120°C - 160°C)',
        status: 'Excellente',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        desc: 'Saveurs ultra-fraîches, vapeur quasi-invisible, libération du pinène et du caryophyllène sans aucune agressivité.',
      };
    }
    if (t <= 200) {
      return {
        label: 'Zone Idéale & Équilibre Parfait (160°C - 200°C)',
        status: 'Zone Royale',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        desc: 'La plage parfaite ! Tous les cannabinoïdes (THC, CBD) et les terpènes majeurs (Myrcène, Limonène, Linalol) s’évaporent sans goudron ni fumée.',
      };
    }
    if (t <= 225) {
      return {
        label: 'Zone Dense & Extraction Lourde (200°C - 225°C)',
        status: 'Vapeur Dense',
        color: 'text-amber-800 bg-amber-50 border-amber-200',
        desc: 'Vapeur plus chaude et dense. Idéale pour extraire le THCV ou le CBC, mais les arômes fins commencent à se dégrader.',
      };
    }
    return {
      label: 'Zone Pyrolytique Toxique (> 230°C - Combustion)',
      status: 'Danger Santé',
      color: 'text-rose-800 bg-rose-50 border-rose-200',
      desc: 'Attention : Dès 230°C, la matière brûle ! Vous inhalez du benzène, du monoxyde de carbone et des goudrons cancérigènes.',
    };
  };

  const zone = getTempZone(temperature);

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden transition-all duration-300">
      {/* 1. Header with Fresh Botanical Field Photography */}
      <div className="relative bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=1200&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-950/75 to-teal-950/85 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                Botanique & Aromathérapie
              </span>
              <span className="text-xs text-emerald-200/70 hidden sm:inline">
                Terpènes & Vaporisation Saine
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              L&apos;Effet d&apos;Entourage : Pourquoi Deux Variétés Ne Font Jamais le Même Effet
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Les terpènes sont les huiles aromatiques naturelles des plantes (lavande, pin, citron). En synergie avec les cannabinoïdes, ils orientent complètement votre expérience vers le calme ou l&apos;énergie.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-md">
            <span className="text-[10px] font-extrabold uppercase text-slate-300 block text-center mb-1">
              Mode d&apos;Apprentissage
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPedagogyMode('simple')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'simple'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-950" />
                <span>En Clair (Arômes & Effets)</span>
              </button>
              <button
                onClick={() => setPedagogyMode('expert')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'expert'
                    ? 'bg-teal-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5 text-teal-950" />
                <span>Points d&apos;Ébullition Précis</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Terpene Selector with Real Photos */}
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            1. Choisissez un arôme naturel pour découvrir son pouvoir :
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.keys(terpenes) as (keyof typeof terpenes)[]).map((key) => {
              const t = terpenes[key];
              const isSelected = selectedTerpene === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTerpene(key)}
                  className={`rounded-2xl border transition-all text-left overflow-hidden cursor-pointer flex flex-col ${
                    isSelected
                      ? 'border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="h-20 w-full overflow-hidden relative">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-black text-white">{t.temp}°C</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white flex-1 flex flex-col justify-between">
                    <span className="font-extrabold text-xs text-slate-900 block truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">{t.aromaSimple.split(',')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Selected Terpene Showcase */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Point d&apos;Ébullition : {currentTerp.temp}°C
              </span>
              <span className="text-xs text-slate-500 font-medium">{currentTerp.family}</span>
            </div>

            <h4 className="text-lg font-black text-slate-900">{currentTerp.name}</h4>

            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-200">
              {pedagogyMode === 'simple' ? currentTerp.simpleRole : currentTerp.expertRole}
            </p>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>Au Quotidien :</strong> {currentTerp.simpleTip}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-center text-xs">
            <span className="font-bold uppercase text-[10px] text-slate-400 block">Profil Olfactif</span>
            <div className="p-3 rounded-xl bg-slate-50 text-slate-800 font-semibold border border-slate-200/70">
              🍃 {currentTerp.aromaSimple}
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Présent dans la nature dans les herbes aromatiques, fruits et résines.
            </p>
          </div>
        </div>

        {/* 4. Interactive Temperature Slider: Vaporisation vs Combustion Toxique */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                2. Testez le curseur de température de vaporisation :
              </span>
              <h5 className="font-black text-base text-slate-900">
                Pourquoi Ne Pas Brûler ? La Science du Chauffage Contrôlé
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Température réglée :</span>
              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-base">
                {temperature}°C
              </span>
            </div>
          </div>

          {/* Slider input */}
          <div className="space-y-2">
            <input
              type="range"
              min={130}
              max={245}
              step={1}
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>130°C (Doux)</span>
              <span>180°C (Équilibre)</span>
              <span>210°C (Chaud)</span>
              <span className="text-rose-600">230°C+ (Combustion Dangereuse)</span>
            </div>
          </div>

          {/* Status Alert Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${zone.color}`}>
            {temperature >= 230 ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-0.5">
              <strong className="font-bold text-sm block">{zone.label}</strong>
              <p className="leading-relaxed">{zone.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
