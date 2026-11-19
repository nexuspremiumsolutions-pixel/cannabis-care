import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CBDConsumption,
  CBDProduct,
  CBDProductCategory,
  CBDConsumptionMethod,
  CBDQuantityUnit,
} from '../../types/entities';
import {
  X,
  Plus,
  Droplet,
  Calendar,
  Clock,
  Tag,
  Check,
  Sparkles,
  HelpCircle,
  FileText,
  Heart,
  Smile,
  Info,
} from 'lucide-react';

interface CBDConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialProductId?: string | null;
  editingConsumption?: CBDConsumption | null;
}

const CATEGORIES: { value: CBDProductCategory; label: string; iconName: string }[] = [
  { value: 'oil', label: 'Huile / Gouttes', iconName: 'Droplet' },
  { value: 'flower', label: 'Fleurs séchées', iconName: 'Flower' },
  { value: 'infusion', label: 'Infusion / Tisane', iconName: 'Cup' },
  { value: 'capsule', label: 'Gélules / Capsules', iconName: 'Pill' },
  { value: 'edible', label: 'Aliment / Gummies', iconName: 'Cookie' },
  { value: 'beverage', label: 'Boisson', iconName: 'Coffee' },
  { value: 'vape', label: 'Vaporisation / Vape', iconName: 'Wind' },
  { value: 'cosmetic', label: 'Baume / Cosmétique', iconName: 'Sparkles' },
  { value: 'resin', label: 'Résine', iconName: 'Box' },
  { value: 'extract', label: 'Extrait / Cristaux', iconName: 'Layers' },
  { value: 'other', label: 'Autre format', iconName: 'HelpCircle' },
];

const METHODS: { value: CBDConsumptionMethod; label: string; tip: string }[] = [
  { value: 'sublingual', label: 'Sublingual (sous la langue)', tip: 'Action rapide (15-30 min), biodisponibilité optimale' },
  { value: 'ingestion', label: 'Ingestion orale (avaler)', tip: 'Action progressive (1-2h), durée prolongée' },
  { value: 'infusion', label: 'Infusion / Tisane chaude', tip: 'À associer idéalement à un corps gras (lait, huile)' },
  { value: 'vaporisation', label: 'Vaporisation douce', tip: 'Sans combustion, extraction des terpènes' },
  { value: 'inhalation', label: 'Inhalation', tip: 'Passage pulmonaire' },
  { value: 'topical', label: 'Application cutanée', tip: 'Massage localisé, ciblage musculaire ou dermique' },
  { value: 'other', label: 'Autre méthode', tip: 'Méthode personnalisée' },
];

const UNITS: { value: CBDQuantityUnit; label: string }[] = [
  { value: 'drops', label: 'gouttes' },
  { value: 'mg', label: 'mg (milligrammes)' },
  { value: 'ml', label: 'ml (millilitres)' },
  { value: 'capsules', label: 'gélule(s)' },
  { value: 'g', label: 'g (grammes)' },
  { value: 'cups', label: 'tasse(s)' },
  { value: 'puffs', label: 'bouffée(s)' },
  { value: 'units', label: 'unité(s)' },
  { value: 'other', label: 'autre' },
];

const CONTEXTS: { value: string; label: string }[] = [
  { value: 'morning', label: 'Matin au réveil' },
  { value: 'noon', label: 'Pause déjeuner / Midi' },
  { value: 'afternoon', label: 'Après-midi' },
  { value: 'evening', label: 'Soirée détente' },
  { value: 'before_sleep', label: 'Avant le coucher / Sommeil' },
  { value: 'after_sport', label: 'Après activité physique / Récupération' },
  { value: 'relaxation', label: 'Moment de pause / Méditation' },
  { value: 'social', label: 'Moment convivial / Social' },
  { value: 'other', label: 'Autre contexte' },
];

