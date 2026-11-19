import React from 'react';
import { useCart } from '../../context/CartContext';
import {
  X,
  ShoppingBag,
  Store,
  Truck,
  MapPin,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  Tag,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeItem,
    clearCart,
    openCheckoutModal,
    isLoading,
    applyCoupon,
    removeCoupon,
    isApplyingCoupon,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = React.useState('');
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = React.useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponError(null);
    setCouponSuccess(null);

    const res = await applyCoupon(couponCodeInput.trim());
    if (res.success) {
      setCouponSuccess(`Code « ${couponCodeInput.trim().toUpperCase()} » appliqué avec succès !`);
      setCouponCodeInput('');
    } else {
      setCouponError(res.error || 'Impossible d’appliquer ce code promo.');
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    await removeCoupon();
  };

  if (!isCartDrawerOpen) return null;

  const groups = cart?.groups || [];
  const hasItems = groups.length > 0 && (cart?.totalItemsCount || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Mon Panier Multi-Boutiques
                {cart && cart.totalItemsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-bold">
                    {cart.totalItemsCount}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">Dispatch direct & traçabilité phytocannabique</p>
            </div>
          </div>
          <button
            onClick={closeCartDrawer}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {!hasItems ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">Votre panier est vide</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Explorez notre réseau de boutiques et laboratoires certifiés pour ajouter des extraits et soins légaux testés en laboratoire.
                </p>
              </div>
              <button
                onClick={closeCartDrawer}
                className="px-5 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition shadow-xs cursor-pointer"
              >
                Découvrir le catalogue
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Multi-Shop Explanatory Banner */}
              {groups.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-teal-950 leading-relaxed">
                    <strong className="font-bold">Commande groupée ({groups.length} boutiques partenaires) :</strong> Vos articles sont conditionnés et expédiés directement par chaque établissement certifié pour garantir fraîcheur et traçabilité.
                  </div>
                </div>
              )}

              {/* Grouped by Shop */}
              {groups.map((group) => {
                const subtotal = group.subtotal;
                const freeThreshold = group.freeDeliveryThreshold || 50;
                const remainingForFree = Math.max(0, freeThreshold - subtotal);
                const progressPct = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

                return (
                  <div
                    key={group.shopId}
                    className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                  >
                    {/* Shop Group Header */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                          <Store className="w-4 h-4 text-teal-200" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{group.shopName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {group.shopCity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {group.selectedFulfillmentMethod === 'PICKUP' ? 'Retrait boutique' : 'Expédition colis'}
                        </span>
                      </div>
                    </div>

                    {/* Free shipping progress indicator if delivery available */}
                    {group.deliveryAvailable && group.freeDeliveryThreshold && (
                      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 text-[11px]">
                        <div className="flex justify-between items-center text-slate-600 mb-1">
                          {remainingForFree > 0 ? (
                            <span>Plus que <strong>{remainingForFree.toFixed(2)} €</strong> pour la livraison offerte</span>
                          ) : (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Livraison offerte atteinte !
                            </span>
                          )}
                          <span className="font-semibold text-slate-700">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${remainingForFree === 0 ? 'bg-emerald-600' : 'bg-teal-600'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Items List in this group */}
                    <div className="divide-y divide-slate-100 p-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="p-3 flex items-center gap-3">
                          {item.productImageSnapshot ? (
                            <img
                              src={item.productImageSnapshot}
                              alt={item.productNameSnapshot}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-6 h-6 text-slate-300" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {item.productNameSnapshot}
                            </h5>
                            <div className="text-[11px] text-slate-500">
                              {item.unitPriceSnapshot.toFixed(2)} € / unité
                            </div>
                            <div className="text-xs font-extrabold text-teal-900 mt-1">
                              {item.subtotal.toFixed(2)} €
                            </div>
                          </div>

                          {/* Stepper Controls */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 rounded-xl p-1 border border-slate-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={isLoading}
                              className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                              title="Diminuer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={isLoading || item.quantity >= item.stockSnapshot}
                              className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                              title="Augmenter"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Retirer l'article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Shop Subtotal Footer */}
                    <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Sous-total boutique :</span>
                      <span className="font-bold text-slate-900">{group.subtotal.toFixed(2)} €</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {hasItems && (
          <div className="p-5 border-t border-slate-200 bg-white space-y-4">
            {/* Module 15: Code Promo / Coupon Form */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Code promotionnel
                </span>
                {cart?.appliedCouponCode && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Offre active
                  </span>
                )}
              </div>

              {cart?.appliedCouponCode ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-900 font-mono tracking-wider">
                      {cart.appliedCouponCode}
                    </span>
                    {cart.promotionSnapshot?.promotionName && (
                      <span className="block text-[10px] text-emerald-700 font-medium">
                        {cart.promotionSnapshot.promotionName}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={isApplyingCoupon}
                    className="p-1 rounded-md text-emerald-700 hover:text-rose-700 hover:bg-emerald-100 transition cursor-pointer text-xs font-bold"
                    title="Retirer le code promo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder="Ex: PRINTEMPS20, BIENVENUE10"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs uppercase font-mono tracking-wider focus:outline-hidden focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon || !couponCodeInput.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isApplyingCoupon ? '...' : 'Appliquer'}
                  </button>
                </form>
              )}

              {couponError && (
                <div className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
              {couponSuccess && (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{couponSuccess}</span>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-slate-900">{cart?.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Estimation livraison :
                </span>
                <span className="font-semibold text-slate-900">
                  {cart?.deliveryTotal === 0 ? (
                    <span className="text-emerald-700 font-bold">Gratuite</span>
                  ) : (
                    `${cart?.deliveryTotal.toFixed(2)} €`
                  )}
                </span>
              </div>

              {(cart?.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Réduction promotionnelle :
                  </span>
                  <span>-{cart?.discountTotal.toFixed(2)} €</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">Total estimé :</span>
                <span className="text-lg font-black text-teal-900">{cart?.grandTotal.toFixed(2)} €</span>
              </div>
            </div>

            {/* Legal / Assurance Guarantees */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Analyses certifiées &lt; 0.3% THC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Paiement sécurisé chiffré</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={clearCart}
                disabled={isLoading}
                className="py-3 px-3.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 text-xs font-bold transition cursor-pointer"
                title="Vider le panier"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={openCheckoutModal}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Finaliser la commande ({cart?.grandTotal.toFixed(2)} €)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
