import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, ChevronUp, ChevronDown, Award, ShieldCheck, Flower2, HeartHandshake } from 'lucide-react';
import { BotanicalLeafIcon, BotanicalFlowerIllustration, BotanicalFlowerIcon } from './BotanicalDecor';

interface BotanicalHeroBannerProps {
  activeTab: string;
}

interface BannerVisual {
  title: string;
  badge: string;
  image: string;
  quote: string;
  terpeneFocus: string;
}

const BOTANICAL_VISUALS: Record<string, BannerVisual> = {
  dashboard: {
    title: 'Sanctuaire Botanique & Clarté Personnelle',
    badge: 'Fleur Ciselée & Trichomes Vivants',
    image: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1600&q=85',
    quote: 'Harmonie entre la plante, l’écoute de son corps et la maîtrise de son bien-être au quotidien.',
    terpeneFocus: 'Myrcène & Bêta-Caryophyllène • Apaisement & Ancrage',
  },
  journal: {
    title: 'Journal de Bord & Écoute Botanique',
    badge: 'Observation Consciente & Ressentis',
    image: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1600&q=85',
    quote: 'Chaque ressenti noté est un pas vers une relation équilibrée, autonome et sereine avec soi-même.',
    terpeneFocus: 'Linalol & Nérolidol • Sérénité & Sommeil Réparateur',
  },
  goals: {
    title: 'Objectifs & Régulation Harmonieuse',
    badge: 'Sevrage Progressif & Microdosage',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=85',
    quote: 'Reprenez le contrôle en douceur avec des paliers réalistes, mesurables et respectueux de votre rythme.',
    terpeneFocus: 'Alpha-Pinène & Limonène • Clarté Mentale & Volonté',
  },
  coach: {
    title: 'Care & Écoute • Présentation Hybride & Sanctuaire',
    badge: 'Infographies Ludiques & Rigueur Clinique',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1600&q=85',
    quote: 'Comprendre la neurobiologie par l’image, s’appuyer sur la science validée et bénéficier d’une écoute sans jugement.',
    terpeneFocus: 'Humulène & Bisabolol • Apaisement & Résilience',
  },
  education: {
    title: 'Grand Hub du Savoir & Neurobiologie Botanique',
    badge: 'Fleur de Cannabis & Système Endocannabinoïde',
    image: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1600&q=85',
    quote: 'Comprendre la plante pour agir en conscience : récepteurs CB1/CB2, terpènes et réduction des risques.',
    terpeneFocus: 'Alpha-Pinène & Limonène • Clarté mentale & Vigilance',
  },
  stores: {
    title: 'Dispensaires d’Excellence & Fleurs de Terroir',
    badge: 'Sélection Artisanale • Certifiée HPLC < 0.3% THC',
    image: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=1600&q=85',
    quote: 'Fleurs affinées avec soin, profil terpénique préservé et traçabilité biologique complète.',
    terpeneFocus: 'Vollspektrum Terpenes • Arômes Citronnés & Boisés',
  },
  subscription: {
    title: 'Formules d’Accompagnement & Suivi Personnalisé',
    badge: 'Privilèges Botaniques & Accès Illimité',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=85',
    quote: 'Des parcours adaptés à vos besoins : accompagnement autonome, guidé ou coaching approfondi.',
    terpeneFocus: 'Cannabidiol & Cannabigérol • Synergie Régénératrice',
  },
  loyalty: {
    title: 'Cercle Privilège Botanique & Récompenses',
    badge: 'Fidélité Consciente & Avantages Partenaires',
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1600&q=85',
    quote: 'Valorisez votre progression et profitez de réductions exclusives chez nos partenaires certifiés.',
    terpeneFocus: 'Terpinolène & Géraniol • Énergie & Harmonie',
  },
  marketing: {
    title: 'Offres Partenaires & Innovations Vertes',
    badge: 'Sélection Rigoureuse & Éco-Responsable',
    image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1600&q=85',
    quote: 'Des marques éthiques, engagées dans l’agriculture propre et l’analyse en laboratoire indépendant.',
    terpeneFocus: 'Phytocannabinoïdes Naturels • Zéro Pesticide',
  },
  notifications: {
    title: 'Centre d’Alertes & Rappels Bienveillants',
    badge: 'Soutien Continu & Vigilance Douce',
    image: 'https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&w=1600&q=85',
    quote: 'Des rappels choisis au bon moment pour préserver votre équilibre et vos intentions de santé.',
    terpeneFocus: 'Caryophyllène • Équilibre Intérieur',
  },
  tracking: {
    title: 'Suivi Logistique & Expéditions Sécurisées',
    badge: 'Colis Neutres & Traçabilité Temps Réel',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=85',
    quote: 'Livraison discrète, sécurisée et conforme aux normes européennes de transport.',
    terpeneFocus: 'Emballage Protecteur • Qualité Garantie',
  },
  admin: {
    title: 'Console de Supervision & Sécurité Clinique',
    badge: 'Gouvernance RGPD & Pilotage Éthique',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=85',
    quote: 'Contrôle strict des flux de données chiffrées, modération et suivi des indicateurs sanitaires.',
    terpeneFocus: 'Audit Continu • Conformité 100%',
  },
  default: {
    title: 'CANNABIS CARE • Excellence Botanique & Prévention',
    badge: 'Culture Raisonnée & Savoir Médical',
    image: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1600&q=85',
    quote: 'L’alliance de la phytothérapie végétale de pointe et de l’autonomie de santé.',
    terpeneFocus: 'Spectre Complet Naturel • Richesse en Cannabinoïdes',
  },
};

