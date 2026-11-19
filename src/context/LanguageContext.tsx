import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'fr' | 'en' | 'de' | 'es' | 'lu' | 'ar';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧', direction: 'ltr' },
  { code: 'de', label: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'es', label: 'Español', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'lu', label: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺', direction: 'ltr' },
  { code: 'ar', label: 'العربية', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
];

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  fr: {
    // Navigation
    nav_espace: 'Espace Perso',
    nav_care: 'Care & Savoir',
    nav_market: 'Boutiques & Dispensaires',
    nav_subscription: 'Abonnement',
    nav_cart: 'Panier',
    nav_login: 'Connexion',
    nav_logout: 'Déconnexion',
    nav_settings: 'Paramètres & RGPD',
    nav_onboarding: 'Refaire le Bilan Initial',
    nav_account: 'Mon Compte',
    nav_help_247: 'Écoute 24/7 : 0 800 23 13 13',

    // Sub tabs
    sub_overview: 'Tableau de bord',
    sub_journal: 'Journal de bord',
    sub_goals: 'Objectifs & Habitudes',
    sub_ai_coach: 'Assistant IA Écoute',
    sub_education: 'Grand Hub du Savoir',
    sub_catalog: 'Catalogue Boutiques',
    sub_orders: 'Mes Commandes',
    sub_receipts: 'Factures & Reçus',
    sub_loyalty: 'Fidélité & Récompenses',
    sub_marketing: 'Offres du Dispensaire',

    // Botanical Badges & Trust
    badge_botanical: 'Extraction Botanique Pure • COA HPLC Conforme < 0.3% THC',
    badge_security: 'Sanctuaire Chiffré de bout en bout • Zéro Traçage Tiers',
    badge_certified: 'Boutique Vérifiée',
    badge_lab_tested: 'Certifié Conforme UE',
    badge_free_shipping: 'Expédition soignée 24/48h',
    badge_safe_listening: 'Écoute anonyme et bienveillante',
    banner_flower_tag: 'Fleurs Ciselées à Froid & Trichomes Préservés',
    banner_flower_quote: 'Harmonie entre phytothérapie cannabique, terpènes vivants et clarté d’esprit.',

    // Dashboard
    dash_welcome_thc: 'Espace Clarté & Maîtrise THC',
    dash_welcome_cbd: 'Espace Équilibre & Bien-être CBD',
    dash_sub_thc: 'Suivez vos habitudes, observez vos déclencheurs et avancez à votre propre rythme sans aucun jugement.',
    dash_sub_cbd: 'Optimisez vos prises botaniques, suivez vos bénéfices bien-être et harmonisez vos rituels quotidiens.',
    dash_clarity_days: 'Jours de clarté & maîtrise',
    dash_savings_est: 'Économies estimées',
    dash_sessions_count: 'Séances enregistrées ce mois',
    dash_craving_level: 'Intensité moyenne de l’envie',
    dash_quick_entry: 'Enregistrer une séance',
    dash_emergency_craving: 'Envie pressante / Urgence SOS',
    dash_reduction_plan: 'Plan de Modération',
    dash_rediscover_habits: 'Habitudes alternatives',
    dash_triggers: 'Déclencheurs fréquents',
    dash_history_calendar: 'Calendrier & Séances',
    dash_stats_analysis: 'Analyses & Tendances',
    dash_helpline_text: 'Besoin d’un échange anonyme et chaleureux ?',

    // Education & Science
    edu_hero_title: 'Grand Hub du Savoir & Sciences Botaniques',
    edu_hero_sub: 'Sciences des phytocannabinoïdes, pharmacocinétique, réduction des risques et neurobiologie du système endocannabinoïde.',
    edu_search_placeholder: 'Rechercher un sujet, terpène, récepteur CB1, loi routière...',
    edu_filter_all: 'Tous les contenus',
    edu_filter_articles: 'Articles scientifiques',
    edu_filter_microlessons: 'Micro-leçons',
    edu_filter_exercises: 'Exercices pratiques',
    edu_filter_quizzes: 'Quiz de maîtrise',
    edu_filter_guides: 'Guides & Protocoles',
    edu_category_thc: 'Cannabis & THC',
    edu_category_cbd: 'CBD & Bien-être',
    edu_category_brain: 'Corps & Cerveau',
    edu_category_habits: 'Habitudes & Mental',
    edu_category_reduction: 'Modération & Arrêt',
    edu_category_wellness: 'Sommeil & Sérénité',
    edu_category_risks: 'Réduction des Risques',
    edu_mode_simple: 'En Clair & Analogies',
    edu_mode_expert: 'Mode Expert & Laboratoire',
    edu_read_time: 'min de lecture',
    edu_verified: 'Validé',
    edu_explore: 'Explorer',
    edu_disclaimer_title: 'Avertissement de Santé Publique & Neutralité Scientifique',
    edu_disclaimer_body: 'Contenu à visée exclusivement éducative, scientifique et de réduction des risques. Ne constitue en aucun cas un diagnostic ni une incitation à la consommation.',

    // AI Coach
    ai_hero_title: 'Assistant IA Écoute & Bien-être',
    ai_hero_sub: 'Accompagnement personnalisé et strictement confidentiel pour comprendre vos habitudes, apaiser vos envies et progresser à votre propre rythme.',
    ai_badge: 'IA Empathique • Sanctuaire Chiffré',
    ai_disclaimer: 'Accompagnement autonome non médical. Sans diagnostic ni prescription. En cas d’urgence : 112 ou Drogues Info Service (0 800 23 13 13).',
    ai_input_placeholder: 'Exprimez ce que vous ressentez en toute confiance...',
    ai_send: 'Envoyer',
    ai_suggest_1: 'Comment apaiser une envie soudaine ?',
    ai_suggest_2: 'Des rituels naturels pour favoriser le sommeil ?',
    ai_suggest_3: 'Exercices de cohérence cardiaque et respiration',
    ai_suggest_4: 'Comprendre la tolérance aux récepteurs CB1',

    // Market & Dispensary
    market_hero_title: 'Dispensaires d’Excellence & Extraits Botaniques',
    market_hero_sub: 'Herboristeries certifiées, huiles riches en terpènes, fleurs ciselées affinées et soins phytothérapiques traçables avec certificats HPLC par lot.',
    market_filter_all: 'Tous les Extraits',
    market_filter_oils: 'Huiles & Gouttes',
    market_filter_flowers: 'Fleurs Ciselées',
    market_filter_teas: 'Infusions & Thés',
    market_filter_wellness: 'Soins Botaniques',
    market_add_cart: 'Ajouter au Panier',
    market_view_shop: 'Visiter la Boutique',
    market_fast_ship: 'Expédition en 24h par le marchand',
    market_thc_compliant: 'THC < 0.3% Garanti',
    market_rating: '4.9/5 • Avis Clients Vérifiés',

    // Journal
    journal_title: 'Journal de Bord & Écoute de Soi',
    journal_sub: 'Consignez vos ressentis, observez vos déclencheurs et explorez vos rythmes quotidiens en toute bienveillance.',
    journal_new_entry: 'Nouvelle entrée',
    journal_filter_all: 'Toutes les entrées',
    journal_filter_thc: 'Séances THC',
    journal_filter_cbd: 'Prises CBD',

    // Goals
    goals_title: 'Objectifs Personnalisés & Habitudes',
    goals_sub: 'Définissez vos repères de consommation, consolidez vos rituels positifs et célébrez chaque étape franchie.',
    goals_new: 'Nouvel objectif',

    // Footer
    footer_compliance: 'Conformité Européenne & Sanctuaire RGPD',
    footer_rights: 'Tous droits réservés. CANNABIS CARE • Plateforme d’accompagnement et réseau de boutiques certifiées.',
    footer_helpline: 'Écoute anonyme & gratuite 7j/7 : 0 800 23 13 13',
    footer_emergency: 'Urgences médicales européennes : 112',
  },

  en: {
    // Navigation
    nav_espace: 'My Space',
    nav_care: 'Care & Knowledge',
    nav_market: 'Dispensary & Boutiques',
    nav_subscription: 'Membership',
    nav_cart: 'Cart',
    nav_login: 'Sign In',
    nav_logout: 'Log Out',
    nav_settings: 'Settings & Privacy',
    nav_onboarding: 'Retake Initial Assessment',
    nav_account: 'My Account',
    nav_help_247: '24/7 Helpline: 112 / Support',

    // Sub tabs
    sub_overview: 'Dashboard',
    sub_journal: 'Daily Journal',
    sub_goals: 'Goals & Habits',
    sub_ai_coach: 'Mindful AI Companion',
    sub_education: 'Grand Knowledge Hub',
    sub_catalog: 'Curated Dispensary',
    sub_orders: 'My Orders',
    sub_receipts: 'Invoices & Receipts',
    sub_loyalty: 'Loyalty & Rewards',
    sub_marketing: 'Dispensary Specials',

    // Botanical Badges & Trust
    badge_botanical: 'Pure Botanical Extraction • HPLC Lab Tested < 0.3% THC',
    badge_security: 'End-to-End Encrypted Sanctuary • Zero 3rd-Party Tracking',
    badge_certified: 'Verified Dispensary',
    badge_lab_tested: 'EU Legal & Certified',
    badge_free_shipping: 'Discreet 24/48h Shipping',
    badge_safe_listening: 'Confidential empathetic support',
    banner_flower_tag: 'Cold-Cured Flowers & Preserved Trichomes',
    banner_flower_quote: 'Harmonizing cannabinoid phytotherapy, live terpenes, and mental clarity.',

    // Dashboard
    dash_welcome_thc: 'THC Clarity & Mindful Control Space',
    dash_welcome_cbd: 'CBD Balance & Herbal Wellness Space',
    dash_sub_thc: 'Track your habits, understand your emotional triggers, and progress at your own comfortable pace without judgment.',
    dash_sub_cbd: 'Optimize your botanical intake, monitor therapeutic benefits, and harmonize daily wellness rituals.',
    dash_clarity_days: 'Clarity & Control Days',
    dash_savings_est: 'Estimated Savings',
    dash_sessions_count: 'Logged Sessions This Month',
    dash_craving_level: 'Average Craving Intensity',
    dash_quick_entry: 'Log a Session',
    dash_emergency_craving: 'Craving SOS / Urgent Help',
    dash_reduction_plan: 'Moderation Plan',
    dash_rediscover_habits: 'Alternative Habits',
    dash_triggers: 'Frequent Triggers',
    dash_history_calendar: 'Calendar & Sessions',
    dash_stats_analysis: 'Analytics & Trends',
    dash_helpline_text: 'Need warm, confidential support right now?',

    // Education & Science
    edu_hero_title: 'Grand Knowledge Hub & Botanical Sciences',
    edu_hero_sub: 'Cannabinoid science, pharmacokinetics, harm reduction protocols, and endocannabinoid neurobiology.',
    edu_search_placeholder: 'Search topics, terpenes, CB1 receptors, road safety laws...',
    edu_filter_all: 'All Content',
    edu_filter_articles: 'Scientific Articles',
    edu_filter_microlessons: 'Micro-lessons',
    edu_filter_exercises: 'Practical Exercises',
    edu_filter_quizzes: 'Mastery Quizzes',
    edu_filter_guides: 'Guides & Protocols',
    edu_category_thc: 'Cannabis & THC',
    edu_category_cbd: 'CBD & Wellness',
    edu_category_brain: 'Body & Brain',
    edu_category_habits: 'Habits & Mindset',
    edu_category_reduction: 'Moderation & Tapering',
    edu_category_wellness: 'Sleep & Serenity',
    edu_category_risks: 'Harm Reduction',
    edu_mode_simple: 'Plain Terms & Analogies',
    edu_mode_expert: 'Expert & Lab Mode',
    edu_read_time: 'min read',
    edu_verified: 'Completed',
    edu_explore: 'Explore',
    edu_disclaimer_title: 'Public Health & Scientific Neutrality Disclaimer',
    edu_disclaimer_body: 'This content is solely educational, scientific, and harm-reduction focused. It does not constitute medical diagnosis, prescription, or an invitation to consume.',

    // AI Coach
    ai_hero_title: 'Mindful AI Companion & Well-being',
    ai_hero_sub: 'Personalized, confidential guidance to understand habits, soothe cravings, and progress at your own comfortable pace.',
    ai_badge: 'Empathetic AI • Encrypted Sanctuary',
    ai_disclaimer: 'Autonomous behavioral support without medical diagnosis or prescription. In emergency call 112 or local hotline.',
    ai_input_placeholder: 'Share how you are feeling in complete confidence...',
    ai_send: 'Send',
    ai_suggest_1: 'How do I soothe an unexpected craving?',
    ai_suggest_2: 'Natural evening rituals for better sleep?',
    ai_suggest_3: 'Cardiac coherence and deep breathing exercises',
    ai_suggest_4: 'Understanding CB1 receptor tolerance and breaks',

    // Market & Dispensary
    market_hero_title: 'Premier Cannabis Dispensary & Botanical Extracts',
    market_hero_sub: 'Artisanal verified dispensaries, terpene-rich cold-pressed oils, cured frosty flowers, and lab-tested herbal wellness formulas.',
    market_filter_all: 'All Extracts',
    market_filter_oils: 'Sublingual Oils',
    market_filter_flowers: 'Cured Flowers',
    market_filter_teas: 'Herbal Infusions',
    market_filter_wellness: 'Botanical Topicals',
    market_add_cart: 'Add to Cart',
    market_view_shop: 'Visit Boutique',
    market_fast_ship: 'Ships within 24h by merchant',
    market_thc_compliant: 'Guaranteed THC < 0.3%',
    market_rating: '4.9/5 • Verified Customer Reviews',

    // Journal
    journal_title: 'Daily Journal & Mindful Awareness',
    journal_sub: 'Record emotional feelings, discover behavioral triggers, and nurture daily self-awareness.',
    journal_new_entry: 'New Entry',
    journal_filter_all: 'All Entries',
    journal_filter_thc: 'THC Sessions',
    journal_filter_cbd: 'CBD Intakes',

    // Goals
    goals_title: 'Personalized Goals & Habits',
    goals_sub: 'Set intentional benchmarks, solidify positive routines, and celebrate every conscious step forward.',
    goals_new: 'New Goal',

    // Footer
    footer_compliance: 'EU Regulatory Compliance & Privacy Sanctuary',
    footer_rights: 'All rights reserved. CANNABIS CARE • Guidance platform & certified dispensary network.',
    footer_helpline: 'Toll-free confidential support 24/7: 112 / Helpline',
    footer_emergency: 'European Medical Emergency: 112',
  },

  de: {
    // Navigation
    nav_espace: 'Mein Bereich',
    nav_care: 'Care & Wissen',
    nav_market: 'Dispensary & Botanik',
    nav_subscription: 'Mitgliedschaft',
    nav_cart: 'Warenkorb',
    nav_login: 'Anmelden',
    nav_logout: 'Abmelden',
    nav_settings: 'Einstellungen & DSGVO',
    nav_onboarding: 'Erstbewertung wiederholen',
    nav_account: 'Mein Konto',
    nav_help_247: '24/7 Beratung: 112',

    // Sub tabs
    sub_overview: 'Dashboard',
    sub_journal: 'Tagebuch',
    sub_goals: 'Ziele & Routinen',
    sub_ai_coach: 'KI-Achtsamkeitsbegleiter',
    sub_education: 'Wissens-Hub & Forschung',
    sub_catalog: 'Dispensary-Katalog',
    sub_orders: 'Meine Bestellungen',
    sub_receipts: 'Rechnungen & Belege',
    sub_loyalty: 'Treuepunkte & Prämien',
    sub_marketing: 'Angebote der Dispensary',

    // Botanical Badges & Trust
    badge_botanical: 'Reine botanische Extraktion • HPLC Laborgeprüft < 0.3% THC',
    badge_security: 'Ende-zu-Ende verschlüsselter Zufluchtsort • DSGVO-konform',
    badge_certified: 'Zertifizierte Fachapotheke',
    badge_lab_tested: 'EU-Verkehrsfähig & Zertifiziert',
    badge_free_shipping: 'Diskreter Versand in 24-48h',
    badge_safe_listening: 'Vertrauliche empathische Unterstützung',
    banner_flower_tag: 'Kaltfermentierte Blüten & Geschützte Trichome',
    banner_flower_quote: 'Harmonie aus Phytocannabinoiden, Terpen-Aromen und geistiger Klarheit.',

    // Dashboard
    dash_welcome_thc: 'THC Klarheit & Achtsamkeitsbereich',
    dash_welcome_cbd: 'CBD Ausgeglichenheit & Wohlbefinden',
    dash_sub_thc: 'Verfolgen Sie Ihre Gewohnheiten, verstehen Sie emotionale Auslöser und machen Sie Fortschritte in Ihrem Tempo.',
    dash_sub_cbd: 'Optimieren Sie Ihre pflanzliche Anwendung und harmonisieren Sie Ihre täglichen Wohlfühlrituale.',
    dash_clarity_days: 'Tage der Klarheit & Kontrolle',
    dash_savings_est: 'Geschätzte Ersparnis',
    dash_sessions_count: 'Erfasste Einheiten diesen Monat',
    dash_craving_level: 'Durchschnittliches Verlangen',
    dash_quick_entry: 'Einheit erfassen',
    dash_emergency_craving: 'Akutes Verlangen / Notfall-SOS',
    dash_reduction_plan: 'Mäßigungsplan',
    dash_rediscover_habits: 'Alternative Routinen',
    dash_triggers: 'Häufige Auslöser',
    dash_history_calendar: 'Kalender & Verlauf',
    dash_stats_analysis: 'Analysen & Trends',
    dash_helpline_text: 'Benötigen Sie vertrauliche, einfühlsame Unterstützung?',

    // Education & Science
    edu_hero_title: 'Großer Wissens-Hub & Botanische Wissenschaften',
    edu_hero_sub: 'Cannabinoid-Wissenschaft, Pharmakokinetik, Schadensminderung und Endocannabinoid-Neurobiologie.',
    edu_search_placeholder: 'Thema, Terpene, CB1-Rezeptoren oder Straßenverkehrsrecht suchen...',
    edu_filter_all: 'Alle Inhalte',
    edu_filter_articles: 'Wissenschaftliche Artikel',
    edu_filter_microlessons: 'Mikrolektionen',
    edu_filter_exercises: 'Praktische Übungen',
    edu_filter_quizzes: 'Wissens-Quiz',
    edu_filter_guides: 'Leitfäden & Protokolle',
    edu_category_thc: 'Cannabis & THC',
    edu_category_cbd: 'CBD & Wohlbefinden',
    edu_category_brain: 'Körper & Gehirn',
    edu_category_habits: 'Gewohnheiten & Psyche',
    edu_category_reduction: 'Mäßigung & Ausstieg',
    edu_category_wellness: 'Schlaf & Gelassenheit',
    edu_category_risks: 'Schadensminderung',
    edu_mode_simple: 'Einfach & Vergleiche',
    edu_mode_expert: 'Experten- & Labormodus',
    edu_read_time: 'Min. Lesezeit',
    edu_verified: 'Abgeschlossen',
    edu_explore: 'Erkunden',
    edu_disclaimer_title: 'Gesundheits- & Wissenschaftshinweis',
    edu_disclaimer_body: 'Inhalte dienen ausschließlich Aufklärungs- und Schadensminderungszwecken. Keine ärztliche Diagnose oder Konsumaufforderung.',

    // AI Coach
    ai_hero_title: 'KI-Begleiter für Wohlbefinden & Achtsamkeit',
    ai_hero_sub: 'Persönliche und vertrauliche Unterstützung, um Gewohnheiten zu verstehen und im eigenen Tempo voranzukommen.',
    ai_badge: 'Empathische KI • Verschlüsselter Raum',
    ai_disclaimer: 'Autonome, nicht-medizinische Begleitung. Im Notfall wählen Sie bitte die 112.',
    ai_input_placeholder: 'Teilen Sie vertraulich mit, was Sie beschäftigt...',
    ai_send: 'Senden',
    ai_suggest_1: 'Wie lindere ich plötzliches Verlangen?',
    ai_suggest_2: 'Natürliche Abendrituale für besseren Schlaf?',
    ai_suggest_3: 'Übungen zur Herzkohärenz und Atmung',
    ai_suggest_4: 'Toleranzentwicklung an CB1-Rezeptoren verstehen',

    // Market & Dispensary
    market_hero_title: 'Exzellente Cannabis-Apotheken & Botanische Extrakte',
    market_hero_sub: 'Zertifizierte Fachgeschäfte, terpenreiche Vollspektrum-Öle, handverlesene Blüten und geprüfte Phytotherapeutika.',
    market_filter_all: 'Alle Extrakte',
    market_filter_oils: 'Öle & Tropfen',
    market_filter_flowers: 'Edle Blüten',
    market_filter_teas: 'Tees & Kräuter',
    market_filter_wellness: 'Pflege & Salben',
    market_add_cart: 'In den Warenkorb',
    market_view_shop: 'Shop besuchen',
    market_fast_ship: 'Versand innerhalb 24h durch den Händler',
    market_thc_compliant: 'THC < 0.3% Garantiert',
    market_rating: '4.9/5 • Geprüfte Kundenbewertungen',

    // Journal
    journal_title: 'Tagebuch & Achtsamkeit',
    journal_sub: 'Halten Sie Gefühle fest und entdecken Sie Verhaltensmuster in einer geschützten Umgebung.',
    journal_new_entry: 'Neuer Eintrag',
    journal_filter_all: 'Alle Einträge',
    journal_filter_thc: 'THC Einheiten',
    journal_filter_cbd: 'CBD Einnahmen',

    // Goals
    goals_title: 'Persönliche Ziele & Gewohnheiten',
    goals_sub: 'Definieren Sie bewusste Leitlinien und festigen Sie positive Routinen.',
    goals_new: 'Neues Ziel',

    // Footer
    footer_compliance: 'EU-Konformität & Datenschutz-Sanctuary',
    footer_rights: 'Alle Rechte vorbehalten. CANNABIS CARE • Begleitplattform & zertifiziertes Netzwerk.',
    footer_helpline: 'Kostenlose vertrauliche Hilfe: 112 / Telefonseelsorge',
    footer_emergency: 'Europäischer Notruf: 112',
  },

  es: {
    // Navigation
    nav_espace: 'Mi Espacio',
    nav_care: 'Care & Saber',
    nav_market: 'Dispensarios & Tiendas',
    nav_subscription: 'Suscripción',
    nav_cart: 'Cesta',
    nav_login: 'Iniciar Sesión',
    nav_logout: 'Cerrar Sesión',
    nav_settings: 'Ajustes & Privacidad',
    nav_onboarding: 'Rehacer Evaluación Inicial',
    nav_account: 'Mi Cuenta',
    nav_help_247: 'Ayuda 24/7: 112',

    // Sub tabs
    sub_overview: 'Panel de Control',
    sub_journal: 'Diario de Hábitos',
    sub_goals: 'Objetivos & Progreso',
    sub_ai_coach: 'Acompañante IA',
    sub_education: 'Gran Hub del Saber',
    sub_catalog: 'Catálogo de Tiendas',
    sub_orders: 'Mis Pedidos',
    sub_receipts: 'Facturas & Recibos',
    sub_loyalty: 'Puntos & Recompensas',
    sub_marketing: 'Promociones del Dispensario',

    // Botanical Badges & Trust
    badge_botanical: 'Extracción Botánica Pura • Certificado HPLC < 0.3% THC',
    badge_security: 'Santuario Encriptado de Extremo a Extremo • Privacidad Total',
    badge_certified: 'Dispensario Certificado',
    badge_lab_tested: 'Conformidad Europea & Calidad',
    badge_free_shipping: 'Envío discreto en 24-48h',
    badge_safe_listening: 'Escucha empática y confidencial',
    banner_flower_tag: 'Flores Curadas en Frío & Tricomas Preservados',
    banner_flower_quote: 'Armonía entre fitoterapia cannábica, terpenos vivos y claridad mental.',

    // Dashboard
    dash_welcome_thc: 'Espacio de Claridad y Control THC',
    dash_welcome_cbd: 'Espacio de Equilibrio y Bienestar CBD',
    dash_sub_thc: 'Observa tus hábitos, comprende tus detonantes emocionales y avanza a tu propio ritmo sin juicios.',
    dash_sub_cbd: 'Optimiza tus tomas botánicas y armoniza tus rituales diarios de bienestar.',
    dash_clarity_days: 'Días de claridad y control',
    dash_savings_est: 'Ahorro estimado',
    dash_sessions_count: 'Sesiones este mes',
    dash_craving_level: 'Intensidad media del deseo',
    dash_quick_entry: 'Registrar sesión',
    dash_emergency_craving: 'Deseo intenso / Urgencia SOS',
    dash_reduction_plan: 'Plan de Moderación',
    dash_rediscover_habits: 'Hábitos alternativos',
    dash_triggers: 'Detonantes frecuentes',
    dash_history_calendar: 'Calendario & Historial',
    dash_stats_analysis: 'Análisis & Tendencias',
    dash_helpline_text: '¿Necesitas apoyo anónimo y cercano ahora mismo?',

    // Education & Science
    edu_hero_title: 'Gran Hub del Saber & Ciencias Botánicas',
    edu_hero_sub: 'Ciencia de fitocannabinoides, farmacocinética, reducción de riesgos y neurobiología endocannabinoide.',
    edu_search_placeholder: 'Buscar temas, terpenos, receptores CB1, seguridad vial...',
    edu_filter_all: 'Todos los contenidos',
    edu_filter_articles: 'Artículos científicos',
    edu_filter_microlessons: 'Micro-lecciones',
    edu_filter_exercises: 'Ejercicios prácticos',
    edu_filter_quizzes: 'Cuestionarios',
    edu_filter_guides: 'Guías & Protocolos',
    edu_category_thc: 'Cannabis & THC',
    edu_category_cbd: 'CBD & Bienestar',
    edu_category_brain: 'Cuerpo & Cerebro',
    edu_category_habits: 'Hábitos & Mente',
    edu_category_reduction: 'Moderación & Cese',
    edu_category_wellness: 'Sueño & Calma',
    edu_category_risks: 'Reducción de Riesgos',
    edu_mode_simple: 'Términos Claros & Analogías',
    edu_mode_expert: 'Modo Experto & Laboratorio',
    edu_read_time: 'min de lectura',
    edu_verified: 'Completado',
    edu_explore: 'Explorar',
    edu_disclaimer_title: 'Aviso de Salud Pública y Neutralidad Científica',
    edu_disclaimer_body: 'Contenido con fines estrictamente educativos y de reducción de daños. No constituye diagnóstico médico ni incitación al consumo.',

    // AI Coach
    ai_hero_title: 'Asistente IA para el Bienestar y la Escucha',
    ai_hero_sub: 'Orientación personalizada y confidencial para comprender hábitos y calmar impulsos a tu propio ritmo.',
    ai_badge: 'IA Empática • Santuario Encriptado',
    ai_disclaimer: 'Acompañamiento autónomo no médico. En caso de emergencia llame al 112.',
    ai_input_placeholder: 'Comparte cómo te sientes con total confianza...',
    ai_send: 'Enviar',
    ai_suggest_1: '¿Cómo calmar un impulso imprevisto?',
    ai_suggest_2: '¿Rituales nocturnos para descansar mejor?',
    ai_suggest_3: 'Ejercicios de coherencia cardíaca y respiración',
    ai_suggest_4: 'Comprender la tolerancia en receptores CB1',

    // Market & Dispensary
    market_hero_title: 'Dispensarios de Excelencia & Extractos Botánicos',
    market_hero_sub: 'Herbolarios certificados, aceites ricos en terpenos, flores selectas y fórmulas fitoterapéuticas con trazabilidad por lote.',
    market_filter_all: 'Todos los Extractos',
    market_filter_oils: 'Aceites & Gotas',
    market_filter_flowers: 'Flores Selectas',
    market_filter_teas: 'Infusiones & Tés',
    market_filter_wellness: 'Cuidado Botánico',
    market_add_cart: 'Añadir a la Cesta',
    market_view_shop: 'Ver Tienda',
    market_fast_ship: 'Envío en 24h por el comerciante',
    market_thc_compliant: 'THC < 0.3% Garantizado',
    market_rating: '4.9/5 • Opiniones Verificadas',

    // Journal
    journal_title: 'Diario de Hábitos & Autoconocimiento',
    journal_sub: 'Registra tus sensaciones y descubre tus patrones en un entorno seguro y libre de juicios.',
    journal_new_entry: 'Nueva entrada',
    journal_filter_all: 'Todas las entradas',
    journal_filter_thc: 'Sesiones THC',
    journal_filter_cbd: 'Tomas CBD',

    // Goals
    goals_title: 'Objetivos Personalizados & Hábitos',
    goals_sub: 'Establece pautas conscientes, consolida rutinas positivas y celebra cada paso.',
    goals_new: 'Nuevo Objetivo',

    // Footer
    footer_compliance: 'Conformidad Europea & Santuario RGPD',
    footer_rights: 'Todos los derechos reservados. CANNABIS CARE • Plataforma de bienestar y red de tiendas certificadas.',
    footer_helpline: 'Línea de ayuda anónima y gratuita: 112',
    footer_emergency: 'Emergencias Médicas Europeas: 112',
  },

  lu: {
    // Navigation
    nav_espace: 'Meng Säit',
    nav_care: 'Care & Wëssen',
    nav_market: 'Cannabis Boutiquen',
    nav_subscription: 'Abonnement',
    nav_cart: 'Kuerf',
    nav_login: 'Umelden',
    nav_logout: 'Ofmellen',
    nav_settings: 'Astellungen & Dateschutz',
    nav_onboarding: 'Ufanksbilan widderhuelen',
    nav_account: 'Mäi Kont',
    nav_help_247: 'Hëllef 24/7: 112',

    // Sub tabs
    sub_overview: 'Iwwersiicht',
    sub_journal: 'Deeglecht Journal',
    sub_goals: 'Ziler & Gewunnechten',
    sub_ai_coach: 'KI Begleeder',
    sub_education: 'Wëssenschafts-Hub',
    sub_catalog: 'Boutique Katalog',
    sub_orders: 'Meng Commanden',
    sub_receipts: 'Rechnungen',
    sub_loyalty: 'Loyalitéit & Punkten',
    sub_marketing: 'Offere vum Dispensaire',

    // Botanical Badges & Trust
    badge_botanical: 'Reng Botanescht Extrakt • HPLC Laboratoire gepréift < 0.3% THC',
    badge_security: 'Vollstänneg Verschlësselt • Keng Drëtt-Partei Daten',
    badge_certified: 'Zertifizéiert Boutique',
    badge_lab_tested: 'EU Konform & Labo-Analyséiert',
    badge_free_shipping: 'Diskret Liwwerung a 24-48 Stonnen',
    badge_safe_listening: 'Vertraulech an empathesch Ënnerstëtzung',
    banner_flower_tag: 'Kalt gedréchent Blummen & Geschützte Trichomen',
    banner_flower_quote: 'Harmonie tëscht Botanescher Phytotherapie an mentaler Kloerheet.',

    // Dashboard
    dash_welcome_thc: 'Kloerheet & THC Begleedung',
    dash_welcome_cbd: 'Gläichgewiicht & CBD Wuelbefannen',
    dash_sub_thc: 'Verfollegt Är Gewunnechten an Ärem eegene Rhythmus ouni Uerteel.',
    dash_sub_cbd: 'Optiméiert Är botanescht Uwendungen an alldeeglech Ritualer.',
    dash_clarity_days: 'Deeg vu Kloerheet',
    dash_savings_est: 'Geschate Spueren',
    dash_sessions_count: 'Sessiounen dëse Mount',
    dash_craving_level: 'Duerchschnëttlecht Verlaangen',
    dash_quick_entry: 'Sessioun notéieren',
    dash_emergency_craving: 'Akutt Verlaangen / Noutfall',
    dash_reduction_plan: 'Moderatiounsplang',
    dash_rediscover_habits: 'Alternativ Routinnen',
    dash_triggers: 'Heefeg Ausléiser',
    dash_history_calendar: 'Kalenner & Verlaf',
    dash_stats_analysis: 'Analysen & Trends',
    dash_helpline_text: 'Braucht Dir elo vertraulech Hëllef?',

    // Education & Science
    edu_hero_title: 'Wëssenschafts-Hub & Botanescht Wëssen',
    edu_hero_sub: 'Wëssenschaft iwwer Cannabinoiden, Pharmakokinetik an Schuedreduktioun.',
    edu_search_placeholder: 'Themen, Terpenen, CB1 Rezeptoren sichen...',
    edu_filter_all: 'All Inhalter',
    edu_filter_articles: 'Wëssenschaftlech Artikelen',
    edu_filter_microlessons: 'Mikro-Lektiounen',
    edu_filter_exercises: 'Praktesch Übungen',
    edu_filter_quizzes: 'Wëssens-Quiz',
    edu_filter_guides: 'Guiden & Protokoller',
    edu_category_thc: 'Cannabis & THC',
    edu_category_cbd: 'CBD & Wuelbefannen',
    edu_category_brain: 'Kierper & Gehir',
    edu_category_habits: 'Gewunnechten & Mental',
    edu_category_reduction: 'Moderatioun & Stopp',
    edu_category_wellness: 'Schlof & Rou',
    edu_category_risks: 'Schuedreduktioun',
    edu_mode_simple: 'Einfach Ausgedréckt',
    edu_mode_expert: 'Expert & Laboratoire',
    edu_read_time: 'Min. Lieszäit',
    edu_verified: 'Ofgeschloss',
    edu_explore: 'Entdecken',
    edu_disclaimer_title: 'Gesondheets- a Wëssenschaftshiweis',
    edu_disclaimer_body: 'Inhalter déngen nëmmen zu Educatiouns- a Risikoreduktiounszwecker.',

    // AI Coach
    ai_hero_title: 'KI Begleeder fir Wuelbefannen',
    ai_hero_sub: 'Perséinlech a vertraulech Ënnerstëtzung fir am eegene Rhythmus virunzekommen.',
    ai_badge: 'Empathesch KI • Séchere Raum',
    ai_disclaimer: 'Net-medezinesch Begleedung. Am Noutfall: 112.',
    ai_input_placeholder: 'Deelt vertraulech mat wat Iech beschäftegt...',
    ai_send: 'Schécken',
    ai_suggest_1: 'Wéi berouegen ech e Verlaangen?',
    ai_suggest_2: 'Natierlech Owesritualer fir Schlof?',
    ai_suggest_3: 'Häerzkohärenz an Otemübungen',
    ai_suggest_4: 'Toleranz op CB1 Rezeptoren verstoen',

    // Market & Dispensary
    market_hero_title: 'Premium Cannabis Boutiquen & Botanescht Wuelbefannen',
    market_hero_sub: 'Zertifizéiert Herboristerien, Terpen-räich Ueleger a ciseléiert Blummen.',
    market_filter_all: 'All Produkter',
    market_filter_oils: 'Ueleger & Drëpsen',
    market_filter_flowers: 'Ciseléiert Blummen',
    market_filter_teas: 'Téi & Infusiounen',
    market_filter_wellness: 'Pfleeg & Kosmetik',
    market_add_cart: 'An de Kuerf leeën',
    market_view_shop: 'Boutique besichen',
    market_fast_ship: 'Versand an 24h vum Händler',
    market_thc_compliant: 'Garantéiert THC < 0.3%',
    market_rating: '4.9/5 • Verifizéiert Clienten-Avisen',

    // Journal
    journal_title: 'Journal de Bord & Selbstobservatioun',
    journal_sub: 'Notéiert Gefiller a Mustere vertraulech an ouni Uerteel.',
    journal_new_entry: 'Neien Aschreiwung',
    journal_filter_all: 'All Aschreiwungen',
    journal_filter_thc: 'THC Sessiounen',
    journal_filter_cbd: 'CBD Dosen',

    // Goals
    goals_title: 'Perséinlech Ziler & Gewunnechten',
    goals_sub: 'Definéiert bewosst Ziler a feiert all Schrëtt.',
    goals_new: 'Neit Zil',

    // Footer
    footer_compliance: 'Europäesch Konformitéit & Dateschutz',
    footer_rights: 'All Rechter reservéiert. CANNABIS CARE Plattform.',
    footer_helpline: 'Gratis an anonym Hëllef: 112',
    footer_emergency: 'Europäeschen Noutruff: 112',
  },

  ar: {
    // Navigation
    nav_espace: 'مساحتي الشخصية',
    nav_care: 'الرعاية والمعرفة',
    nav_market: 'المتاجر والمستخلصات',
    nav_subscription: 'الاشتراك',
    nav_cart: 'سلة المشتريات',
    nav_login: 'تسجيل الدخول',
    nav_logout: 'تسجيل الخروج',
    nav_settings: 'الإعدادات والخصوصية',
    nav_onboarding: 'إعادة التقييم الأولي',
    nav_account: 'حسابي',
    nav_help_247: 'خط المساعدة 24/7: 112',

    // Sub tabs
    sub_overview: 'لوحة القيادة',
    sub_journal: 'سجل المتابعة اليومي',
    sub_goals: 'الأهداف والعادات',
    sub_ai_coach: 'المساعد الذكي للاستماع',
    sub_education: 'مركز المعرفة والعلوم',
    sub_catalog: 'دليل المتاجر المعتمدة',
    sub_orders: 'طلباتي',
    sub_receipts: 'الفواتير والإيصالات',
    sub_loyalty: 'نقاط الولاء والمكافآت',
    sub_marketing: 'عروض المتاجر',

    // Botanical Badges & Trust
    badge_botanical: 'استخلاص نباتي نقي • فحص HPLC معتمد < 0.3% THC',
    badge_security: 'ملاذ مشفر بالكامل • خصوصية مطلقة دون تتبع',
    badge_certified: 'متجر معتمد وموثق',
    badge_lab_tested: 'مطابق للمعايير الأوروبية',
    badge_free_shipping: 'شحن سريع ومحكم 24-48 ساعة',
    badge_safe_listening: 'دعم متعاطف وسري للغاية',
    banner_flower_tag: 'أزهار معالجة بعناية وشعيرات بلورية محفوظة',
    banner_flower_quote: 'انسجام تام بين العلاج النباتي، التربينات الحية والصفاء الذهني.',

    // Dashboard
    dash_welcome_thc: 'مساحة الصفاء والتحكم في استهلاك THC',
    dash_welcome_cbd: 'مساحة التوازن والعافية مع CBD',
    dash_sub_thc: 'تتبع عاداتك واكتشف محفزاتك النفسية وتقدم بخطى واثقة دون أي حكم مسبق.',
    dash_sub_cbd: 'حسن جرعاتك النباتية، راقب فوائد العافية وانسجم مع روتينك اليومي.',
    dash_clarity_days: 'أيام الصفاء والتحكم',
    dash_savings_est: 'التوفير المالي التقديري',
    dash_sessions_count: 'الجلسات المسجلة هذا الشهر',
    dash_craving_level: 'متوسط شدة الرغبة الملحة',
    dash_quick_entry: 'تسجيل جلسة جديدة',
    dash_emergency_craving: 'رغبة ملحة طارئة / دعم فوري',
    dash_reduction_plan: 'خطة تقليل الاستهلاك',
    dash_rediscover_habits: 'عادات وروتينات بديلة',
    dash_triggers: 'المحفزات الشائعة',
    dash_history_calendar: 'التقويم وسجل الجلسات',
    dash_stats_analysis: 'التحليلات والمؤشرات',
    dash_helpline_text: 'هل تحتاج إلى محادثة سرية وداعمة الآن؟',

    // Education & Science
    edu_hero_title: 'مركز المعرفة الكبرى والعلوم النباتية',
    edu_hero_sub: 'علوم الكانابينويد، الحركية الدوائية، بروتوكولات تقليل المخاطر والبيولوجيا العصبية لجهاز الإندوكانابينويد.',
    edu_search_placeholder: 'ابحث عن موضوع، تربين، مستقبلات CB1، قوانين المرور...',
    edu_filter_all: 'كافة المحتويات',
    edu_filter_articles: 'مقالات علمية',
    edu_filter_microlessons: 'دروس مصغرة',
    edu_filter_exercises: 'تمارين تطبيقية',
    edu_filter_quizzes: 'اختبارات المعرفة',
    edu_filter_guides: 'أدلة وبروتوكولات',
    edu_category_thc: 'القنب و THC',
    edu_category_cbd: 'CBD والعافية',
    edu_category_brain: 'الجسد والدماغ',
    edu_category_habits: 'العادات والصحة النفسية',
    edu_category_reduction: 'الاعتدال والإقلاع',
    edu_category_wellness: 'النوم والسكينة',
    edu_category_risks: 'تقليل المخاطر',
    edu_mode_simple: 'شرح مبسط وأمثلة',
    edu_mode_expert: 'وضع الخبراء والمختبر',
    edu_read_time: 'دقيقة قراءة',
    edu_verified: 'تم إنجازه',
    edu_explore: 'استكشاف',
    edu_disclaimer_title: 'تنبيه الصحة العامة والحياد العلمي',
    edu_disclaimer_body: 'المحتوى لأغراض تعليمية وعلمية وتقليل المخاطر حصراً. لا يعتبر تشخيصاً طبياً ولا دعوة للاستهلاك.',

    // AI Coach
    ai_hero_title: 'مساعد الذكاء الاصطناعي للاستماع والعافية',
    ai_hero_sub: 'مرافقة شخصية وسرية تماماً لفهم عاداتك، تهدئة رغباتك الملحة والتقدم براحة بال.',
    ai_badge: 'ذكاء اصطناعي متعاطف • ملاذ مشفر',
    ai_disclaimer: 'دعم سلوكي ذاتي غير طبي. في حالات الطوارئ اتصل بالرقم 112.',
    ai_input_placeholder: 'شارك مشاعرك وتجاربك بكل أمان وثقة...',
    ai_send: 'إرسال',
    ai_suggest_1: 'كيف أهدئ رغبة ملحة ومفاجئة؟',
    ai_suggest_2: 'طقوس مسائية طبيعية لنوم أفضل؟',
    ai_suggest_3: 'تمارين التنفس والاتساق القلبي',
    ai_suggest_4: 'فهم التسامح الدوائي لمستقبلات CB1',

    // Market & Dispensary
    market_hero_title: 'مستخلصات نباتية راقية ومتاجر معتمدة',
    market_hero_sub: 'أعشاب معتمدة، زيوت غنية بالتربينات، أزهار معالجة ومستحضرات نباتية موثقة بتقارير HPLC مخبرية.',
    market_filter_all: 'كافة المستخلصات',
    market_filter_oils: 'زيوت وقطرات',
    market_filter_flowers: 'أزهار منتقاة',
    market_filter_teas: 'مشروبات وأعشاب',
    market_filter_wellness: 'عناية نباتية',
    market_add_cart: 'أضف إلى السلة',
    market_view_shop: 'زيارة المتجر',
    market_fast_ship: 'شحن سريع خلال 24 ساعة',
    market_thc_compliant: 'محتوى THC < 0.3% مضمون',
    market_rating: '4.9/5 • تقييمات عملاء معتمدة',

    // Journal
    journal_title: 'سجل المتابعة اليومي والوعي الذاتي',
    journal_sub: 'دون مشاعرك واكتشف محفزاتك السلوكية في بيئة آمنة وخالية من الأحكام.',
    journal_new_entry: 'تسجيل جديد',
    journal_filter_all: 'كافة التسجيلات',
    journal_filter_thc: 'جلسات THC',
    journal_filter_cbd: 'جرعات CBD',

    // Goals
    goals_title: 'الأهداف الشخصية والعادات الإيجابية',
    goals_sub: 'حدد معالمك بوعي، ثبت روتينك الإيجابي واحتفل بكل خطوة تخطوها.',
    goals_new: 'هدف جديد',

    // Footer
    footer_compliance: 'الامتثال للمعايير الأوروبية واللائحة العامة للبيانات RGPD',
    footer_rights: 'جميع الحقوق محفوظة. منصة CANNABIS CARE • شبكة متاجر معتمدة.',
    footer_helpline: 'خط مساعدة مجاني وسري: 112',
    footer_emergency: 'طوارئ الإسعاف الأوروبية: 112',
  },
};

