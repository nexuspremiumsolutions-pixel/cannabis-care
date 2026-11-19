import React, { useState } from 'react';
import {
  Scale,
  Shield,
  Car,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileText,
  MapPin,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Plane,
} from 'lucide-react';

interface EuropeanLegalMatrixProps {
  initialMode?: 'simple' | 'expert';
}

export const EuropeanLegalMatrix: React.FC<EuropeanLegalMatrixProps> = ({
  initialMode = 'simple',
}) => {
  const [pedagogyMode, setPedagogyMode] = useState<'simple' | 'expert'>(initialMode);
  const [selectedCountry, setSelectedCountry] = useState<'lu' | 'de' | 'fr' | 'es' | 'ch'>('lu');

  const countryData = {
    lu: {
      name: 'Luxembourg',
      flag: '🇱🇺',
      simpleSummary: 'Légal à la maison (4 plants) • Amende légère dans la rue (145 €) • Tolérance zéro au volant',
      statusTitle: 'Loi de 2023 : Culture à Domicile Autorisée & Dépénalisation',
      homeGrowSimple: '🟢 OUI : Jusqu’à 4 plants chez soi, à l’abri des regards de la rue.',
      publicPossessionSimple: '🟡 DÉPÉNALISÉ : Jusqu’à 3g dans la rue = amende simple de 145 € (pas de casier judiciaire).',
      drivingSimple: '🔴 TOLÉRANCE ZÉRO : 1 ng/ml de THC dans le sang. Retrait de permis immédiat.',
      cbdSimple: '🟢 LÉGAL : Fleurs et huiles autorisées sous 0,3% de THC.',
      homeGrow: 'Légal : 4 plants de cannabis par ménage, semés à partir de graines, obligatoirement hors de la vue du public.',
      publicPossession: 'Dépénalisé jusqu’à 3 grammes dans l’espace public. Sanctionné par une amende d’avertissement de 145 € sans inscription au casier judiciaire.',
      driving: 'Seuil légal strict : 1 ng/ml de THC dans le sang. Dépistage salivaire systématique lors des contrôles routiers.',
      workplace: 'Règlement intérieur d’entreprise : l’employeur peut sanctionner toute consommation pendant les heures de travail.',
      borderWarning: 'Attention : Interdiction formelle d’exporter du cannabis hors du territoire luxembourgeois vers la France ou la Belgique.',
    },
    de: {
      name: 'Allemagne (Deutschland)',
      flag: '🇩🇪',
      simpleSummary: 'Légal en public (25g) • Légal à la maison (50g + 3 plants) • Seuil de conduite modernisé (3,5 ng)',
      statusTitle: 'Loi CanG (Avril 2024) : Légalisation Partielle & Clubs Sociaux',
      homeGrowSimple: '🟢 OUI : 3 plants femelles vivants à domicile et jusqu’à 50 grammes de fleurs séchées.',
      publicPossessionSimple: '🟢 LÉGAL : Jusqu’à 25 grammes sur soi dans la rue pour les adultes.',
      drivingSimple: '🟡 SEUIL SCIENTIFIQUE : Autorisé en-dessous de 3,5 ng/ml de THC (équivalent à 0,2 g/l d’alcool).',
      cbdSimple: '🟢 LÉGAL : Vente libre et encadrée.',
      homeGrow: 'Légal : Jusqu’à 3 plants par adulte et 50 grammes conservés de manière sécurisée hors de portée des mineurs.',
      publicPossession: 'Légal jusqu’à 25g. Interdiction stricte de fumer à moins de 100m des écoles, crèches, et dans les rues piétonnes de 7h à 20h.',
      driving: 'Nouveau seuil fédéral révisé à 3,5 ng/ml de THC dans le sérum sanguin. Tolérance zéro maintenue pour les jeunes permis.',
      workplace: 'Obligation de vigilance : interdiction des états d’ébriété ou d’emprise mettant autrui en péril.',
      borderWarning: 'Attention : Les frontières restent sous surveillance douanière. Franchir la frontière française avec du cannabis acheté en Allemagne est un délit douanier sévère.',
    },
    fr: {
      name: 'France',
      flag: '🇫🇷',
      simpleSummary: 'THC strictement interdit • Amende Forfaitaire 200 € • CBD légal sous 0,3% • Zéro tolérance au volant',
      statusTitle: 'Régime Strict de Prohibition du THC & Marché CBD Encadré',
      homeGrowSimple: '🔴 STRICTEMENT INTERDIT : Considéré comme fabrication illicite de stupéfiants.',
      publicPossessionSimple: '🔴 ILLÉGAL : Amende forfaitaire délictuelle de 200 € (inscrite au casier judiciaire).',
      drivingSimple: '🔴 TOLÉRANCE ZÉRO ABSOLUE : Test salivaire positif = délit pénal, perte de 6 points et suspension de permis.',
      cbdSimple: '🟢 TOTALEMENT LÉGAL : Fleurs, infusions et huiles avec THC inférieur ou égal à 0,3%.',
      homeGrow: 'Délit pénal majeur passible de poursuites devant le tribunal correctionnel.',
      publicPossession: 'Amende Forfaitaire Délictuelle (AFD) de 200 € (minorée à 150 €, majorée à 450 €) avec inscription au casier judiciaire B2.',
      driving: 'Tolérance zéro : tout seuil détectable (dès 1 ng/ml de salive) constitue le délit de conduite après usage de stupéfiants.',
      workplace: 'Dépistage salivaire possible par l’employeur pour les postes de sécurité inscrits au règlement intérieur.',
      borderWarning: 'Attention frontalière : Ramener du cannabis d’Allemagne, de Belgique ou d’Espagne constitue une importation illicite de stupéfiants.',
    },
    es: {
      name: 'Espagne (España)',
      flag: '🇪🇸',
      simpleSummary: 'Toléré à la maison • Clubs Sociaux privés réservés aux résidents • Amendes dans la rue (601 €)',
      statusTitle: 'Modèle des Clubs Sociaux de Cannabis (CSC) & Sphère Privée',
      homeGrowSimple: '🟢 TOLÉRÉ : Dans la sphère privée, hors de la vue des voisins ou de la rue.',
      publicPossessionSimple: '🔴 INTERDIT DANS LA RUE : Amende administrative de 601 € minimum en cas de consommation publique.',
      drivingSimple: '🔴 TOLÉRANCE ZÉRO : Amendes sévères (1 000 €) et retrait de points.',
      cbdSimple: '🟢 LÉGAL : Sous condition de conformité européenne.',
      homeGrow: 'Dépénalisé dans l’espace purement privé au titre du droit fondamental à l’intimité du domicile.',
      publicPossession: 'Infraction administrative grave au titre de la Loi sur la Sécurité Citoyenne (Ley Mordaza).',
      driving: 'Seuil zéro administratif : présence constatée punie de 1 000 € d’amende.',
      workplace: 'Règles de sécurité standard sous contrôle de la médecine du travail.',
      borderWarning: 'Les envois postaux ou transports transfrontaliers vers la France sont activement traqués par les douanes.',
    },
    ch: {
      name: 'Suisse (Schweiz)',
      flag: '🇨🇭',
      simpleSummary: 'Cannabis léger (<1% THC) en vente libre • Essais pilotes en pharmacie • Amende simple de 100 CHF',
      statusTitle: 'Régime Fédéral Innovant & Cannabis Léger jusqu’à 1% THC',
      homeGrowSimple: '🟡 RÉGLEMENTÉ : Autorisé pour le chanvre <1% de THC ou dans le cadre d’essais pilotes municipaux.',
      publicPossessionSimple: '🟡 DÉPÉNALISÉ : Moins de 10g de THC = amende d’ordre de 100 CHF (sans inscription au casier).',
      drivingSimple: '🔴 TOLÉRANCE ZÉRO : Seuil sanguin de 1,5 microgramme/L.',
      cbdSimple: '🟢 TRÈS LIBRE : Seuil de THC autorisé jusqu’à 1,0% (vendu légalement comme produit du tabac).',
      homeGrow: 'Interdit pour les variétés fortes en THC hors projets pilotes scientifiques dans les grandes villes.',
      publicPossession: 'Dépénalisé pour les quantités inférieures à 10 grammes.',
      driving: 'Tolérance zéro stricte.',
      workplace: 'Protection de la santé des travailleurs selon le droit fédéral.',
      borderWarning: 'Le cannabis suisse contenant entre 0,3% et 1% de THC est illégal dès le passage de la douane française.',
    },
  };

  const current = countryData[selectedCountry];

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden transition-all duration-300">
      {/* 1. Header with European Justice / City Photography */}
      <div className="relative bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-blue-950/85 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                Pôle Droit & Société
              </span>
              <span className="text-xs text-blue-200/70 hidden sm:inline">
                Matrice Légale Européenne Comparée
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ce Que Vous Avez le Droit de Faire (ou Pas) en Europe
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Entre la légalisation en Allemagne, la culture autorisée au Luxembourg et la prohibition en France, la loi change dès que vous passez la frontière. Voici les règles claires pays par pays.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-md">
            <span className="text-[10px] font-extrabold uppercase text-slate-300 block text-center mb-1">
              Mode d&apos;Affichage Légal
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
                <Sparkles className="w-3.5 h-3.5 text-amber-950" />
                <span>En Bref (Feux Tricolores)</span>
              </button>
              <button
                onClick={() => setPedagogyMode('expert')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pedagogyMode === 'expert'
                    ? 'bg-blue-400 text-slate-950 shadow-sm font-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-950" />
                <span>Textes de Lois & Articles</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Country Selector Tabs */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['lu', 'de', 'fr', 'es', 'ch'] as const).map((code) => {
            const c = countryData[code];
            const isSelected = selectedCountry === code;
            return (
              <button
                key={code}
                onClick={() => setSelectedCountry(code)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.flag}</span>
                  <span className="font-black text-xs sm:text-sm text-slate-900 block truncate">
                    {c.name.split(' ')[0]}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate mt-1">
                  {code === 'fr' ? 'Prohibition THC' : code === 'de' ? 'Loi CanG 2024' : code === 'lu' ? 'Culture 4 plants' : code === 'es' ? 'Clubs Sociaux' : 'Chanvre <1%'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Dynamic Country Showcase */}
        {pedagogyMode === 'simple' ? (
          /* ================= MODE SIMPLE : FEUX TRICOLORES ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{current.flag}</span>
                <div>
                  <h4 className="text-base font-black text-slate-900">{current.name}</h4>
                  <p className="text-xs text-blue-900 font-semibold">{current.simpleSummary}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-sm">À la maison (Culture & Stock)</strong>
                <p className="text-slate-700 font-medium leading-relaxed">{current.homeGrowSimple}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-sm">Dans la rue (Espace Public)</strong>
                <p className="text-slate-700 font-medium leading-relaxed">{current.publicPossessionSimple}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-sm">Au volant (Conduite & Permis)</strong>
                <p className="text-slate-700 font-medium leading-relaxed">{current.drivingSimple}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold text-sm">Statut du CBD</strong>
                <p className="text-slate-700 font-medium leading-relaxed">{current.cbdSimple}</p>
              </div>
            </div>

            {/* Border Warning Alert */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Le Grand Piège des Frontières :</strong>
                <p className="mt-0.5 leading-relaxed">{current.borderWarning}</p>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE EXPERT : TEXTES DE LOIS ================= */
          <div className="space-y-4 bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400">Cadre Juridique National Officiel</span>
                <h4 className="text-base font-black text-white">{current.name} : {current.statusTitle}</h4>
              </div>
              <span className="text-2xl">{current.flag}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-blue-300 block font-bold">Auto-Culture & Détention Domicile :</strong>
                <p className="text-slate-300">{current.homeGrow}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-blue-300 block font-bold">Voie Publique & Sanctions :</strong>
                <p className="text-slate-300">{current.publicPossession}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-rose-400 block font-bold">Code de la Route & Seuils Salivaires :</strong>
                <p className="text-slate-300">{current.driving}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <strong className="text-teal-300 block font-bold">Droit du Travail & Entreprise :</strong>
                <p className="text-slate-300">{current.workplace}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