export const BotanicalHeroBanner: React.FC<BotanicalHeroBannerProps> = ({ activeTab }) => {
  const { t } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);

  // Pick contextual visual
  const visualKey = BOTANICAL_VISUALS[activeTab] ? activeTab : 'default';
  const visual = BOTANICAL_VISUALS[visualKey];

  return (
    <div className="relative mb-6 rounded-3xl overflow-hidden border border-emerald-500/25 shadow-xl bg-slate-950 transition-all duration-300">
      {/* Background High-Definition Cannabis Flower & Leaves Photograph */}
      <div className="absolute inset-0">
        <img
          src={visual.image}
          alt="Cannabis botanical flower & leaves"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isMinimized ? 'opacity-25 scale-100' : 'opacity-40 scale-105 hover:scale-108'
          }`}
        />
        {/* Multilayer Rich Emerald, Amber & Obsidian Overlay for contrast & elegance */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/90 to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/15 via-amber-500/10 to-transparent" />
      </div>

      {/* Decorative Stylized Cannabis Flower & Leaf Watermarks */}
      <div className="absolute -bottom-8 -right-8 text-emerald-400/10 pointer-events-none transition-transform duration-700 hover:rotate-6">
        <BotanicalFlowerIllustration size={190} className="text-emerald-400/15" />
      </div>
      <div className="absolute -top-10 right-32 text-amber-400/8 pointer-events-none hidden sm:block">
        <BotanicalLeafIcon size={130} variant="detailed" className="text-amber-400/10" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 px-5 py-4 sm:px-8 sm:py-6 text-white flex flex-col justify-between">
        {/* Top bar: Badge & Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-400/40 backdrop-blur-md shadow-xs">
              <BotanicalFlowerIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>{t(visual.badge, visual.badge)}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-900/60 text-emerald-200 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>CANNABIS CARE Phytothérapie</span>
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/10 transition cursor-pointer text-xs flex items-center gap-1 backdrop-blur-md"
            title={isMinimized ? 'Agrandir la bannière' : 'Réduire la bannière'}
          >
            <span className="hidden sm:inline text-[11px] font-medium">
              {isMinimized ? 'Afficher' : 'Minimiser'}
            </span>
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded View */}
        {!isMinimized ? (
          <div className="mt-3 sm:mt-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-3xl">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-outfit text-white tracking-tight leading-snug drop-shadow-xs">
                  {t(visual.title, visual.title)}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed mt-1">
                  « {t(visual.quote, visual.quote)} »
                </p>
              </div>
              <div className="hidden sm:flex items-center justify-center w-24 h-24 rounded-2xl bg-[#042416] shadow-xl border border-amber-400/50 shrink-0 overflow-hidden">
                <img
                  src="/assets/aistudio/logo_officiel_cannabis_care_sombre_5d1e8e7a.jpg"
                  alt="Logo officiel CANNABIS CARE — Suivez, Équilibrez, Prenez Soin"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bottom Tagline & Botanical Highlights */}
            <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-200/80">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold">Profil Terpénique :</span>
                <span className="font-semibold text-white">{visual.terpeneFocus}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Laboratoire Certifié</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Conforme Normes UE</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between text-xs text-emerald-200">
            <span className="font-bold font-outfit text-white truncate max-w-md">{t(visual.title, visual.title)}</span>
            <span className="text-[11px] text-emerald-300/80 hidden sm:inline">{visual.terpeneFocus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