// Common French phrases mapped to translation keys for automatic transparent translation of arbitrary UI strings
const FRENCH_PHRASE_TO_KEY: Record<string, string> = {
  // Navigation & Tabs
  'tableau de bord': 'sub_overview',
  'espace': 'nav_espace',
  'care & écoute': 'nav_care',
  'care & savoir': 'nav_care',
  'grand hub du savoir': 'sub_education',
  'grand hub du savoir & sciences': 'sub_education',
  'assistant ia écoute': 'sub_ai_coach',
  'assistant ia écoute & soutien': 'sub_ai_coach',
  'boutiques cbd & soins': 'nav_market',
  'boutiques & dispensaires': 'nav_market',
  'catalogue boutiques': 'sub_catalog',
  'mes commandes': 'sub_orders',
  'fidélité & points': 'sub_loyalty',
  'fidélité & récompenses': 'sub_loyalty',
  'offres du dispensaire': 'sub_marketing',
  'abonnement': 'nav_subscription',
  'panier': 'nav_cart',
  'mon panier': 'nav_cart',
  'journal de bord': 'sub_journal',
  'objectifs & habitudes': 'sub_goals',
  'reçus & factures': 'sub_receipts',
  'factures & reçus': 'sub_receipts',
  'connexion': 'nav_login',
  'déconnexion': 'nav_logout',
  'se déconnecter': 'nav_logout',
  'mon compte': 'nav_account',
  'paramètres & sanctuaire rgpd': 'nav_settings',
  'refaire le bilan initial': 'nav_onboarding',

  // Common UI Actions & Badges
  'enregistrer une séance': 'dash_quick_entry',
  'envie pressante / urgence sos': 'dash_emergency_craving',
  'plan de modération': 'dash_reduction_plan',
  'habitudes alternatives': 'dash_rediscover_habits',
  'déclencheurs fréquents': 'dash_triggers',
  'jours de clarté & maîtrise': 'dash_clarity_days',
  'économies estimées': 'dash_savings_est',
  'séances enregistrées ce mois': 'dash_sessions_count',
  'intensité moyenne de l’envie': 'dash_craving_level',
  'ajouter au panier': 'market_add_cart',
  'visiter la boutique': 'market_view_shop',
  'explorer': 'edu_explore',
  'validé': 'edu_verified',
  'tous les contenus': 'edu_filter_all',
  'articles scientifiques': 'edu_filter_articles',
  'micro-leçons': 'edu_filter_microlessons',
  'exercices pratiques': 'edu_filter_exercises',
  'quiz de maîtrise': 'edu_filter_quizzes',
  'guides & protocoles': 'edu_filter_guides',
  'cannabis & thc': 'edu_category_thc',
  'cbd & bien-être': 'edu_category_cbd',
  'corps & cerveau': 'edu_category_brain',
  'habitudes & mental': 'edu_category_habits',
  'modération & arrêt': 'edu_category_reduction',
  'sommeil & sérénité': 'edu_category_wellness',
  'réduction des risques': 'edu_category_risks',
  'en clair & analogies': 'edu_mode_simple',
  'mode expert & laboratoire': 'edu_mode_expert',
};

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (keyOrPhrase: string, fallback?: string) => string;
  options: LanguageOption[];
  currentOption: LanguageOption;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('cannabis_care_lang');
    if (saved && (['fr', 'en', 'de', 'es', 'lu', 'ar'] as string[]).includes(saved)) {
      return saved as AppLanguage;
    }
    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === 'ar') return 'ar';
    if (navLang === 'de') return 'de';
    if (navLang === 'es') return 'es';
    if (navLang === 'en') return 'en';
    if (navLang === 'lb' || navLang === 'lu') return 'lu';
    return 'fr';
  });

  const currentOption = SUPPORTED_LANGUAGES.find((opt) => opt.code === language) || SUPPORTED_LANGUAGES[0];
  const isRTL = currentOption.direction === 'rtl';

  useEffect(() => {
    // Update HTML dir and lang attributes for full accessibility and RTL support
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('cannabis_care_lang', lang);
  };

  /**
   * Translates either:
   * 1. A translation key (e.g. 'nav_care', 'dash_clarity_days')
   * 2. An arbitrary French phrase (e.g. 'Tableau de bord', 'Journal de bord')
   */
  const t = (keyOrPhrase: string, fallback?: string): string => {
    if (!keyOrPhrase) return fallback || '';

    const dict = TRANSLATIONS[language] || TRANSLATIONS.fr;

    // 1. Direct key match
    if (dict[keyOrPhrase]) {
      return dict[keyOrPhrase];
    }

    // 2. Direct key in French fallback
    if (TRANSLATIONS.fr[keyOrPhrase]) {
      // If found in French dict, check if current language has it
      return dict[keyOrPhrase] || TRANSLATIONS.fr[keyOrPhrase];
    }

    // 3. Normalized French phrase lookup
    const normalized = keyOrPhrase.trim().toLowerCase();
    const mappedKey = FRENCH_PHRASE_TO_KEY[normalized];
    if (mappedKey && dict[mappedKey]) {
      return dict[mappedKey];
    }

    return fallback !== undefined ? fallback : keyOrPhrase;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        options: SUPPORTED_LANGUAGES,
        currentOption,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
