import React, { useState, useEffect } from 'react';
import { ConsumptionEntry } from '../../types/entities';
import { X, Save, AlertCircle, Smile, DollarSign, Calendar, Clock, Tag } from 'lucide-react';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string | null;
  entryToEdit?: ConsumptionEntry | null;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  token,
  entryToEdit,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('20:00');
  const [productType, setProductType] = useState<string>('THC_herb');
  const [productName, setProductName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('joints');
  const [consumptionMode, setConsumptionMode] = useState<string>('combustion');
  const [context, setContext] = useState<string>('Soirée seul');
  const [moodBefore, setMoodBefore] = useState<number>(3);
  const [moodAfter, setMoodAfter] = useState<number>(3);
  const [costEstimated, setCostEstimated] = useState<number>(5);
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (entryToEdit) {
      setDate(entryToEdit.date);
      setTime(entryToEdit.time || '20:00');
      setProductType(entryToEdit.productType);
      setProductName(entryToEdit.productName);
      setQuantity(entryToEdit.quantity);
      setUnit(entryToEdit.unit);
      setConsumptionMode(entryToEdit.consumptionMode);
      setContext(entryToEdit.context);
      setMoodBefore(entryToEdit.moodBefore);
      setMoodAfter(entryToEdit.moodAfter);
      setCostEstimated(entryToEdit.costEstimated || 0);
      setPersonalNotes(entryToEdit.personalNotes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().substring(0, 5));
      setProductType('THC_herb');
      setProductName('Fleurs séchées');
      setQuantity(1);
      setUnit('joints');
      setConsumptionMode('combustion');
      setContext('Soirée seul à la maison');
      setMoodBefore(3);
      setMoodAfter(3);
      setCostEstimated(5);
      setPersonalNotes('');
    }
  }, [entryToEdit, isOpen]);

  // Adjust default unit and mode on product type change
  const handleProductTypeChange = (type: string) => {
    setProductType(type);
    if (type.startsWith('CBD_oil')) {
      setUnit('gouttes');
      setConsumptionMode('sublingual');
      setProductName('Huile CBD 10%');
      setCostEstimated(1.5);
    } else if (type.startsWith('THC')) {
      setUnit('joints');
      setConsumptionMode('combustion');
      setProductName('Cannabis THC');
      setCostEstimated(5);
    } else if (type.includes('infusion')) {
      setUnit('tasses');
      setConsumptionMode('infusion');
      setProductName('Tisane Chanvre & Plantes');
      setCostEstimated(1);
    } else if (type.includes('vape')) {
      setUnit('bouffées');
      setConsumptionMode('vaporisation');
      setProductName('Vape Pen CBD');
      setCostEstimated(2);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      date,
      time,
      productType,
      productName: productName || 'Produit sans nom',
      quantity: Number(quantity),
      unit,
      consumptionMode,
      context,
      moodBefore: Number(moodBefore),
      moodAfter: Number(moodAfter),
      costEstimated: Number(costEstimated),
      personalNotes,
    };

    try {
      const url = entryToEdit ? `/api/journal/${entryToEdit.id}` : '/api/journal';
      const method = entryToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Erreur lors de l'enregistrement.");
      }
    } catch {
      setErrorMsg('Erreur de connexion avec le serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              {entryToEdit ? 'Modifier la prise déclarée' : 'Nouvelle entrée au Journal de Bord'}
            </h3>
            <p className="text-xs text-slate-400">Enregistrement confidentiel et bienveillant</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Heure
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Product Type & Custom Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Type de substance / extrait :</label>
              <select
                value={productType}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              >
                <option value="THC_herb">Fleur séchée THC</option>
                <option value="THC_resin">Résine / Hash THC</option>
                <option value="CBD_oil">Huile sublinguale CBD</option>
                <option value="CBD_flower">Fleur CBD légale (&lt;0.3%)</option>
                <option value="CBD_vape">Vape Pen / Cartouche CBD</option>
                <option value="CBD_infusion">Infusion / Tisane chanvre</option>
                <option value="OTHER">Autre format</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nom du produit / variété :</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="ex: Amnesia, Huile 15% Full Spectrum..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quantity & Unit & Mode */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Quantité :</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Unité :</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              >
                <option value="joints">joints</option>
                <option value="grammes">grammes</option>
                <option value="gouttes">gouttes</option>
                <option value="mg">mg</option>
                <option value="bouffées">bouffées</option>
                <option value="tasses">tasses</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Mode :</label>
              <select
                value={consumptionMode}
                onChange={(e) => setConsumptionMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              >
                <option value="combustion">Combustion (Fumée)</option>
                <option value="vaporisation">Vaporisation (Herbe/Vape)</option>
                <option value="sublingual">Sublingual (Gouttes sous la langue)</option>
                <option value="infusion">Ingestion / Infusion</option>
                <option value="topique">Topique (Crème)</option>
              </select>
            </div>
          </div>

          {/* Context & Triggers */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Contexte / Déclencheur :</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="ex: Fin de journée fatigante, Soirée festive, Anxiété..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
            />
          </div>

          {/* Mood Scales Before & After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Humeur Avant :</span>
                <span className="text-teal-700 font-bold">{moodBefore} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={moodBefore}
                onChange={(e) => setMoodBefore(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 (Très tendu/Triste)</span>
                <span>5 (Très serein)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Humeur Après :</span>
                <span className="text-teal-700 font-bold">{moodAfter} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={moodAfter}
                onChange={(e) => setMoodAfter(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 (Aggravation/Inconfort)</span>
                <span>5 (Apaisé)</span>
              </div>
            </div>
          </div>

          {/* Cost Estimated */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Coût estimé de cette prise (€) :
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={costEstimated}
              onChange={(e) => setCostEstimated(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
            />
          </div>

          {/* Personal Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Ressentis ou observations personnelles :</label>
            <textarea
              rows={2}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Sensations corporelles, pensées automatiques, effets observés..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la prise'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
