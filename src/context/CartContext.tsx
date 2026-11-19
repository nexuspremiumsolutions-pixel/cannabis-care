import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  GlobalCartModel,
  CartItemModel,
  FulfillmentMethod,
  GlobalOrder,
  ShopOrder,
  OrderAddressSnapshot,
} from '../types/entities';

interface CartContextType {
  cart: GlobalCartModel | null;
  totalItemsCount: number;
  isLoading: boolean;
  isCartDrawerOpen: boolean;
  isCheckoutModalOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  openCheckoutModal: () => void;
  closeCheckoutModal: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  dispatchCheckout: (params: {
    billingAddress: OrderAddressSnapshot;
    shippingAddress: OrderAddressSnapshot;
    shopFulfillments: {
      shopId: string;
      fulfillmentMethod: FulfillmentMethod;
      customerNote?: string;
    }[];
    paymentMethod?: string;
    paymentIntentId?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    globalOrder?: GlobalOrder;
    shopOrders?: ShopOrder[];
  }>;
  activeOrderToView: GlobalOrder | null;
  setActiveOrderToView: (order: GlobalOrder | null) => void;
  // Module 15: Promotions & Coupons
  applyCoupon: (couponCode: string) => Promise<{ success: boolean; error?: string; snapshot?: any }>;
  removeCoupon: () => Promise<{ success: boolean }>;
  isApplyingCoupon: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<GlobalCartModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [activeOrderToView, setActiveOrderToView] = useState<GlobalOrder | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  const refreshCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/marketplace/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCart(data.cart || null);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1): Promise<{ success: boolean; error?: string }> => {
    if (!token) {
      return { success: false, error: 'Veuillez vous connecter pour ajouter des articles au panier.' };
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/marketplace/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de l’ajout au panier.' };
      }

      setCart(data.cart);
      setIsCartDrawerOpen(true);
      return { success: true };
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      return { success: false, error: err.message || 'Erreur de connexion.' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Non authentifié.' };

    try {
      setIsLoading(true);
      const res = await fetch(`/api/marketplace/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la mise à jour.' };
      }

      setCart(data.cart);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Non authentifié.' };

    try {
      setIsLoading(true);
      const res = await fetch(`/api/marketplace/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors du retrait.' };
      }

      setCart(data.cart);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async (): Promise<void> => {
    if (!token) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/marketplace/cart', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const dispatchCheckout = async (params: {
    billingAddress: OrderAddressSnapshot;
    shippingAddress: OrderAddressSnapshot;
    shopFulfillments: {
      shopId: string;
      fulfillmentMethod: FulfillmentMethod;
      customerNote?: string;
    }[];
    paymentMethod?: string;
    paymentIntentId?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    globalOrder?: GlobalOrder;
    shopOrders?: ShopOrder[];
  }> => {
    if (!token) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/marketplace/checkout/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors du paiement et dispatch.' };
      }

      // Refresh cart and let CheckoutModal show the order confirmation screen
      await refreshCart();
      setIsCartDrawerOpen(false);
      if (data.globalOrder) {
        setActiveOrderToView(data.globalOrder);
      }

      return {
        success: true,
        globalOrder: data.globalOrder,
        shopOrders: data.shopOrders,
      };
    } catch (err: any) {
      console.error('Checkout error:', err);
      return { success: false, error: err.message || 'Erreur lors de la finalisation.' };
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (couponCode: string): Promise<{ success: boolean; error?: string; snapshot?: any }> => {
    if (!token) {
      return { success: false, error: 'Veuillez vous connecter pour appliquer un code promo.' };
    }

    try {
      setIsApplyingCoupon(true);
      const res = await fetch('/api/marketing/cart/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ couponCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Code promo non valide.' };
      }

      if (data.cart) {
        setCart(data.cart);
      }
      return { success: true, snapshot: data.snapshot };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau.' };
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = async (): Promise<{ success: boolean }> => {
    if (!token) return { success: false };

    try {
      setIsApplyingCoupon(true);
      const res = await fetch('/api/marketing/cart/remove-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.cart) {
        setCart(data.cart);
      }
      return { success: true };
    } catch (err) {
      console.error('Error removing coupon:', err);
      return { success: false };
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const totalItemsCount = cart?.totalItemsCount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItemsCount,
        isLoading,
        isCartDrawerOpen,
        isCheckoutModalOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        openCheckoutModal: () => {
          setIsCartDrawerOpen(false);
          setIsCheckoutModalOpen(true);
        },
        closeCheckoutModal: () => setIsCheckoutModalOpen(false),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        dispatchCheckout,
        activeOrderToView,
        setActiveOrderToView,
        applyCoupon,
        removeCoupon,
        isApplyingCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