const SUBJECTIVE_EFFECTS = [
  'Détente musculaire',
  'Apaisement mental',
  'Facilitation du sommeil',
  'Sensation de calme',
  'Confort physique',
  'Clarté d’esprit',
  'Effet neutre / non perçu',
  'Légère somnolence',
  'Inconfort / Goût trop amer',
];

export const CBDConsumptionModal: React.FC<CBDConsumptionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialProductId,
  editingConsumption,
}) => {
  const { token } = useAuth();

  const [productsList, setProductsList] = useState<CBDProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [productType, setProductType] = useState<CBDProductCategory>('oil');
  const [consumptionMethod, setConsumptionMethod] = useState<CBDConsumptionMethod>('sublingual');
  const [quantity, setQuantity] = useState<string>('3');
  const [quantityUnit, setQuantityUnit] = useState<CBDQuantityUnit>('drops');
  const [context, setContext] = useState<string>('evening');
  const [selectedEffects, setSelectedEffects] = useState<string[]>(['Apaisement mental']);
  const [wellnessRating, setWellnessRating] = useState<number>(4);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().substring(0, 5));
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load products list for the dropdown
  useEffect(() => {
    async function loadProducts() {
      if (!token || !isOpen) return;
      try {
        const res = await fetch('/api/cbd/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProductsList(data.products || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    }
    loadProducts();
  }, [token, isOpen]);

  // Handle edit or initial product state
  useEffect(() => {
    if (editingConsumption) {
      setSelectedProductId(editingConsumption.productId || '');
      setProductName(editingConsumption.productName);
      setBrand(editingConsumption.brand || '');
      setProductType(editingConsumption.productType);
      setConsumptionMethod(editingConsumption.consumptionMethod);
      setQuantity(String(editingConsumption.quantity));
      setQuantityUnit(editingConsumption.quantityUnit);
      setContext(editingConsumption.context || 'evening');
      setSelectedEffects(editingConsumption.subjectiveEffects || []);
      setWellnessRating(editingConsumption.wellnessRating || 4);
      setDate(editingConsumption.date);
      setTime(editingConsumption.time);
      setNotes(editingConsumption.notes || '');
    } else if (initialProductId && productsList.length > 0) {
      const prod = productsList.find((p) => p.id === initialProductId);
      if (prod) {
        setSelectedProductId(prod.id);
        setProductName(prod.name);
        setBrand(prod.brand);
        setProductType(prod.category);
        if (prod.category === 'oil') {
          setConsumptionMethod('sublingual');
          setQuantityUnit('drops');
          setQuantity('3');
        } else if (prod.category === 'infusion') {
          setConsumptionMethod('infusion');
          setQuantityUnit('cups');
          setQuantity('1');
        } else if (prod.category === 'capsule') {
          setConsumptionMethod('ingestion');
          setQuantityUnit('capsules');
          setQuantity('1');
        } else if (prod.category === 'cosmetic') {
          setConsumptionMethod('topical');
          setQuantityUnit('units');
          setQuantity('1');
        }
      }
    } else if (!editingConsumption) {
      // Default reset
      setSelectedProductId('');
      setProductName('Huile CBD 10% Broad Spectrum');
      setBrand('Nexus Botanics Lab');
      setProductType('oil');
      setConsumptionMethod('sublingual');
      setQuantity('3');
      setQuantityUnit('drops');
      setContext('evening');
      setSelectedEffects(['Apaisement mental']);
      setWellnessRating(4);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().substring(0, 5));
      setNotes('');
    }
  }, [editingConsumption, initialProductId, productsList]);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    if (id === 'custom' || id === '') {
      return;
    }
    const found = productsList.find((p) => p.id === id);
    if (found) {
      setProductName(found.name);
      setBrand(found.brand);
      setProductType(found.category);

      if (found.category === 'oil') {
        setConsumptionMethod('sublingual');
        setQuantityUnit('drops');
      } else if (found.category === 'infusion') {
        setConsumptionMethod('infusion');
        setQuantityUnit('cups');
      } else if (found.category === 'capsule') {
        setConsumptionMethod('ingestion');
        setQuantityUnit('capsules');
      } else if (found.category === 'cosmetic') {
        setConsumptionMethod('topical');
        setQuantityUnit('units');
      } else if (found.category === 'flower') {
        setConsumptionMethod('vaporisation');
        setQuantityUnit('g');
      }
    }
  };

  const toggleEffect = (effect: string) => {
    if (selectedEffects.includes(effect)) {
      setSelectedEffects(selectedEffects.filter((e) => e !== effect));
    } else {
      setSelectedEffects([...selectedEffects, effect]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorMessage('Veuillez indiquer le nom du produit.');
      return;
    }
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setErrorMessage('Veuillez indiquer une quantité valide supérieure à 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        productId: selectedProductId && selectedProductId !== 'custom' ? selectedProductId : null,
        productName: productName.trim(),
        brand: brand.trim() || undefined,
        date,
        time,
        productType,
        consumptionMethod,
        quantity: numQty,
        quantityUnit,
        context,
        subjectiveEffects: selectedEffects,
        wellnessRating,
        notes: notes.trim() || undefined,
      };

      const url = editingConsumption ? `/api/cbd/consumptions/${editingConsumption.id}` : '/api/cbd/consumptions';
      const method = editingConsumption ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l’enregistrement');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’enregistrer cette prise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Droplet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingConsumption ? 'Modifier la Prise CBD' : 'Enregistrer une Prise CBD & Bien-Être'}
              </h3>
              <p className="text-xs text-slate-500">
                Suivi d’utilisation, dosage et observation des ressentis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date de la prise</span>
              </label>
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Heure</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          {/* 2. Product Selection */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Choisir un produit de votre armoire ou catalogué :
              </label>
              <span className="text-[11px] text-slate-500">Optionnel</span>
            </div>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="">-- Saisie manuelle ou produit libre --</option>
              {productsList.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name} ({prod.brand}) — {prod.category}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Huile CBD 10% Broad Spectrum"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Marque / Origine</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Nexus Botanics, Alpes CBD..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 3. Category & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Format / Catégorie de produit
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as CBDProductCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mode de consommation
              </label>
              <select
                value={consumptionMethod}
                onChange={(e) => setConsumptionMethod(e.target.value as CBDConsumptionMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Quantité prise *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Unité de mesure
              </label>
              <select
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value as CBDQuantityUnit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Context */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contexte de la prise
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONTEXTS.map((ctx) => {
                const isSelected = context === ctx.value;
                return (
                  <button
                    key={ctx.value}
                    type="button"
                    onClick={() => setContext(ctx.value)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{ctx.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Subjective Effects */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Effets & ressentis subjectifs observés :
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTIVE_EFFECTS.map((eff) => {
                const isChecked = selectedEffects.includes(eff);
                return (
                  <button
                    key={eff}
                    type="button"
                    onClick={() => toggleEffect(eff)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                      isChecked
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {eff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Wellness rating 1-5 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Satisfaction globale & confort ressenti :
              </label>
              <span className="text-xs font-black text-emerald-700">{wellnessRating} / 5</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWellnessRating(val)}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    wellnessRating === val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {val === 1 && '1 • Faible'}
                  {val === 2 && '2 • Discret'}
                  {val === 3 && '3 • Moyen'}
                  {val === 4 && '4 • Confort'}
                  {val === 5 && '5 • Optimal'}
                </button>
              ))}
            </div>
          </div>

          {/* 8. Personal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notes personnelles libres
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pris 30 minutes avant de lire, bonne détente cervicale..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Les ressentis enregistrés servent uniquement à observer vos habitudes et vos moments de calme. Le CBD ne constitue pas un médicament.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : editingConsumption ? 'Enregistrer les modifications' : 'Valider cette prise'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
