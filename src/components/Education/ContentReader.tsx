import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  BookOpen,
  FileCheck,
  HelpCircle,
  Activity,
  ExternalLink,
  Sparkles,
  Share2,
  AlertCircle,
  Save,
  Layers,
} from 'lucide-react';
import { EducationalContent } from '../../types/entities';
import { EndocannabinoidExplorer } from './modules/EndocannabinoidExplorer';
import { PharmacokineticsComparator } from './modules/PharmacokineticsComparator';
import { TerpeneSpectrumExplorer } from './modules/TerpeneSpectrumExplorer';
import { HarmReductionProtocol } from './modules/HarmReductionProtocol';
import { EuropeanLegalMatrix } from './modules/EuropeanLegalMatrix';

interface ContentReaderProps {
  content: EducationalContent & {
    isFavorite?: boolean;
    userStatus?: string;
    progressPercentage?: number;
    quizScore?: number | null;
    exerciseResponses?: Record<string, any> | null;
  };
  onBack: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onMarkCompleted: (id: string, quizScore?: number, exerciseData?: any) => Promise<void>;
  lang?: string;
}

const CATEGORY_COVERS: Record<string, string> = {
  cannabis_thc: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1200&q=80',
  cbd: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
  body_brain: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
  habits_behavior: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
  reduction_cessation: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
  wellness: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=1200&q=80',
  harm_reduction: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
};

