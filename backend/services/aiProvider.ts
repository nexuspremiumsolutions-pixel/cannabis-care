/**
 * AI Provider Abstraction Layer — Nexus Premium Solutions
 * 
 * Supports Gemini via modern @google/genai SDK (server-side only)
 * with graceful fallback to an expert rule-based behavioral coaching engine.
 */
import { GoogleGenAI } from '@google/genai';

export interface GenerateAIParams {
  systemInstruction?: string;
  prompt: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
  temperature?: number;
  language?: 'fr' | 'en' | 'ar';
}

export interface AIProvider {
  name: string;
  generateText(params: GenerateAIParams): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  public name = 'GeminiProvider';
  private client: GoogleGenAI | null = null;
  private fallbackProvider: RuleBasedFallbackProvider;

  constructor() {
    this.fallbackProvider = new RuleBasedFallbackProvider();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  async generateText(params: GenerateAIParams): Promise<string> {
    if (!this.client) {
      return this.fallbackProvider.generateText(params);
    }

    try {
      // Build formatted multi-turn contents if conversation history exists
      let contents: any;
      if (params.conversationHistory && params.conversationHistory.length > 0) {
        // Take recent relevant window (last 6 messages) to minimize tokens
        const window = params.conversationHistory.slice(-6);
        const historyParts = window.map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${m.text}`).join('\n\n');
        contents = `${historyParts}\n\nUtilisateur : ${params.prompt}\nAssistant :`;
      } else {
        contents = params.prompt;
      }

      const response = await this.client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.7,
        },
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }

      // Fallback if empty response
      return this.fallbackProvider.generateText(params);
    } catch (err: any) {
      console.warn('[AIProvider] Gemini API call error, applying expert behavioral fallback:', err?.message || err);
      return this.fallbackProvider.generateText(params);
    }
  }
}

export class RuleBasedFallbackProvider implements AIProvider {
  public name = 'RuleBasedFallbackProvider';

  async generateText(params: GenerateAIParams): Promise<string> {
    const text = params.prompt.toLowerCase();
    const lang = params.language || 'fr';

    // 1. EMERGENCY / CRISIS DETECTION
    if (
      text.includes('suicide') ||
      text.includes('en finir') ||
      text.includes('mourir') ||
      text.includes('kill myself') ||
      text.includes('end my life') ||
      text.includes('انتحار') ||
      text.includes('الموت')
    ) {
      if (lang === 'en') {
        return `I hear your distress, and your safety is the absolute priority.\n\nPlease reach out right now to professional emergency care:\n• National Suicide Prevention Helpline (France): **3114** (Free, confidential, 24/7)\n• European Emergency Number: **112**\n• UK Suicide Helpline: **111** or **999**\n• US/Canada: **988**\n\nYou are not alone. Please contact emergency services or a trusted loved one immediately.`;
      }
      if (lang === 'ar') {
        return `أسمع معاناتك العميقة، وسلامتك هي الأولوية القصوى المطلقة.\n\nيرجى التواصل فوراً مع خدمات الطوارئ والدعم النفسي:\n• رقم الطوارئ الأوروبي: **112**\n• خط الوقاية والدعم (فرنسا): **3114** (مجاني وسري 24/7)\n• خط المساعدة بشأن الإدمان: **0800231313**\n\nأنت لست وحدك، يرجى التحدث إلى مختص أو شخص قريب منك فوراً.`;
      }
      return `J'entends votre profonde détresse, et votre sécurité et votre vie sont la priorité absolue.\n\nCe service est un outil d'accompagnement comportemental et ne peut pas remplacer une aide médicale d'urgence. Veuillez contacter immédiatement les services d'écoute et d'urgence spécialisés :\n• **3114** : Numéro national de prévention du suicide (Appel gratuit, 24h/24, 7j/7, anonyme et confidentiel)\n• **15** (SAMU) ou **112** (Urgences européennes)\n• **Drogues Info Service** : **0 800 23 13 13** (7j/7, de 8h à 2h, gratuit et anonyme)\n\nVous n'êtes pas seul(e). Prenez contact avec un professionnel ou un proche dès maintenant.`;
    }

    // 2. MEDICAL DIAGNOSIS / PRESCRIPTION REFUSAL
    if (
      text.includes('ordonnance') ||
      text.includes('prescris') ||
      text.includes('diagnostique') ||
      text.includes('quelle dose de thc') ||
      text.includes('combien de mg de thc') ||
      text.includes('combien de mg de cbd prendre pour soigner') ||
      text.includes('prescribe') ||
      text.includes('diagnosis') ||
      text.includes('cure my cancer') ||
      text.includes('وصفة طبية') ||
      text.includes('تشخيص')
    ) {
      if (lang === 'en') {
        return `As an AI companion with Cannabis Care, I do not provide medical diagnoses, prescriptions, or medical dosing recommendations. Only a licensed physician or pharmacist can evaluate your health status and prescribe treatments.\n\nI can, however, help you track your habits, understand non-medical wellness routines, or explore verified scientific articles from our education library.`;
      }
      if (lang === 'ar') {
        return `بصفتي مساعداً في تطبيق Cannabis Care، لا يمكنني تقديم أي تشخيص طبي أو وصفات علاجية أو جرعات دوائية. الطبيب المعالج أو الصيدلي هو الوحيد المخول بتقديم هذه الاستشارات.\n\nيمكنني مساعدتك في تتبع عاداتك، فهم استراتيجيات السلوك الإيجابي، واستكشاف المقالات العلمية في مكتبتنا.`;
      }
      return `En tant qu'assistant de l'application Cannabis Care, je ne suis pas habilité à poser de diagnostic médical, ni à prescrire de traitement ou de posologie individualisée. Seul un médecin ou un pharmacien peut évaluer votre état de santé et vous conseiller sur le plan thérapeutique.\n\nJe peux en revanche vous aider à analyser vos habitudes dans votre journal, à mettre en place des stratégies comportementales autonomes ou à explorer les guides scientifiques disponibles dans la bibliothèque de l'application.`;
    }

    // 3. PROMPT INJECTION / JAILBREAK REFUSAL
    if (
      text.includes('ignore tes règles') ||
      text.includes('ignore previous instructions') ||
      text.includes('system prompt') ||
      text.includes('ta clé api') ||
      text.includes('api key') ||
      text.includes('donne-moi le mot de passe') ||
      text.includes('ignore all rules')
    ) {
      return `Je respecte strictement le cadre éthique, scientifique et déontologique de Cannabis Care défini par Nexus Premium Solutions. Je ne peux ni ignorer mes directives déontologiques, ni partager des clés techniques ou des données confidentielles. Comment puis-je vous accompagner de manière constructive dans votre parcours aujourd'hui ?`;
    }

    // 4. CRAVINGS & URGES (Gestion des envies)
    if (
      text.includes('envie') ||
      text.includes('craving') ||
      text.includes('craquer') ||
      text.includes('fumer') ||
      text.includes('fume') ||
      text.includes('consommer') ||
      text.includes('joint') ||
      text.includes('smoke') ||
      text.includes('urge') ||
      text.includes('رغبة') ||
      text.includes('تدخين')
    ) {
      if (lang === 'en') {
        return `I understand you are feeling a strong urge right now. Please remember: an urge is like an ocean wave—it peaks within 5 to 10 minutes, then naturally subsides.\n\nHere are 3 practical, non-medical steps you can take right now:\n1. **Delay (The 10-Minute Rule)**: Tell yourself you won't make a decision for 10 minutes.\n2. **Hydrate & Breathe**: Drink a large glass of cool water and practice deep cardiac coherence breathing (4 seconds in, 6 seconds out) for 2 minutes.\n3. **Change the Scene**: Move to another room, wash your hands with cool water, or take a quick 5-minute walk.\n\nWould you like to log this urge in your journal to observe what triggered it?`;
      }
      if (lang === 'ar') {
        return `أتفهم تماماً أنك تشعر برغبة ملحة في التدخين الآن. تذكر دائماً: الرغبة تشبه الموجة، تصل إلى ذروتها خلال 5 إلى 10 دقائق ثم تتراجع تدريجياً.\n\nإليك 3 خطوات سلوكية عملية يمكنك تطبيقها فوراً:\n1. **التأجيل (قاعدة الـ 10 دقائق)**: امنح نفسك 10 دقائق دون اتخاذ أي قرار متسرع.\n2. **الترطيب والتنفس العميق**: اشرب كوباً كبيراً من الماء البارد ومارس التنفس الهادئ (شهيق 4 ثوانٍ، زفير 6 ثوانٍ).\n3. **تغيير المكان**: انتقل إلى غرفة أخرى أو قم بنزهة قصيرة لمدة 5 دقائق لكسر الروتين الحركي.\n\nهل ترغب في تسجيل هذه اللحظة في دفتر يومياتك لدراسة المحفزات؟`;
      }
      return `Je comprends tout à fait cette envie passagère. Sachez qu'une vague d'envie dure généralement entre 5 et 10 minutes avant de redescendre d'elle-même.\n\nVoici 3 actions concrètes et bienveillantes à tester immédiatement :\n1. **Différer (Règle des 10 minutes)** : Dites-vous simplement : « J'attends 10 minutes avant de prendre la moindre décision ».\n2. **Boire un grand verre d'eau fraîche & respirer** : Prenez 10 respirations profondes (inspiration 4 secondes, expiration lente 6 secondes).\n3. **Changer d'environnement** : Quittez la pièce où vous êtes, passez-vous de l'eau fraîche sur le visage ou sortez marcher 5 minutes.\n\nSouhaitez-vous enregistrer cette envie dans votre journal afin d'en identifier le contexte et l'émotion déclenchante ?`;
    }

    // 5. SLIP / RELAPSE (Reprise de consommation)
    if (
      text.includes('recommencé') ||
      text.includes('rechuté') ||
      text.includes('craqué') ||
      text.includes('faute') ||
      text.includes('échoué') ||
      text.includes('relapsed') ||
      text.includes('slipped') ||
      text.includes('عدت للتدخين') ||
      text.includes('انتكاسة')
    ) {
      if (lang === 'en') {
        return `First, please do not blame yourself. A slip is not a failure—it is a learning opportunity in any behavioral journey.\n\nProgress is never a straight line. What matters most right now is kindness toward yourself. Let's observe without judgment:\n• What was happening right before? (Fatigue, emotional stress, social pressure?)\n• What can we learn from this situation for next time?\n\nTake a slow breath. Your past efforts are still intact and build your long-term autonomy. What is one small, positive action you can do for yourself today?`;
      }
      return `Avant toute chose : ne vous culpabilisez pas. Un écart ne remet absolument pas à zéro vos efforts ni vos apprentissages.\n\nModifier une habitude n'est jamais un chemin parfaitement linéaire. Regardons la situation avec bienveillance et curiosité factuelle :\n• Que s'est-il passé juste avant ? (Fatigue intense, contrariété, contexte festif, ennui ?)\n• Quelle émotion ou quel besoin cherchiez-vous à apaiser ?\n\nChaque observation enrichit votre expérience et renforce votre autonomie future. Prenez un grand verre d'eau et accordez-vous un moment de répit. Souhaitez-vous noter ce contexte dans votre journal pour en tirer un enseignement utile ?`;
    }

    // 6. CBD EXPLANATIONS & PRODUCTS
    if (
      text.includes('cbd') ||
      text.includes('cannabidiol') ||
      text.includes('huile de cbd') ||
      text.includes('fleurs de cbd') ||
      text.includes('étiquette') ||
      text.includes('spectre complet') ||
      text.includes('broad spectrum') ||
      text.includes('isolat')
    ) {
      if (lang === 'en') {
        return `Cannabidiol (CBD) is a non-intoxicating phytocannabinoid naturally present in hemp (*Cannabis sativa L.*). Unlike THC, CBD does not cause psychotropic effects or addiction.\n\nKey aspects to know:\n• **Full Spectrum**: Contains CBD along with trace cannabinoids and legal terpenes (<0.3% THC in the EU), providing the "entourage effect".\n• **Broad Spectrum**: All plant compounds preserved, but with 0.0% THC.\n• **Isolate**: Pure CBD crystals (99%+), without other cannabinoids.\n\n*Important non-medical reminder*: CBD is a wellness product and should not replace medical treatment. If you are taking medication, please consult a pharmacist regarding potential enzyme interactions (CYP450).`;
      }
      return `Le cannabidiol (CBD) est un phytocannabinoïde non stupéfiant extrait du chanvre (*Cannabis sativa L.*). Contrairement au THC, il n'entraîne pas d'effet psychotrope (pas d'ivresse cannabique) et ne crée pas de dépendance.\n\nPour bien comprendre les formats :\n• **Spectre Complet (Full Spectrum)** : Contient l'ensemble des cannabinoïdes et terpènes naturels du chanvre (avec un taux légal de THC inférieur à 0,3 % en France/UE), favorisant « l'effet d'entourage ».\n• **Large Spectre (Broad Spectrum)** : Conserve les terpènes et flavonoïdes, mais avec un taux de THC indétectable (0,0 %).\n• **Isolat** : Molécule de CBD pure à plus de 99 % sous forme de cristaux.\n\n*Rappel de sécurité* : Le CBD n'est pas un médicament. En cas de traitement en cours, un échange avec votre médecin ou pharmacien est recommandé afin d'éviter toute interaction enzymatique (notamment sur les cytochromes P450).`;
    }

    // 7. SLEEP & INSOMNIA (Sommeil)
    if (
      text.includes('sommeil') ||
      text.includes('dormir') ||
      text.includes('insomnie') ||
      text.includes('réveil') ||
      text.includes('fatigue') ||
      text.includes('sleep') ||
      text.includes('نوم') ||
      text.includes('أرق')
    ) {
      if (lang === 'en') {
        return `Sleep is frequently the most noticeable challenge during any shift in cannabis habits. When THC intake decreases, the brain takes some time to rebalance its natural sleep architecture and REM phases.\n\nPractical sleep hygiene tips:\n• **Cool bedroom**: Maintain an ambient temperature around 18°C–19°C (64°F–66°F).\n• **Screen curfew**: Turn off blue-light screens 45 minutes before sleep.\n• **The 20-minute rule**: If you are still awake after 20 minutes in bed, get up, sit under soft lighting, and read a few pages until drowsiness returns.\n• **Herbal ritual**: A hot infusion of chamomile, lemon balm, or valerian can help anchor a calming evening habit.\n\nWould you like to check our dedicated sleep guide in the education section?`;
      }
      return `Le sommeil est très souvent le premier domaine impacté lors d'une réduction ou d'un changement d'habitudes avec le cannabis. Lors de la diminution du THC, le cerveau a besoin de quelques jours à quelques semaines pour rééquilibrer sa production naturelle de mélatonine et retrouver un cycle de sommeil paradoxal normal.\n\nVoici des repères non médicaux éprouvés :\n• **Température de la chambre** : Maintenez une pièce tempérée entre 18°C et 19°C.\n• **Couvre-feu numérique** : Éteignez smartphones et ordinateurs 45 minutes avant l'extinction des feux (la lumière bleue bloque la sécrétion de mélatonine).\n• **Règle des 20 minutes** : Si vous ne dormez pas après 20 minutes au lit, levez-vous, installez-vous dans un fauteuil avec une lumière tamisée et lisez quelques pages.\n• **Rituel d'infusion** : Camomille, passiflore ou mélisse participent à ancrer un rituel apaisant de transition vers la nuit.\n\nSouhaitez-vous explorer le parcours « Améliorer mon sommeil » dans notre bibliothèque ?`;
    }

    // 8. STRESS & ANXIETY (Stress)
    if (
      text.includes('stress') ||
      text.includes('anxieux') ||
      text.includes('angoisse') ||
      text.includes('tendu') ||
      text.includes('pression') ||
      text.includes('anxiety') ||
      text.includes('قلق') ||
      text.includes('توتر')
    ) {
      return `Le stress est l'un des déclencheurs de consommation les plus fréquents. Quand la tension monte, le cerveau cherche un soulagement immédiat.\n\nEssayons la **Cohérence Cardiaque 365** ensemble :\n• **3 fois par jour**\n• **6 respirations par minute** (5 secondes d'inspiration par le nez, 5 secondes d'expiration par la bouche)\n• **Pendant 5 minutes**\n\nCet exercice stimule le nerf vague et abaisse mécaniquement le taux de cortisol (l'hormone du stress) en moins de 3 minutes.\n\nSouhaitez-vous lancer un minuteur de respiration guidée ou noter votre niveau de stress actuel dans votre journal ?`;
    }

    // 9. GENERAL ENCOURAGING & INFORMATIVE RESPONSE
    if (lang === 'en') {
      return `Thank you for sharing. With Cannabis Care, every reflection and logged habit brings you closer to informed, autonomous well-being.\n\nI am here to help you explore your journal patterns, discover non-medical behavioral techniques, or answer questions about legal cannabinoids and the endocannabinoid system.\n\nWhat would you like to focus on together right now?`;
    }
    if (lang === 'ar') {
      return `شكراً لمشاركتك. في تطبيق Cannabis Care، كل خطوة واعية وكل ملاحظة تسجلها تقربك من التوازن والاستقلالية الصحية.\n\nأنا هنا لمساعدتك في فهم عاداتك، ممارسة تمارين الاسترخاء غير الطبية، واستكشاف المعلومات العلمية الموثوقة.\n\nما الذي ترغب في استكشافه أو العمل عليه معاً الآن؟`;
    }
    return `Merci pour votre partage. Dans votre démarche avec Cannabis Care, chaque étape d'observation et chaque prise de recul constituent un progrès concret vers votre équilibre et votre autonomie.\n\nJe suis à votre disposition pour vous aider à analyser vos habitudes dans le journal, vous proposer des exercices de recentrage bienveillants ou vous orienter vers les articles de notre bibliothèque éducative.\n\nQuel aspect de votre quotidien souhaitez-vous explorer ensemble aujourd'hui ?`;
  }
}

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    if (process.env.GEMINI_API_KEY) {
      providerInstance = new GeminiProvider();
    } else {
      providerInstance = new RuleBasedFallbackProvider();
    }
  }
  return providerInstance;
}

export function setAIProvider(provider: AIProvider | null): void {
  providerInstance = provider;
}

