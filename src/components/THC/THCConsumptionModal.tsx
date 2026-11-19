import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Flame,
  Clock,
  Calendar,
  Smile,
  AlertCircle,
  Save,
  Tag,
  DollarSign,
} from 'lucide-react';
import { ConsumptionEntry } from '../../types/entities';

interface THCConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string | null;
  entryToEdit?: ConsumptionEntry | null;
}

export const THCConsumptionModal: React.FC<THCConsumptionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  token,
  entryToEdit,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().substring(0, 5));
  const [productType, setProductType] = useState<string>('THC_herb');
  const [productName, setProductName] = useState<string>('Fleurs THC');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('joints');
  const [consumptionMode, setConsumptionMode] = useState<string>('combustion');
  const [context, setContext] = useState<string>('Soirée seul à la maison');
  const [trigger, setTrigger] = useState<string>('Habitude de fin de journée');
  const [cravingBefore, setCravingBefore] = useState<number>(5);
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
      setProductType(entryToEdit.productType || 'THC_herb');
      setProductName(entryToEdit.productName || 'Fleurs THC');
      setQuantity(entryToEdit.quantity || 1);
      setUnit(entryToEdit.unit || 'joints');
      setConsumptionMode(entryToEdit.consumptionMode || 'combustion');
      setContext(entryToEdit.context || 'Soirée');
      setTrigger(entryToEdit.trigger || 'Habitude');
      setCravingBefore(entryToEdit.cravingBefore ?? 5);
      setMoodBefore(entryToEdit.moodBefore || 3);
      setMoodAfter(entryToEdit.moodAfter || 3);
      setCostEstimated(entryToEdit.costEstimated || 5);
      setPersonalNotes(entryToEdit.personalNotes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().substring(0, 5));
      setProductType('THC_herb');
      setProductName('Fleurs THC');
      setQuantity(1);
      setUnit('joints');
      setConsumptionMode('combustion');
      setContext('Soirée seul à la maison');
      setTrigger('Habitude de fin de journée');
      setCravingBefore(5);
      setMoodBefore(3);
      setMoodAfter(3);
      setCostEstimated(5);
      setPersonalNotes('');
    }
  }, [entryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      date,
      time,
      productType,
      productName,
      quantity: Number(quantity),
      unit,
      consumptionMode,
      context,
      trigger,
      cravingBefore: Number(cravingBefore),
      moodBefore: Number(moodBefore),
      moodAfter: Number(moodAfter),
      costEstimated: Number(costEstimated),
      personalNotes,
    };

    try {
      const url = entryToEdit ? `/api/journal/entries/${entryToEdit.id}` : '/api/journal/entries';
      const method = entryToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors de l’enregistrement de la prise.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">
                Journal de Bord THC
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {entryToEdit ? 'Modifier l’Entrée' : 'Noter une Consommation THC'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Date :</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Heure :</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantité :</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unité :</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              >
                <option value="joints">Joint(s)</option>
                <option value="g">Gramme(s)</option>
                <option value="sessions">Session(s)</option>
                <option value="puffs">Bouffée(s)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Coût estimé (€) :</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={costEstimated}
                onChange={(e) => setCostEstimated(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Type de produit :</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              >
                <option value="THC_herb">Fleurs séchées (herbe)</option>
                <option value="THC_resin">Résine / Hashish</option>
                <option value="THC_edible">Comestible / Infusion</option>
                <option value="other">Autre préparation</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mode d'absorption :</label>
              <select
                value={consumptionMode}
                onChange={(e) => setConsumptionMode(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              >
                <option value="combustion">Combustion (fumé)</option>
                <option value="vaporisation">Vaporisation (sans tabac)</option>
                <option value="ingestion">Ingestion / Alimentaire</option>
                <option value="other">Autre mode</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contexte :</label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex : Soirée seul, avec des amis..."
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Déclencheur pressenti :</label>
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Ex : Habitude, stress, ennui..."
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>
          </div>

          {/* Craving before & Mood ratings */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Intensité de l'envie avant la prise :</span>
                <span className="font-bold text-teal-800">{cravingBefore} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={cravingBefore}
                onChange={(e) => setCravingBefore(parseInt(e.target.value, 10))}
                className="w-full accent-teal-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Humeur avant (1-5) :</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMoodBefore(val)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                        moodBefore === val
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Humeur après (1-5) :</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMoodAfter(val)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                        moodAfter === val
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 text-xs block mb-1">Notes personnelles (optionnel) :</label>
            <input
              type="text"
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Sensations, pensées observées..."
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-teal-300" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