export const ContentReader: React.FC<ContentReaderProps> = ({
  content,
  onBack,
  onToggleFavorite,
  onMarkCompleted,
  lang = 'fr',
}) => {
  const [isCompleted, setIsCompleted] = useState(content.userStatus === 'completed');
  const [submitting, setSubmitting] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(content.quizScore ?? null);

  // Exercise responses state
  const [exerciseInputs, setExerciseInputs] = useState<Record<string, any>>(
    content.exerciseResponses || {}
  );
  const [journalSyncMessage, setJournalSyncMessage] = useState<string | null>(null);
  const [journalSyncing, setJournalSyncing] = useState(false);

  const durationMinutes = content.estimatedMinutes || content.readTimeMinutes || 4;

  // Handle Quiz Submission
  const handleQuizSubmit = async () => {
    if (!content.quizQuestions || content.quizQuestions.length === 0) return;
    let score = 0;
    content.quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    try {
      await onMarkCompleted(content.id, score, undefined);
      setIsCompleted(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Exercise Journal Sync (Module 6 -> Module 4 Journal)
  const handleSyncToJournal = async () => {
    setJournalSyncing(true);
    setJournalSyncMessage(null);
    try {
      // Build summary note
      const responsesSummary = Object.entries(exerciseInputs)
        .map(([k, v]) => `• ${k}: ${v}`)
        .join('\n');

      const noteContent = `Réflexion effectuée lors de l'exercice "${content.title}".\n\nNotes saisies :\n${responsesSummary || 'Exercice validé avec succès.'}`;

      const res = await fetch('/api/education/exercise/journal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: content.id,
          exerciseTitle: content.title,
          summaryNote: noteContent,
          responses: exerciseInputs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJournalSyncMessage('✓ Exercice synchronisé avec succès dans votre Journal de bord (Module 4) !');
        setIsCompleted(true);
        await onMarkCompleted(content.id, undefined, exerciseInputs);
      } else {
        setJournalSyncMessage('Erreur lors de la synchronisation.');
      }
    } catch (e) {
      setJournalSyncMessage('Erreur réseau.');
    } finally {
      setJournalSyncing(false);
    }
  };

  // Handle simple mark as completed
  const handleMarkAsRead = async () => {
    setSubmitting(true);
    try {
      await onMarkCompleted(content.id, quizScore || undefined, exerciseInputs);
      setIsCompleted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id={`content-reader-${content.id}`} className="space-y-6 max-w-4xl mx-auto">
      {/* Top navigation & action bar */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la bibliothèque</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => onToggleFavorite(content.id, e)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              content.isFavorite
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${content.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>{content.isFavorite ? 'Enregistré' : 'Enregistrer'}</span>
          </button>

          {!isCompleted ? (
            <button
              onClick={handleMarkAsRead}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Validation...' : 'Marquer comme lu'}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Validé</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Visual Header with High-Resolution Photography */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-900 h-48 sm:h-64">
        <img
          src={content.coverImage || CATEGORY_COVERS[content.category] || CATEGORY_COVERS['cannabis_thc']}
          alt={content.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-5 left-6 right-6 z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white font-bold text-xs backdrop-blur-md">
              {content.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
              {content.contentType || 'Article'}
            </span>
            <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-semibold ml-auto bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationMinutes} min de lecture</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            {content.title}
          </h1>
        </div>
      </div>

      {/* Main Header Container & Medical Disclaimer */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {content.subtitle && (
          <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
            {content.subtitle}
          </p>
        )}

        {/* Medical review disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Avertissement de Santé Publique & Neutralité Scientifique :</span>
            <p className="mt-0.5 text-amber-800">
              {content.medicalReviewDisclaimer ||
                "Contenu à visée exclusivement éducative, scientifique et de réduction des risques. Ne constitue en aucun cas un diagnostic, une prescription médicale ou une incitation à la consommation."}
            </p>
          </div>
        </div>
      </div>

      {/* DYNAMIC INTERACTIVE LAB INTEGRATION (HYBRID PEDAGOGY) */}
      {(content.id === 'mod_endocannabinoid_studio' ||
        content.id === 'art_endocannabinoid_system' ||
        content.id === 'art_thc_brain_mechanisms' ||
        content.title?.toLowerCase().includes('endocannabinoïde') ||
        content.title?.toLowerCase().includes('cerveau')) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
              Explorateur Interactif Associé — Système Endocannabinoïde
            </span>
          </div>
          <EndocannabinoidExplorer />
        </div>
      )}

      {(content.id === 'mod_pharmacokinetics_lab' ||
        content.title?.toLowerCase().includes('pharmacocinétique') ||
        content.title?.toLowerCase().includes('biodisponibilité') ||
        content.title?.toLowerCase().includes('ingestion')) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-black uppercase tracking-wider text-teal-900">
              Comparateur Pharmacocinétique & Métabolique
            </span>
          </div>
          <PharmacokineticsComparator />
        </div>
      )}

      {(content.id === 'mod_terpene_spectrum' ||
        content.title?.toLowerCase().includes('terpène') ||
        content.title?.toLowerCase().includes('vaporisation') ||
        content.title?.toLowerCase().includes('arôme')) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              Laboratoire Aromatique & Spectre Thermique
            </span>
          </div>
          <TerpeneSpectrumExplorer />
        </div>
      )}

      {(content.id === 'mod_harm_reduction_protocol' ||
        content.id === 'guide_harm_reduction_protocol' ||
        content.title?.toLowerCase().includes('malaise') ||
        content.title?.toLowerCase().includes('urgence') ||
        content.title?.toLowerCase().includes('bad trip') ||
        content.title?.toLowerCase().includes('réduction')) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-900">
              Protocole d'Urgence & Réduction des Risques
            </span>
          </div>
          <HarmReductionProtocol />
        </div>
      )}

      {(content.id === 'mod_european_legal_matrix' ||
        content.id === 'fiche_thc_driving_safety' ||
        content.title?.toLowerCase().includes('conduite') ||
        content.title?.toLowerCase().includes('loi') ||
        content.title?.toLowerCase().includes('législation')) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
              Matrice Juridique Européenne & Sécurité Routière
            </span>
          </div>
          <EuropeanLegalMatrix />
        </div>
      )}

      {/* Summary Highlight Box */}
      {content.summary && (
        <div className="p-6 rounded-3xl bg-teal-900 text-white shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>En un coup d&apos;œil</span>
          </div>
          <p className="text-sm sm:text-base font-medium leading-relaxed text-teal-50">
            {content.summary}
          </p>
        </div>
      )}

      {/* Structured Sections (or legacy text) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-8">
        {content.sections && content.sections.length > 0 ? (
          content.sections.map((sec, idx) => (
            <div key={idx} className="space-y-3 pt-4 first:pt-0 border-t border-slate-100 first:border-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-800 text-xs font-black flex items-center justify-center border border-teal-200">
                  {idx + 1}
                </span>
                <span>{sec.title}</span>
              </h3>

              <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {sec.content}
              </div>

              {sec.highlight && (
                <div className="p-4 rounded-2xl bg-slate-50 border-l-4 border-teal-600 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                  {sec.highlight}
                </div>
              )}

              {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {sec.bulletPoints.map((bp, bidx) => (
                    <li key={bidx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        ) : (
          <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-line text-slate-700">
            {content.content}
          </div>
        )}

        {/* Key Takeaways Checklist */}
        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 mt-6">
            <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>Points clés à retenir</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {content.keyTakeaways.map((takeaway, tidx) => (
                <div key={tidx} className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Practical Exercise (if applicable) */}
      {content.exerciseSteps && content.exerciseSteps.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-teal-500 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Activity className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Exercice Pratique Guidé</h3>
              <p className="text-xs text-slate-500">
                Passez de la théorie à l&apos;action. Vos réponses peuvent être automatiquement enregistrées dans votre Journal de bord (Module 4).
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {content.exerciseSteps.map((step) => (
              <div key={step.stepNumber} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                    Étape {step.stepNumber} : {step.instruction}
                  </span>
                  {step.estimatedMinutes && (
                    <span className="text-[11px] text-slate-400">~{step.estimatedMinutes} min</span>
                  )}
                </div>

                {step.guidanceTips && (
                  <p className="text-xs text-slate-600 italic">{step.guidanceTips}</p>
                )}

                {step.type === 'reflection_input' && (
                  <textarea
                    id={`exercise-input-${step.stepNumber}`}
                    rows={3}
                    value={exerciseInputs[`etape_${step.stepNumber}`] || ''}
                    onChange={(e) =>
                      setExerciseInputs({
                        ...exerciseInputs,
                        [`etape_${step.stepNumber}`]: e.target.value,
                      })
                    }
                    placeholder="Saisissez vos observations, ressentis ou idées ici..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                )}

                {step.type === 'checklist' && (
                  <div className="space-y-2 pt-1">
                    {['J’ai identifié le déclencheur', 'J’ai attendu 10 minutes', 'J’ai bu un grand verre d’eau'].map((item, ci) => (
                      <label key={ci} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!exerciseInputs[`check_${step.stepNumber}_${ci}`]}
                          onChange={(e) =>
                            setExerciseInputs({
                              ...exerciseInputs,
                              [`check_${step.stepNumber}_${ci}`]: e.target.checked,
                            })
                          }
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sync to Journal Action */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              id="btn-sync-journal"
              onClick={handleSyncToJournal}
              disabled={journalSyncing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{journalSyncing ? 'Enregistrement...' : 'Enregistrer dans mon Journal (Module 4)'}</span>
            </button>

            {journalSyncMessage && (
              <span className={`text-xs font-semibold ${journalSyncMessage.startsWith('✓') ? 'text-emerald-700' : 'text-rose-700'}`}>
                {journalSyncMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Quiz (if applicable) */}
      {content.quizQuestions && content.quizQuestions.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-800">
                <HelpCircle className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Quiz de Validation des Connaissances</h3>
                <p className="text-xs text-slate-500">Vérifiez vos acquis en toute bienveillance.</p>
              </div>
            </div>

            {quizSubmitted && quizScore !== null && (
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200">
                Score : {quizScore} / {content.quizQuestions.length}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {content.quizQuestions.map((q, qIndex) => {
              const userAnswer = selectedAnswers[qIndex];
              const isAnswered = userAnswer !== undefined;
              const isCorrect = isAnswered && userAnswer === q.correctAnswerIndex;

              return (
                <div key={qIndex} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Question {qIndex + 1} : {q.question}
                  </h4>

                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => {
                      const selected = userAnswer === optIndex;
                      let optionClasses = 'p-3 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ';

                      if (quizSubmitted) {
                        if (optIndex === q.correctAnswerIndex) {
                          optionClasses += 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (selected && !isCorrect) {
                          optionClasses += 'bg-rose-50 border-rose-400 text-rose-900 line-through';
                        } else {
                          optionClasses += 'bg-white border-slate-200 text-slate-500 opacity-60';
                        }
                      } else {
                        if (selected) {
                          optionClasses += 'bg-teal-50 border-teal-500 text-teal-900 font-bold';
                        } else {
                          optionClasses += 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';
                        }
                      }

                      return (
                        <div
                          key={optIndex}
                          onClick={() => {
                            if (!quizSubmitted) {
                              setSelectedAnswers({
                                ...selectedAnswers,
                                [qIndex]: optIndex,
                              });
                            }
                          }}
                          className={optionClasses}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && optIndex === q.correctAnswerIndex && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      <strong>Explication scientifique :</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizSubmitted ? (
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(selectedAnswers).length < content.quizQuestions.length}
              className="w-full py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-40"
            >
              Valider mes réponses
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Quiz terminé et enregistré avec succès dans votre progression !</span>
            </div>
          )}
        </div>
      )}

      {/* Scientific References Container */}
      {content.sourceReferences && content.sourceReferences.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sources Scientifiques & Références Épidémiologiques</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {content.sourceReferences.map((ref: any, ridx: number) => {
              const text = typeof ref === 'string' ? ref : `${ref.authors || ''} (${ref.year || ''}) : ${ref.title}. ${ref.journal || ''}`;
              const link = typeof ref === 'object' && ref.url ? ref.url : null;

              return (
                <li key={ridx} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-1.5 last:border-0">
                  <span>{text}</span>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bottom Completion Bar */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          Avez-vous trouvé ce contenu clair et utile ?
        </span>
        <button
          onClick={onBack}
          className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
        >
          Retour aux parcours & articles →
        </button>
      </div>
    </div>
  );
};
