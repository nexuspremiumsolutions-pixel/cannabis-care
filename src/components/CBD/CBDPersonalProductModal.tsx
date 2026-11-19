import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CBDProduct, CBDProductCategory } from '../../types/entities';
import { X, Plus, Package, Check, Info, AlertTriangle } from 'lucide-react';

interface CBDPersonalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingProduct?: CBDProduct | null;
}

const CATEGORIES: { value: CBDProductCategory; label: string }[] = [
  { value: 'oil', label: 'Huile / Gouttes' },
  { value: 'flower', label: 'Fleurs séchées' },
  { value: 'infusion', label: 'Infusion / Tisane' },
  { value: 'capsule', label: 'Gélules / Capsules' },
  { value: 'edible', label: 'Aliments / Gummies' },
  { value: 'beverage', label: 'Boisson' },
  { value: 'vape', label: 'Vaporisation / E-liquide' },
  { value: 'cosmetic', label: 'Baume / Cosmétique' },
  { value: 'resin', label: 'Résine' },
  { value: 'extract', label: 'Extrait / Cristaux' },
  { value: 'other', label: 'Autre format' },
];

export const CBDPersonalProductModal: React.FC<CBDPersonalProductModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
}) => {
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<CBDProductCategory>('oil');
  const [description, setDescription] = useState('');
  const [cbdPercentage, setCbdPercentage] = useState<string>('10');
  const [thcPercentage, setThcPercentage] = useState<string>('0.0');
  const [volumeOrWeight, setVolumeOrWeight] = useState('10ml');
  const [countryOfOrigin, setCountryOfOrigin] = useState('France');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setBrand(editingProduct.brand);
      setCategory(editingProduct.category);
      setDescription(editingProduct.description || '');
      setCbdPercentage(editingProduct.cbdPercentage !== null && editingProduct.cbdPercentage !== undefined ? String(editingProduct.cbdPercentage) : '');
      setThcPercentage(editingProduct.thcPercentage !== null && editingProduct.thcPercentage !== undefined ? String(editingProduct.thcPercentage) : '0.0');
      setVolumeOrWeight(editingProduct.volumeOrWeight || '');
      setCountryOfOrigin(editingProduct.countryOfOrigin || 'France');
      setBarcode(editingProduct.barcode || '');
      setNotes('');
    } else {
      setName('');
      setBrand('');
      setCategory('oil');
      setDescription('');
      setCbdPercentage('10');
      setThcPercentage('0.0');
      setVolumeOrWeight('10ml');
      setCountryOfOrigin('France');
      setBarcode('');
      setNotes('');
    }
  }, [editingProduct, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setErrorMessage('Le nom et la marque sont obligatoires.');
      return;
    }

    const parsedThc = parseFloat(thcPercentage) || 0;
    if (parsedThc > 0.3) {
      setErrorMessage('Le taux de THC doit être inférieur ou égal à 0.3% selon la réglementation.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: name.trim(),
        brand: brand.trim(),
        category,
        description: description.trim() || undefined,
        cbdPercentage: cbdPercentage ? parseFloat(cbdPercentage) : null,
        thcPercentage: parsedThc,
        volumeOrWeight: volumeOrWeight.trim() || undefined,
        countryOfOrigin: countryOfOrigin.trim() || undefined,
        barcode: barcode.trim() || null,
        notes: notes.trim() || undefined,
      };

      const url = editingProduct ? `/api/cbd/products/${editingProduct.id}` : '/api/cbd/products';
      const method = editingProduct ? 'PUT' : 'POST';

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
        throw new Error(data.error || 'Erreur lors de l’enregistrement du produit.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’enregistrer le produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Modifier mon produit' : 'Ajouter un produit personnel'}
              </h3>
              <p className="text-xs text-slate-500">
                Enregistrez vos références habituelles dans votre armoire
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nom du produit *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Huile Sommeil 10% CBD + CBN"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Marque / Fabricant *</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Mon Herboristerie"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Format / Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CBDProductCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Taux CBD (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={cbdPercentage}
                onChange={(e) => setCbdPercentage(e.target.value)}
                placeholder="10"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Taux THC (≤ 0.3%)</label>
              <input
                type="number"
                step="0.01"
                max="0.3"
                min="0"
                value={thcPercentage}
                onChange={(e) => setThcPercentage(e.target.value)}
                placeholder="0.0"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Volume / Poids</label>
              <input
                type="text"
                value={volumeOrWeight}
                onChange={(e) => setVolumeOrWeight(e.target.value)}
                placeholder="10ml, 50g..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Code-barres EAN (Optionnel)</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Ex: 3760123456789"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Saveur menthe, utilisé pour la routine du soir..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Ajouter le produit'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
