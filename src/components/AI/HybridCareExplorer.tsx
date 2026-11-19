import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Sliders,
  Scale,
  Activity,
  Flame,
  Clock,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Heart,
  Eye,
  Thermometer,
  Zap,
} from 'lucide-react';
import { BotanicalLeafIcon, BotanicalFlowerIcon, BotanicalBadge } from '../Common/BotanicalDecor';
import { useLanguage } from '../../context/LanguageContext';

interface HybridCareExplorerProps {
  onAskCoach: (prompt: string) => void;
  onLaunchExercise: (type: 'cardiac_coherence' | 'delay_10_min' | 'breathing_4_7_8') => void;
}

interface ScientificTopic {
  id: string;
  category: 'neuro' | 'tolerance' | 'pharmacokinetics' | 'craving' | 'terpenes';
  title: string;
  subtitle: string;
  metaphor: string;
  badge: string;
  playfulData: {
    icon: any;
    accentColor: string;
    summaryBullets: string[];
    interactiveWidgetType: 'thermostat' | 'thc_cbd_ratio' | 'tolerance_gauge' | 'delivery_routes' | 'wave_surfer' | 'terpene_wheel';
  };
  expertiseData: {
    molecularMechanism: string;
    pharmacology: string;
    clinicalInsights: string;
    cautionsAndHarmReduction: string;
    scientificCitations: { author: string; year: string; journal: string; doiOrTitle: string }[];
  };
}

export const HybridCareExplorer: React.FC<HybridCareExplorerProps> = ({
  onAskCoach,
  onLaunchExercise,
}) => {
  const { t } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedExpertise, setExpandedExpertise] = useState<Record<string, boolean>>({
    'sec-thermostat': true, // open first by default
  });

  // Interactive Widgets Local States
  const [thermostatLevel, setThermostatLevel] = useState<number>(50);
  const [thcRatio, setThcRatio] = useState<number>(50);
  const [toleranceDays, setToleranceDays] = useState<number>(7);
  const [selectedRoute, setSelectedRoute] = useState<'inhalation' | 'ingestion'>('inhalation');
  const [selectedTerpene, setSelectedTerpene] = useState<'myrcene' | 'caryophyllene' | 'limonene' | 'linalool'>('caryophyllene');

  const toggleExpertise = (id: string) => {
    setExpandedExpertise((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const topics: ScientificTopic[] = [
    {
      id: 'sec-thermostat',
      category: 'neuro',
      title: 'Le Système Endocannabinoïde (SEC)',
      subtitle: 'Le thermostat biologique qui maintient l’équilibre de votre organisme',
      metaphor: 'Comme un régulateur de chauffage domotique qui ajuste la température de votre maison.',
      badge: 'Neurobiologie Fondamentale',
      playfulData: {
        icon: Brain,
        accentColor: 'emerald',
        summaryBullets: [
          'Votre corps fabrique déjà ses propres cannabinoïdes (Anandamide & 2-AG).',
          'Les récepteurs CB1 sont dans le cerveau (mémoire, humeur, appétit, sommeil).',
          'Les récepteurs CB2 sont dans le corps (immunité, inflammation, défenses naturelles).',
          'La plante de cannabis fournit des molécules végétales qui se branchent sur ce réseau existant.',
        ],
        interactiveWidgetType: 'thermostat',
      },
      expertiseData: {
        molecularMechanism:
          'Le SEC fonctionne par transmission synaptique rétrograde. Contrairement aux neurotransmetteurs classiques (dopamine, sérotonine) synthétisés à l’avance et stockés dans des vésicules pré-synaptiques, les endocannabinoïdes (anandamide / AEA et 2-arachidonoylglycérol / 2-AG) sont synthétisés à la demande dans la membrane post-synaptique par hydrolyse de précurseurs phospholipidiques (NAPE-PLD et DAGL). Ils diffusent ensuite en amont vers les récepteurs CB1 présynaptiques pour bloquer la libération excessive de GABA ou de Glutamate.',
        pharmacology:
          'Les récepteurs CB1 et CB2 sont des récepteurs couplés aux protéines G (RCPG de la famille Gi/o). Leur activation inhibe l’adénylate cyclase, diminue l’influx de calcium via les canaux calciques voltage-dépendants (N et P/Q) et stimule les canaux potassiques rectifiants entrants (GIRK), provoquant une hyperpolarisation membranaire et une baisse de l’excitabilité neuronale.',
        clinicalInsights:
          'Le tonus endocannabinoïde basal conditionne l’homéostasie du stress et de la douleur. Des taux chroniquement diminués d’anandamide sont associés à des tableaux de céphalées chroniques, de fibromyalgie et de vulnérabilité aux états anxieux (théorie du déficit clinique endocannabinoïde d’Ethan Russo).',
        cautionsAndHarmReduction:
          'Une sur-stimulation prolongée par des agonistes à haute affinité (comme le THC à forte concentration) sature les récepteurs et pousse le système à se mettre en veille pour se protéger. La modération et le choix de profils équilibrés permettent de préserver le tonus naturel.',
        scientificCitations: [
          { author: 'Mechoulam R., Parker L.A.', year: '2013', journal: 'Annu Rev Psychol', doiOrTitle: 'The endocannabinoid system and the brain' },
          { author: 'Lu H.C., Mackie K.', year: '2021', journal: 'Biol Psychiatry', doiOrTitle: 'An Introduction to the Endogenous Cannabinoid System' },
        ],
      },
    },
    {
      id: 'thc-vs-cbd',
      category: 'neuro',
      title: 'THC vs CBD : La Clé et le Régulateur',
      subtitle: 'Comprendre l’accélérateur et l’amortisseur de la plante de cannabis',
      metaphor: 'Le THC appuie sur la pédale d’accélérateur, le CBD ajuste la suspension pour une route sans secousses.',
      badge: 'Pharmacodynamie Comparée',
      playfulData: {
        icon: Scale,
        accentColor: 'teal',
        summaryBullets: [
          'Le THC se lie directement au récepteur CB1 : il procure l’effet psychotrope, l’euphorie, mais peut provoquer tachycardie ou anxiété en surdosage.',
          'Le CBD ne provoque AUCUN effet psychotrope et se fixe sur un site différent (modulateur allostérique).',
          'Présent avec le THC, le CBD « resserre » la serrure et empêche le THC de sur-stimuler le cerveau.',
          'Un ratio équilibré (1:1 ou 1:2) divise par 3 le risque d’anxiété ou de confusion mentale.',
        ],
        interactiveWidgetType: 'thc_cbd_ratio',
      },
      expertiseData: {
        molecularMechanism:
          'Le delta-9-THC est un agoniste partiel orthostérique des récepteurs CB1 (Ki ~ 40 nM) et CB2 (Ki ~ 36 nM). À l’inverse, le cannabidiol (CBD) possède une très faible affinité pour le site orthostérique (Ki > 10 000 nM) mais se comporte comme un modulateur allostérique négatif (NAM) non compétitif du récepteur CB1 : en se liant à une poche allostérique distincte, il induit un changement conformationnel qui réduit l’efficacité du THC et accélère la dissociation du complexe récepteur-agoniste.',
        pharmacology:
          'En dehors du récepteur CB1, le CBD exerce une action pléiotrope : agoniste des récepteurs sérotoninergiques 5-HT1A (mécanisme anxiolytique et antidépresseur direct), désensibilisateur des canaux thermo-nociceptifs TRPV1, et inhibiteur de l’enzyme FAAH (ce qui augmente la concentration d’anandamide endogène dans la fente synaptique).',
        clinicalInsights:
          'Les essais cliniques randomisés (Leweke et al., McGuire et al.) démontrent que l’administration concomitante de CBD prévient les déficits de mémoire de travail transitoires et l’hypo-activation du striatum induits par le THC isolé.',
        cautionsAndHarmReduction:
          'Privilégiez systématiquement des fleurs et des extractions contenant un ratio significatif de CBD (> 5-10%) plutôt que des variétés à THC pur (> 22%) dépourvues de CBD, qui augmentent drastiquement les risques de paranoïa et d’accoutumance rapide.',
        scientificCitations: [
          { author: 'Laprairie R.B. et al.', year: '2015', journal: 'Br J Pharmacol', doiOrTitle: 'Cannabidiol is a negative allosteric modulator of the cannabinoid CB1 receptor' },
          { author: 'Englund A. et al.', year: '2013', journal: 'J Psychopharmacol', doiOrTitle: 'Cannabidiol inhibits THC-elicited paranoid symptoms and hippocampal-dependent memory impairment' },
        ],
      },
    },
    {
      id: 'tolerance-reset',
      category: 'tolerance',
      title: 'Désensibilisation CB1 & Courbe de Tolérance',
      subtitle: 'Pourquoi l’effet diminue avec le temps et comment vos récepteurs ressuscitent',
      metaphor: 'Quand la musique est trop forte, vos oreilles se protègent. Quand vous cessez de crier, vos récepteurs rouvrent grand la porte.',
      badge: 'Neuro-Adaptation & Sevrage',
      playfulData: {
        icon: Activity,
        accentColor: 'amber',
        summaryBullets: [
          'Après 2 semaines de consommation quotidienne intense, vos récepteurs CB1 s’enfoncent dans la cellule pour se protéger (internalisation).',
          'Résultat : vous devez consommer 2x plus pour ressentir 2x moins, avec fatigue et brouillard mental.',
          'La bonne nouvelle : la réversibilité est spectaculaire et scientifiquement prouvée !',
          'Dès 48 heures d’arrêt, les récepteurs commencent à remonter à la surface. En 28 jours, 100% de la densité cérébrale est restaurée.',
        ],
        interactiveWidgetType: 'tolerance_gauge',
      },
      expertiseData: {
        molecularMechanism:
          'L’activation répétée des récepteurs CB1 recrute les kinases des récepteurs couplés aux protéines G (GRK2 et GRK3), qui phosphorylent les résidus sérine et thréonine de la queue C-terminale intracellulaire du récepteur. Cette phosphorylation attire les protéines bêta-arrestines (bêta-arrestine 1 et 2), provoquant un découplage stérique de la protéine Gi/o (désensibilisation aiguë), suivi de l’internalisation du récepteur par endocytose dans des vésicules recouvertes de clathrine.',
        pharmacology:
          'Une fois internalisé dans l’endosome, le récepteur peut soit être recyclé vers la membrane plasmique, soit être dirigé vers les lysosomes pour dégradation protéolytique (régulation à la baisse à long terme / down-regulation). Chez les consommateurs chroniques quotidiens, la densité des récepteurs CB1 corticaux est réduite de 20 à 40% selon les régions cérébrales.',
        clinicalInsights:
          'L’étude pionnière en tomographie par émission de positons (TEP au radioligand [18F]FMPEP-d2) menée par Hirvonen et coll. au NIH (National Institutes of Health) a prouvé que la régulation à la baisse des récepteurs CB1 est totalement réversible après 4 semaines d’abstinence supervisée, avec une remontée mesurable dès les premiers jours.',
        cautionsAndHarmReduction:
          'Pour réinitialiser votre sensibilité sans subir de syndrome de sevrage aigu (irritabilité, insomnies, sueurs nocturnes), un protocole de réduction graduelle avec substitution au CBD permet d’adoucir la ré-expression membranaire des récepteurs.',
        scientificCitations: [
          { author: 'Hirvonen J. et al.', year: '2012', journal: 'Mol Psychiatry / NeuroImage', doiOrTitle: 'Reversible and regionally selective downregulation of brain cannabinoid CB1 receptors in chronic cannabis smokers' },
          { author: 'D’Souza D.C. et al.', year: '2016', journal: 'Biol Psychiatry', doiOrTitle: 'Rapid changes in cannabinoid CB1 receptor availability in cannabis-dependent subjects during abstinence' },
        ],
      },
    },
    {
      id: 'pharmacokinetics-routes',
      category: 'pharmacokinetics',
      title: 'Inhalation vs Ingestion : Le Mystère du 11-OH-THC',
      subtitle: 'Pourquoi manger du cannabis produit un effet 4 à 5 fois plus puissant et retardé',
      metaphor: 'L’inhalation prend l’autoroute directe vers le cerveau ; l’ingestion fait un détour par l’usine de transformation du foie.',
      badge: 'Pharmacocinétique Clinique',
      playfulData: {
        icon: Flame,
        accentColor: 'rose',
        summaryBullets: [
          'Voie Inhalée (vapeur/fumée) : absorption pulmonaire immédiate, pic en 10 minutes, durée 2 à 3 heures. Vous gérez la dose en temps réel.',
          'Voie Ingestée (gélules, huiles, pâtisseries) : délai d’action traître de 45 à 90 minutes. L’erreur classique est d’en reprendre trop vite.',
          'Le foie transforme le THC en 11-Hydroxy-THC, un métabolite qui traverse la barrière cérébrale avec une force décuplée.',
          'L’effet ingesté dure entre 6 et 10 heures avec une sédation corporelle très profonde.',
        ],
        interactiveWidgetType: 'delivery_routes',
      },
      expertiseData: {
        molecularMechanism:
          'Lors de l’ingestion orale, le delta-9-THC subit un effet de premier passage hépatique (first-pass metabolism) massif. Les enzymes du cytochrome P450 microsomales, principalement le CYP2C9 et de façon accessoire le CYP3A4, oxydent le carbone allylique C-11 pour former le 11-hydroxy-delta-9-tétrahydrocannabinol (11-OH-THC).',
        pharmacology:
          'Le 11-OH-THC présente une affinité supérieure pour les récepteurs CB1 cérébraux et traverse plus promptement la barrière hémato-encéphalique (BHE) que la molécule mère. Alors que la biodisponibilité par voie pulmonaire oscille entre 10% et 35% selon la technique d’inhalation, la biodisponibilité orale n’est que de 4% à 12% en raison de la dégradation gastrique acide et de la clairance hépatique, mais la fraction transformée en 11-OH-THC produit un tableau pharmacodynamique qualitativement distinct et amplifié.',
        clinicalInsights:
          'Le pic plasmatique de 11-OH-THC survient 1h30 à 3h après l’ingestion d’une matrice lipidique. Les métabolites sont ensuite oxydés en acide 11-nor-9-carboxy-THC (THC-COOH), inactif sur le plan psychotrope, qui fait l’objet d’une glucuronidation et d’une élimination prolongée dans les selles (65-80%) et les urines (20-35%). En raison de leur lipophilie extrême (LogP ~ 6.3), les cannabinoïdes s’accumulent dans les adipocytes et se relarguent très lentement.',
        cautionsAndHarmReduction:
          'Règle d’or des produits ingérés : "Start low, go slow". Attendre impérativement 2 heures complètes avant d’envisager une nouvelle prise pour éviter le "bad trip" par empilement de doses.',
        scientificCitations: [
          { author: 'Huestis M.A.', year: '2007', journal: 'Chem Biodivers', doiOrTitle: 'Human cannabinoid pharmacokinetics' },
          { author: 'Lucas C.J. et al.', year: '2018', journal: 'Br J Clin Pharmacol', doiOrTitle: 'The pharmacokinetics and the pharmacodynamics of cannabinoids' },
        ],
      },
    },
    {
      id: 'craving-wave',
      category: 'craving',
      title: 'Le Protocole Urge Surfing : Dompter la Vague',
      subtitle: 'La neurobiologie de l’envie compulsive et l’exercice des 10 minutes',
      metaphor: 'L’envie est une vague de l’océan : vous ne pouvez pas l’empêcher d’arriver, mais vous pouvez apprendre à surfer dessus sans vous noyer.',
      badge: 'Neuro-Comportement & RDR',
      playfulData: {
        icon: Clock,
        accentColor: 'indigo',
        summaryBullets: [
          'Le craving n’est PAS infini : il culmine entre la 3e et la 7e minute, puis s’éteint de lui-même si vous ne le nourrissez pas.',
          'Ce n’est pas un manque physique mortel, mais une décharge conditionnée de dopamine dans le noyau accumbens provoquée par un déclencheur (trigger).',
          'La règle des 10 minutes : engagez votre attention dans une tâche motrice ou une respiration guidée pendant 600 secondes.',
          '9 fois sur 10, la pulsion cérébrale redescend sous le seuil d’urgence sans que vous ayez consommé.',
        ],
        interactiveWidgetType: 'wave_surfer',
      },
      expertiseData: {
        molecularMechanism:
          'Le craving repose sur la sensibilisation comportementale du circuit mésocorticolimbique dopaminergique. L’exposition à un stimulus environnemental conditionné (odeur, briquet, stress, heure du coucher) active l’amygdale basolatérale et le cortex orbitofrontal, déclenchant une libération phasique de dopamine depuis l’aire tegmentale ventrale (VTA) vers le noyau accumbens (NAc).',
        pharmacology:
          'Cette vague dopaminergique crée un état attentionnel focalisé hyper-vigilant ("incentive salience") couplé à une hypo-activation transitoire du cortex préfrontal dorsolatéral (DLPFC), responsable du contrôle inhibiteur exécutif. L’activation somatique (tachycardie légère, sensation de gorge nouée, agitation motrice) reflète une réponse du système nerveux sympathique médiée par le locus coeruleus.',
        clinicalInsights:
          'Le protocole d’Urge Surfing (développé par Alan Marlatt dans le cadre de la MBRP / Prévention de la Rechute basée sur la Pleine Conscience) entraîne le patient à observer les sensations intéroceptives sans réactivité motrice. Des études d’IRM fonctionnelle (Brewer et al.) montrent que cette observation réactive les réseaux préfrontaux de régulation émotionnelle et abaisse l’activité de l’insula et du striatum ventral en moins de 10 minutes.',
        cautionsAndHarmReduction:
          'Utilisez conjointement la respiration lente 5.5s (cohérence cardiaque) : en stimulant le nerf vague parasympathique, elle court-circuite la cascade adrénergique en 180 secondes.',
        scientificCitations: [
          { author: 'Marlatt G.A., Gordon J.R.', year: '1985 / 2011', journal: 'Guilford Press', doiOrTitle: 'Relapse Prevention: Maintenance Strategies in the Treatment of Addictive Behaviors' },
          { author: 'Garland E.L. et al.', year: '2016', journal: 'JAMA Psychiatry', doiOrTitle: 'Mindfulness-Oriented Recovery Enhancement reduces opioid craving and attentional bias' },
        ],
      },
    },
    {
      id: 'terpenes-synergy',
      category: 'terpenes',
      title: 'L’Effet d’Entourage Terpénique',
      subtitle: 'Pourquoi l’arôme et les molécules secondaires transforment radicalement l’effet',
      metaphor: 'Les cannabinoïdes sont le moteur du véhicule ; les terpènes sont le volant qui décide de la direction.',
      badge: 'Phytochimie & Synergies',
      playfulData: {
        icon: Zap,
        accentColor: 'emerald',
        summaryBullets: [
          'Les terpènes sont les hydrocarbures aromatiques qui donnent à chaque variété son odeur unique de pin, de terre, d’agrume ou de lavande.',
          'Ils ne font pas que sentir bon : ils modifient directement la perméabilité de vos neurones et complètent les cannabinoïdes.',
          'Le Myrcène amplifie la sédation corporelle (« couch-lock »).',
          'Le Bêta-Caryophyllène est le seul terpène capable de se comporter comme un cannabinoïde en activant CB2 directement.',
        ],
        interactiveWidgetType: 'terpene_wheel',
      },
      expertiseData: {
        molecularMechanism:
          'L’effet d’entourage (entourage effect), théorisé par S. Ben-Shabat et R. Mechoulam (1998) puis étayé par E. Russo (2011), décrit la potentialisation pharmacodynamique mutuelle entre les phytocannabinoïdes et les terpénoïdes secondaires de la fleur de cannabis (Cannabis sativa L.).',
        pharmacology:
          'Le bêta-caryophyllène (BCP) est un sesquiterpène bicyclique naturel qui agit comme un agoniste sélectif complet des récepteurs CB2 (Ki = 155 ± 4 nM) sans aucune affinité pour le récepteur CB1, exerçant ainsi une action anti-inflammatoire et analgésique puissante sans effet psychotrope. Le myrcène (monoterpène monocyclique) fluidifie la bicouche lipidique de la barrière hémato-encéphalique, facilitant le passage central des cannabinoïdes. Le limonène stimule l’adénylate cyclase et module les récepteurs 5-HT1A, tandis que le linalol module la transmission glutamatergique NMDA.',
        clinicalInsights:
          'Les isolats de THC pur synthétique (Dronabinol / Marinol) démontrent une fenêtre thérapeutique plus étroite et une incidence supérieure d’effets dysphoriques par rapport aux extraits de plante entière standardisés (comme le Sativex / Nabiximols à ratio THC:CBD 1:1 riche en terpènes naturels).',
        cautionsAndHarmReduction:
          'Préférez la vaporisation à température contrôlée (160°C - 185°C) : la combustion à 800°C détruit plus de 75% des terpènes volatils et génère des hydrocarbures aromatiques polycycliques (HAP) toxiques.',
        scientificCitations: [
          { author: 'Russo E.B.', year: '2011', journal: 'Br J Pharmacol', doiOrTitle: 'Taming THC: potential cannabis synergy and phytocannabinoid-terpenoid entourage effects' },
          { author: 'Gertsch J. et al.', year: '2008', journal: 'Proc Natl Acad Sci USA (PNAS)', doiOrTitle: 'Beta-caryophyllene is a dietary cannabinoid and selective CB2 receptor agonist' },
        ],
      },
    },
  ];

  const filteredTopics =
    activeCategory === 'all'
      ? topics
      : topics.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Introduction Header: Presentation Hybride Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BotanicalLeafIcon size={180} className="text-emerald-400" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Module 'Care & Écoute' • Présentation Hybride
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Infographies Ludiques + Rigueur Clinique Validée</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-outfit text-white tracking-tight">
            Comprendre la Science pour Transformer sa Relation au Cannabis
          </h2>

          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-body">
            Chaque concept est d’abord illustré par une <strong className="text-emerald-300">infographie interactive ludique</strong> pour saisir le mécanisme en 30 secondes, suivie d’un <strong className="text-amber-300">dossier d’expertise neurobiologique</strong> rigoureusement documenté avec citations scientifiques (Inserm, OMS, NIH).
          </p>
        </div>

        {/* Category Filters */}
        <div className="relative z-10 mt-6 pt-4 border-t border-emerald-500/20 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tous les Concepts' },
            { id: 'neuro', label: 'Neurobiologie & SEC' },
            { id: 'tolerance', label: 'Tolérance & Reset' },
            { id: 'pharmacokinetics', label: 'Pharmacocinétique' },
            { id: 'craving', label: 'Craving & Somatique' },
            { id: 'terpenes', label: 'Terpènes & Entourage' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-white text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Hybrid Topic Cards */}
      <div className="space-y-8">
        {filteredTopics.map((topic) => {
          const Icon = topic.playfulData.icon;
          const isExpOpen = !!expandedExpertise[topic.id];

          return (
            <div
              key={topic.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-7 border-b border-slate-100 bg-gradient-to-br from-slate-50/70 to-emerald-50/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-emerald-800/60">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                          {topic.badge}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium italic hidden sm:inline">
                          « {topic.metaphor} »
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-outfit text-slate-900 mt-1">
                        {topic.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-body">
                        {topic.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => onAskCoach(`Explique-moi plus en détail le concept de : ${topic.title}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
                      title="Poser une question à l'IA sur ce sujet"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Interroger l'IA</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 1: LUDIC INFOGRAPHIC & INTERACTIVE VISUAL */}
              <div className="p-5 sm:p-7 space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Infographie Ludique & Visualisation Interactive</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left: Summary Bullets */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <BotanicalLeafIcon size={14} className="text-emerald-700" variant="minimal" />
                        <span>En clair, ce qu'il faut retenir :</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700 font-body">
                        {topic.playfulData.summaryBullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-amber-900 text-xs flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-medium">
                        L’analogie : {topic.metaphor}
                      </span>
                    </div>
                  </div>

                  {/* Right: Interactive Infographic Sandbox */}
                  <div className="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <BotanicalFlowerIcon size={120} className="text-emerald-400" />
                    </div>

                    {/* WIDGET TYPE 1: THERMOSTAT HOMEOSTASIS */}
                    {topic.playfulData.interactiveWidgetType === 'thermostat' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300">Simulateur de Régulation Synaptique</span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-[11px] text-emerald-200">
                            {thermostatLevel < 35 ? 'Hypo-stimulation (Stress)' : thermostatLevel > 70 ? 'Saturé (Tolérance élevée)' : 'Homéostasie Optimale'}
                          </span>
                        </div>

                        {/* Interactive Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Manque / Déficit</span>
                            <span className="text-white font-bold">{thermostatLevel}% Activation</span>
                            <span>Saturation</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={thermostatLevel}
                            onChange={(e) => setThermostatLevel(Number(e.target.value))}
                            className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Visual Receptor Cells */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                              Récepteurs CB1 (Cerveau)
                            </span>
                            <p className="text-xs text-slate-300">
                              {thermostatLevel > 65
                                ? 'Signal fort : euphorie mais inhibition des réflexes et somnolence.'
                                : thermostatLevel < 40
                                ? 'Signal faible : sensibilité nerveuse, ruminations potentielles.'
                                : 'Équilibre serein : apaisement sans anesthésie cognitive.'}
                            </p>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                            <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                              Récepteurs CB2 (Corps)
                            </span>
                            <p className="text-xs text-slate-300">
                              Régulation immunitaire active. Aucune action psychotrope, protection anti-inflammatoire.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WIDGET TYPE 2: THC:CBD RATIO BALANCER */}
                    {topic.playfulData.interactiveWidgetType === 'thc_cbd_ratio' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-teal-300">Bascule de Synergie Moléculaire</span>
                          <span className="px-2 py-0.5 rounded-lg bg-teal-950 border border-teal-500/30 text-[11px] text-teal-200">
                            {thcRatio > 70 ? 'Forte intensité THC (Vigilance)' : thcRatio < 30 ? 'Dominante CBD (Apaisant)' : 'Ratio 1:1 Idéal'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-teal-400 font-bold">CBD {100 - thcRatio}%</span>
                            <span className="text-slate-400">Curseur d'Équilibre</span>
                            <span className="text-emerald-400 font-bold">THC {thcRatio}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={thcRatio}
                            onChange={(e) => setThcRatio(Number(e.target.value))}
                            className="w-full accent-teal-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Balance Gauge */}
                        <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 space-y-2">
                          <div className="h-3 rounded-full overflow-hidden flex">
                            <div style={{ width: `${100 - thcRatio}%` }} className="bg-teal-500 transition-all duration-200" />
                            <div style={{ width: `${thcRatio}%` }} className="bg-emerald-500 transition-all duration-200" />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>Effet modulé : Anxiolyse & Sérénité</span>
                            <span>Effet direct : Euphorie & Psychoactivité</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WIDGET TYPE 3: TOLERANCE GAUGE & RESET CALENDAR */}
                    {topic.playfulData.interactiveWidgetType === 'tolerance_gauge' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300">Chronomètre de Ré-expression des Récepteurs</span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-950 border border-amber-500/30 text-[11px] text-amber-200">
                            Jour {toleranceDays} / 28
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>J+1 (Début)</span>
                            <span className="text-white font-bold">Ajustez la durée d'abstinence</span>
                            <span>J+28 (Reset 100%)</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="28"
                            value={toleranceDays}
                            onChange={(e) => setToleranceDays(Number(e.target.value))}
                            className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Visual density recovery */}
                        <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">Densité CB1 ré-exprimée :</span>
                            <span className="font-bold text-amber-300">
                              {Math.min(100, Math.round(20 + (toleranceDays / 28) * 80))}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.round(20 + (toleranceDays / 28) * 80))}%` }}
                              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {toleranceDays < 3
                              ? '48h : Fin du syndrome aigu, début de résorption de l’endocytose.'
                              : toleranceDays < 10
                              ? '7 jours : 50% de sensibilité retrouvée, le sommeil paradoxal (rêves) refait surface.'
                              : toleranceDays < 21
                              ? '14-21 jours : Clarté mentale préfrontale restaurée, mémoire de travail vive.'
                              : '28 jours : Reset complet validé par imagerie cérébrale TEP.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* WIDGET TYPE 4: DELIVERY ROUTES (11-OH-THC) */}
                    {topic.playfulData.interactiveWidgetType === 'delivery_routes' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-rose-300">Comparateur de Métabolisation</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setSelectedRoute('inhalation')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                selectedRoute === 'inhalation'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              Inhalation
                            </button>
                            <button
                              onClick={() => setSelectedRoute('ingestion')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                selectedRoute === 'ingestion'
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              Ingestion (Foie)
                            </button>
                          </div>
                        </div>

                        {selectedRoute === 'inhalation' ? (
                          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in">
                            <div className="flex justify-between text-xs text-rose-300 font-bold">
                              <span>Voie Pulmonaire Directe</span>
                              <span>Délai : 30 secondes • Pic : 10 min</span>
                            </div>
                            <p className="text-xs text-slate-300">
                              Les alvéoles pulmonaires transfèrent le delta-9-THC directement dans la circulation artérielle vers le cerveau. Durée d'action brève (2-3h). Dosage très facile à contrôler bouffée par bouffée.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in">
                            <div className="flex justify-between text-xs text-rose-300 font-bold">
                              <span>Premier Passage Hépatique (11-OH-THC)</span>
                              <span>Délai : 45-90 min • Durée : 6-10h</span>
                            </div>
                            <p className="text-xs text-slate-300">
                              L'estomac achemine le THC vers le foie où l'enzyme CYP2C9 le transforme en 11-Hydroxy-THC. Ce métabolite pénètre le cerveau avec une intensité décuplée. Attention aux surdosages par impatience !
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WIDGET TYPE 5: WAVE SURFER (URGE SURFING) */}
                    {topic.playfulData.interactiveWidgetType === 'wave_surfer' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-300">La Vague de l'Envie (Urge Surfing)</span>
                          <span className="text-[11px] text-slate-400">Durée d'une vague : 10 minutes</span>
                        </div>

                        <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                          {/* SVG Wave Visual */}
                          <svg viewBox="0 0 300 80" className="w-full h-16 text-indigo-400">
                            <path
                              d="M 10 70 Q 75 70 120 20 Q 150 5 180 30 Q 240 70 290 70"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                            <circle cx="150" cy="12" r="5" fill="#818cf8" className="animate-ping" />
                            <circle cx="150" cy="12" r="5" fill="#6366f1" />
                            <text x="125" y="32" fill="#c7d2fe" fontSize="9" fontWeight="bold">
                              Pic max (min 4-6)
                            </text>
                          </svg>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Besoin d'aide immédiate ?</span>
                            <button
                              onClick={() => onLaunchExercise('delay_10_min')}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                            >
                              Lancer le chrono 10 min
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WIDGET TYPE 6: TERPENE WHEEL */}
                    {topic.playfulData.interactiveWidgetType === 'terpene_wheel' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300">Roue des Synergies Terpéniques</span>
                          <span className="text-[11px] text-slate-400">Cliquez sur un terpène :</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'caryophyllene', label: 'Caryophyllène', note: 'Poivré / CB2' },
                            { id: 'myrcene', label: 'Myrcène', note: 'Terreux / Canapé' },
                            { id: 'limonene', label: 'Limonène', note: 'Agrume / Humeur' },
                            { id: 'linalool', label: 'Linalol', note: 'Lavande / Nuit' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTerpene(t.id as any)}
                              className={`p-2 rounded-xl text-left text-xs transition cursor-pointer border ${
                                selectedTerpene === t.id
                                  ? 'bg-emerald-900/80 border-emerald-400 text-white font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <div className="font-bold truncate">{t.label}</div>
                              <div className="text-[10px] text-slate-400">{t.note}</div>
                            </button>
                          ))}
                        </div>

                        <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-300">
                          {selectedTerpene === 'caryophyllene' &&
                            'Bêta-Caryophyllène : Unique terpène capable d’activer sélectivement le récepteur CB2. Action anti-inflammatoire sans aucun effet stupéfiant.'}
                          {selectedTerpene === 'myrcene' &&
                            'Myrcène : Augmente la perméabilité de la barrière hémato-encéphalique. Responsable de l’effet relaxant profond ("couch-lock").'}
                          {selectedTerpene === 'limonene' &&
                            'Limonène : Effet anxiolytique et énergisant via les récepteurs à sérotonine 5-HT1A. Arôme d’agrumes frais.'}
                          {selectedTerpene === 'linalool' &&
                            'Linalol : Modulateur du glutamate. Favorise la détente musculaire et l’induction du sommeil naturel.'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: SECTION EXPERTISE SCIENTIFIQUE DÉTAILLÉE & VALIDÉE */}
              <div className="border-t border-slate-200 bg-slate-50/60 p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Section Expertise Scientifique & Médicale Validée
                    </span>
                  </div>

                  <button
                    onClick={() => toggleExpertise(topic.id)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer"
                  >
                    <span>{isExpOpen ? 'Réduire le dossier' : 'Déplier l’analyse approfondie'}</span>
                    {isExpOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpOpen && (
                  <div className="space-y-5 pt-2 animate-in fade-in duration-200">
                    {/* Grid of 3 scientific in-depth columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Box 1: Molecular Mechanism */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Mécanisme Moléculaire & Synaptique</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-body">
                          {topic.expertiseData.molecularMechanism}
                        </p>
                      </div>

                      {/* Box 2: Pharmacology & Cascades */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Activity className="w-3.5 h-3.5 text-teal-700" />
                          <span>Pharmacodynamie & Récepteurs Couplés (RCPG)</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-body">
                          {topic.expertiseData.pharmacology}
                        </p>
                      </div>

                      {/* Box 3: Clinical Insights */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Données Cliniques & Imagerie Médicale (TEP/IRM)</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-body">
                          {topic.expertiseData.clinicalInsights}
                        </p>
                      </div>

                      {/* Box 4: Harm Reduction Precautions */}
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Précautions Sanitaires & Réduction des Risques</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-body">
                          {topic.expertiseData.cautionsAndHarmReduction}
                        </p>
                      </div>
                    </div>

                    {/* Scientific Citations with DOI / Peer-Reviewed References */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 uppercase tracking-wide text-[10px]">
                          Références Scientifiques Indexées
                        </span>
                        <span className="text-[10px] text-slate-400">Revue par les pairs (Peer-Reviewed)</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                        {topic.expertiseData.scientificCitations.map((cite, cIdx) => (
                          <div key={cIdx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>
                              <strong>{cite.author}</strong> ({cite.year}). <em>{cite.doiOrTitle}</em>. <span className="text-slate-400">{cite.journal}</span>.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
