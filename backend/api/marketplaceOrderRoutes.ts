import { Router, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../auth/auth';
import { isPlatformAdmin, canManageShop } from './marketplaceRoutes';
import { OrderDispatchService, roundCurrency } from '../services/orderDispatchService';
import { PaymentProviderRegistry, StripeMarketplaceProvider } from '../services/payment/paymentProviderAdapter';
import { DeliveryAdapters } from '../services/communication/deliveryAdapters';
import {
  UserRole,
  GlobalOrder,
  ShopOrder,
  MarketplaceOrderItem,
  FulfillmentMethod,
  ShopOrderStatus,
  GlobalOrderStatus,
} from '../../src/types/entities';

const router = Router();

// ============================================================================
// 1. GLOBAL CART ENDPOINTS
// ============================================================================

/**
 * GET /api/marketplace/cart
 * Retrieves the current authenticated user's cart (or creates one)
 */
router.get('/cart', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = OrderDispatchService.getOrCreateCart(userId);
    return res.json({ success: true, cart });
  } catch (err: any) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du panier.' });
  }
});

/**
 * POST /api/marketplace/cart/items
 * Adds a product to the user's cart with server-side stock & shop checks
 */
router.post('/cart/items', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Le champ productId est requis.' });
    }

    const result = OrderDispatchService.addItem(userId, productId, Number(quantity));
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Article ajouté au panier avec succès.',
      cart: result.cart,
      item: result.item,
    });
  } catch (err: any) {
    console.error('Error adding item to cart:', err);
    return res.status(500).json({ error: 'Erreur lors de l’ajout au panier.' });
  }
});

/**
 * PATCH /api/marketplace/cart/items/:itemId
 * Updates item quantity
 */
router.patch('/cart/items/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ error: 'Quantité invalide.' });
    }

    const result = OrderDispatchService.updateQuantity(userId, itemId, Number(quantity));
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      cart: result.cart,
    });
  } catch (err: any) {
    console.error('Error updating cart item:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la quantité.' });
  }
});

/**
 * DELETE /api/marketplace/cart/items/:itemId
 * Removes an item from the cart
 */
router.delete('/cart/items/:itemId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    const result = OrderDispatchService.removeItem(userId, itemId);
    return res.json({
      success: true,
      message: 'Article retiré du panier.',
      cart: result.cart,
    });
  } catch (err: any) {
    console.error('Error removing cart item:', err);
    return res.status(500).json({ error: 'Erreur lors du retrait de l’article.' });
  }
});

/**
 * DELETE /api/marketplace/cart
 * Clears the user's cart completely
 */
router.delete('/cart', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    OrderDispatchService.clearCart(userId);
    const updatedCart = OrderDispatchService.getOrCreateCart(userId);
    return res.json({
      success: true,
      message: 'Panier vidé.',
      cart: updatedCart,
    });
  } catch (err: any) {
    console.error('Error clearing cart:', err);
    return res.status(500).json({ error: 'Erreur lors du vidage du panier.' });
  }
});

/**
 * POST /api/marketplace/cart/validate
 * Validates the cart ahead of checkout (checks real-time stock, shop status, price drift)
 */
router.post('/cart/validate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = OrderDispatchService.validateCartForCheckout(userId);
    return res.json({
      success: validation.isValid,
      isValid: validation.isValid,
      warnings: validation.warnings,
      errors: validation.errors,
      cart: validation.cart,
    });
  } catch (err: any) {
    console.error('Error validating cart:', err);
    return res.status(500).json({ error: 'Erreur lors de la validation du panier.' });
  }
});

// ============================================================================
// 2. CHECKOUT & ORDER DISPATCH ENGINE
// ============================================================================

/**
 * POST /api/marketplace/checkout/create-payment-intent
 * Calculates exact cart total server-side and creates a real Stripe PaymentIntent.
 */
router.post('/checkout/create-payment-intent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email || 'client@nexus-cannabis-care.fr';
    const { shopFulfillments = [] } = req.body;

    const validation = OrderDispatchService.validateCartForCheckout(userId);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const fulfillmentMap: Record<string, FulfillmentMethod> = {};
    for (const sf of shopFulfillments) {
      if (sf?.shopId && sf?.fulfillmentMethod) {
        fulfillmentMap[sf.shopId] = sf.fulfillmentMethod;
      }
    }

    const cart = OrderDispatchService.calculateCart(userId, fulfillmentMap);

    if (cart.grandTotal <= 0) {
      return res.json({
        success: true,
        requiresPayment: false,
        amount: 0,
        currency: cart.currency || 'EUR',
      });
    }

    const provider = PaymentProviderRegistry.getProvider('STRIPE_CONNECT') as StripeMarketplaceProvider;
    if (!provider.isRealStripeConfigured()) {
      return res.status(503).json({
        error: 'Le service de paiement Stripe n’est pas configuré côté serveur.',
      });
    }

    const pi = await provider.createPaymentIntent({
      amount: cart.grandTotal,
      currency: cart.currency || 'EUR',
      orderId: `cart_${cart.id}`,
      customerId: userId,
      customerEmail: userEmail,
      description: `Commande Cannabis Care Marketplace (${cart.totalItemsCount} article(s))`,
      metadata: {
        userId,
        cartId: cart.id,
        itemsCount: String(cart.totalItemsCount),
        shopsCount: String(cart.groups.length),
      },
    });

    return res.json({
      success: true,
      requiresPayment: true,
      clientSecret: pi.clientSecret,
      paymentIntentId: pi.transactionId,
      amount: pi.amount,
      currency: pi.currency,
      publishableKey: provider.getPublishableKey(),
      mode: provider.isLiveMode() ? 'live' : 'test',
    });
  } catch (err: any) {
    console.error('Error creating marketplace PaymentIntent:', err);
    return res.status(500).json({
      error: err.message || 'Impossible d’initialiser le paiement sécurisé Stripe.',
    });
  }
});

/**
 * POST /api/marketplace/checkout/dispatch
 * Verifies real Stripe PaymentIntent server-side (when total > 0), atomically validates cart,
 * groups by partner shop, calculates commissions, generates GlobalOrder + ShopOrders + OrderItems,
 * decrements stock, and clears cart.
 */
router.post('/checkout/dispatch', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email || 'client@nexus-cannabis-care.fr';
    const userName = (req.user as any)?.nickname || 'Client Nexus';

    const {
      billingAddress,
      shippingAddress,
      shopFulfillments = [],
      paymentMethod = 'STRIPE_CARD',
      paymentIntentId,
    } = req.body;

    if (!billingAddress || !billingAddress.fullName || !billingAddress.address || !billingAddress.city) {
      return res.status(400).json({ error: 'Adresse de facturation incomplète.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ error: 'Adresse de livraison incomplète.' });
    }

    // Recompute authoritative cart total server-side
    const fulfillmentMap: Record<string, FulfillmentMethod> = {};
    for (const sf of shopFulfillments) {
      if (sf?.shopId && sf?.fulfillmentMethod) {
        fulfillmentMap[sf.shopId] = sf.fulfillmentMethod;
      }
    }
    const cart = OrderDispatchService.calculateCart(userId, fulfillmentMap);

    let verifiedTxId: string | undefined = undefined;
    const provider = PaymentProviderRegistry.getProvider('STRIPE_CONNECT') as StripeMarketplaceProvider;

    if (cart.grandTotal > 0 && provider.isRealStripeConfigured()) {
      if (!paymentIntentId || typeof paymentIntentId !== 'string') {
        return res.status(400).json({
          error: 'Paiement Stripe requis avant la confirmation de la commande.',
        });
      }

      // Replay protection: ensure this PaymentIntent has not already been used for another order
      const existingOrders = db.get('globalOrders') || [];
      if (existingOrders.some((o) => o.paymentTransactionId === paymentIntentId)) {
        return res.status(409).json({
          error: 'Ce paiement Stripe a déjà été utilisé pour une commande.',
        });
      }

      const verifiedPi = await provider.retrievePaymentIntent(paymentIntentId);
      if (verifiedPi.status !== 'SUCCEEDED' && verifiedPi.status !== 'PROCESSING') {
        return res.status(402).json({
          error: `Le paiement Stripe n’est pas encore validé (statut actuel : ${verifiedPi.status}).`,
        });
      }

      if (verifiedPi.metadata?.userId && verifiedPi.metadata.userId !== userId) {
        return res.status(403).json({
          error: 'Ce paiement ne correspond pas à votre compte utilisateur.',
        });
      }

      if (verifiedPi.amount + 0.01 < cart.grandTotal) {
        return res.status(400).json({
          error: `Montant payé (${verifiedPi.amount.toFixed(2)} €) inférieur au total du panier (${cart.grandTotal.toFixed(2)} €).`,
        });
      }

      verifiedTxId = verifiedPi.transactionId;
    }

    const result = OrderDispatchService.dispatchOrder({
      userId,
      customerName: billingAddress.fullName || userName,
      customerEmail: userEmail,
      customerPhone: billingAddress.phone || shippingAddress.phone,
      billingAddress,
      shippingAddress,
      shopFulfillments,
      paymentMethod,
      paymentTransactionId: verifiedTxId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Dispatch transactional order confirmation email asynchronously
    if (result.globalOrder) {
      void DeliveryAdapters.deliver('EMAIL', {
        notificationId: `order_conf_${result.globalOrder.id}`,
        userId,
        recipientAddress: userEmail,
        subject: `CANNABIS CARE — Confirmation de commande ${result.globalOrder.orderNumber}`,
        title: `Commande ${result.globalOrder.orderNumber} confirmée`,
        body: `Merci ${billingAddress.fullName || userName} !\nVotre commande d'un montant de ${result.globalOrder.grandTotal.toFixed(
          2
        )} ${result.globalOrder.currency} a bien été réglée et transmise à nos boutiques partenaires certifiées.`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Commande multi-boutiques payée via Stripe et dispatchée avec succès.',
      globalOrder: result.globalOrder,
      shopOrders: result.shopOrders,
      paymentIntent: result.paymentIntent,
    });
  } catch (err: any) {
    console.error('Error dispatching multi-shop order:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors du dispatch de la commande.' });
  }
});

// ============================================================================
// 3. CUSTOMER ORDER TRACKING (MY ORDERS)
// ============================================================================

/**
 * GET /api/marketplace/orders/my-orders
 * Lists all GlobalOrders placed by the authenticated customer
 */
router.get('/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const globalOrders = db.get('globalOrders') || [];
    const myOrders = globalOrders.filter((o) => o.userId === userId);

    return res.json({
      success: true,
      orders: myOrders,
    });
  } catch (err: any) {
    console.error('Error fetching customer orders:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

/**
 * GET /api/marketplace/orders/:globalOrderId
 * Retrieves a single GlobalOrder with its associated ShopOrders and OrderItems
 */
router.get('/orders/:globalOrderId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { globalOrderId } = req.params;

    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((o) => o.id === globalOrderId);

    if (!globalOrder) {
      return res.status(404).json({ error: 'Commande globale introuvable.' });
    }

    // Security check: client can only view their own order unless admin
    const isAdmin = isPlatformAdmin(userRole);
    if (!isAdmin && globalOrder.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé à cette commande.' });
    }

    const allShopOrders = db.get('shopOrders') || [];
    const childShopOrders = allShopOrders.filter((so) => so.globalOrderId === globalOrderId);

    const allItems = db.get('marketplaceOrderItems') || [];
    const orderItems = allItems.filter((it) => it.globalOrderId === globalOrderId);

    // Attach items to their respective ShopOrders
    const enrichedShopOrders = childShopOrders.map((so) => ({
      ...so,
      items: orderItems.filter((it) => it.shopOrderId === so.id),
    }));

    return res.json({
      success: true,
      globalOrder,
      shopOrders: enrichedShopOrders,
      items: orderItems,
    });
  } catch (err: any) {
    console.error('Error fetching global order detail:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du détail de la commande.' });
  }
});

/**
 * POST /api/marketplace/orders/:globalOrderId/cancel
 * Customer cancels their order if no shop has moved to PROCESSING/SHIPPED yet
 */
router.post('/orders/:globalOrderId/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { globalOrderId } = req.params;
    const { reason = 'Annulation demandée par le client' } = req.body;

    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((o) => o.id === globalOrderId);

    if (!globalOrder) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    if (globalOrder.userId !== userId && !isPlatformAdmin(req.user!.role)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const shopOrders = db.get('shopOrders') || [];
    const childShopOrders = shopOrders.filter((so) => so.globalOrderId === globalOrderId);

    // Check if any shop order is already shipped or delivered
    const nonCancellable = childShopOrders.find((so) => so.status === 'SHIPPED' || so.status === 'DELIVERED' || so.status === 'COMPLETED');
    if (nonCancellable) {
      return res.status(400).json({
        error: `Impossible d'annuler : une partie de votre commande a déjà été expédiée ou livrée par ${nonCancellable.shopNameSnapshot}.`,
      });
    }

    // Issue real Stripe refund if order was paid with a genuine Stripe PaymentIntent
    if (
      globalOrder.paymentStatus === 'PAID' &&
      globalOrder.grandTotal > 0 &&
      globalOrder.paymentTransactionId &&
      globalOrder.paymentTransactionId.startsWith('pi_') &&
      !globalOrder.paymentTransactionId.startsWith('pi_stripe_')
    ) {
      const provider = PaymentProviderRegistry.getProvider('STRIPE_CONNECT') as StripeMarketplaceProvider;
      if (provider.isRealStripeConfigured()) {
        await provider.createRefund({
          transactionId: globalOrder.paymentTransactionId,
          orderId: globalOrder.id,
          amount: globalOrder.grandTotal,
          currency: globalOrder.currency || 'EUR',
          reason,
        });
      }
    }

    const nowIso = new Date().toISOString();

    // Cancel all child shop orders and re-stock products
    const allProducts = db.get('marketplaceProducts') || [];
    const allItems = db.get('marketplaceOrderItems') || [];

    for (const so of childShopOrders) {
      so.status = 'CANCELLED';
      so.updatedAt = nowIso;
      so.statusTimeline.push({
        status: 'CANCELLED',
        timestamp: nowIso,
        note: reason,
        author: 'Client',
      });

      // Re-stock items
      const itemsForShop = allItems.filter((it) => it.shopOrderId === so.id);
      for (const item of itemsForShop) {
        const prod = allProducts.find((p) => p.id === item.productId);
        if (prod) {
          prod.stockQuantity += item.quantity;
          if (prod.stockQuantity > 0 && prod.stockStatus === 'OUT_OF_STOCK') {
            prod.stockStatus = 'IN_STOCK';
          }
          prod.updatedAt = nowIso;
        }
      }
    }

    globalOrder.status = 'CANCELLED';
    globalOrder.paymentStatus = 'REFUNDED';
    globalOrder.updatedAt = nowIso;

    if (globalOrder.shopOrdersSummary) {
      globalOrder.shopOrdersSummary.forEach((s) => {
        s.status = 'CANCELLED';
      });
    }

    db.save();

    return res.json({
      success: true,
      message: 'Commande annulée avec succès, remboursement déclenché et stocks réapprovisionnés.',
      globalOrder,
    });
  } catch (err: any) {
    console.error('Error cancelling global order:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors de l’annulation de la commande.' });
  }
});

// ============================================================================
// 4. PARTNER SPACE ORDER MANAGEMENT (/partner/shops/:shopId/orders)
// ============================================================================

/**
 * GET /api/marketplace/partner/shops/:shopId/orders
 * Retrieves all orders belonging strictly to that partner shop (IDOR protected)
 */
router.get('/partner/shops/:shopId/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = OrderDispatchService.getShopOrders(shopId, userId, userRole);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    return res.json({
      success: true,
      shopId,
      orders: result.orders,
    });
  } catch (err: any) {
    console.error('Error fetching partner shop orders:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des commandes de la boutique.' });
  }
});

/**
 * GET /api/marketplace/partner/shops/:shopId/orders/:shopOrderId
 * Retrieves full details for a single shop order (IDOR protected)
 */
router.get('/partner/shops/:shopId/orders/:shopOrderId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId, shopOrderId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!canManageShop(req.user, shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé à cette boutique.' });
    }

    const shopOrders = db.get('shopOrders') || [];
    const shopOrder = shopOrders.find((so) => so.id === shopOrderId && so.shopId === shopId);

    if (!shopOrder) {
      return res.status(404).json({ error: 'Commande boutique introuvable.' });
    }

    const allItems = db.get('marketplaceOrderItems') || [];
    const items = allItems.filter((it) => it.shopOrderId === shopOrderId);

    // Retrieve parent global order for general customer details
    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((go) => go.id === shopOrder.globalOrderId);

    return res.json({
      success: true,
      shopOrder: {
        ...shopOrder,
        items,
      },
      customer: {
        name: globalOrder?.customerName,
        email: globalOrder?.customerEmail,
        phone: globalOrder?.customerPhone,
      },
      parentOrder: {
        id: globalOrder?.id,
        orderNumber: globalOrder?.orderNumber,
        status: globalOrder?.status,
        createdAt: globalOrder?.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Error fetching shop order detail:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la commande.' });
  }
});

/**
 * PATCH /api/marketplace/partner/shops/:shopId/orders/:shopOrderId/status
 * Updates shop order status (e.g. ACCEPTED, PROCESSING, READY, SHIPPED, COMPLETED)
 */
router.patch('/partner/shops/:shopId/orders/:shopOrderId/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId, shopOrderId } = req.params;
    const { status, trackingNumber, carrierName, note } = req.body;

    const validStatuses: ShopOrderStatus[] = [
      'PENDING',
      'ACCEPTED',
      'PROCESSING',
      'READY',
      'SHIPPED',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs possibles: ${validStatuses.join(', ')}` });
    }

    const result = OrderDispatchService.updateShopOrderStatus({
      shopId,
      shopOrderId,
      userId: req.user!.id,
      userRole: req.user!.role,
      newStatus: status,
      trackingNumber,
      carrierName,
      note,
    });

    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès.',
      shopOrder: result.shopOrder,
      globalOrderStatus: result.globalOrderStatus,
    });
  } catch (err: any) {
    console.error('Error updating shop order status:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
  }
});

// ============================================================================
// 5. ADMIN NEXUS MARKETPLACE SUPERVISION
// ============================================================================

/**
 * GET /api/marketplace/admin/orders
 * Returns all GlobalOrders and ShopOrders across the entire platform
 */
router.get('/admin/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user!.role)) {
      return res.status(403).json({ error: 'Réservé aux administrateurs Nexus.' });
    }

    const {
      status,
      shopId,
      search,
      multiShopOnly,
      limit = 50,
      offset = 0,
    } = req.query;

    let globalOrders = db.get('globalOrders') || [];
    const allShopOrders = db.get('shopOrders') || [];

    // Filter by status
    if (status && status !== 'ALL') {
      globalOrders = globalOrders.filter((go) => go.status === status);
    }

    // Filter by multi-shop
    if (multiShopOnly === 'true') {
      globalOrders = globalOrders.filter((go) => go.shopOrdersCount > 1);
    }

    // Filter by shopId
    if (shopId && shopId !== 'ALL') {
      const matchingGlobalOrderIds = new Set(
        allShopOrders.filter((so) => so.shopId === shopId).map((so) => so.globalOrderId)
      );
      globalOrders = globalOrders.filter((go) => matchingGlobalOrderIds.has(go.id));
    }

    // Search by orderNumber or customer
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      globalOrders = globalOrders.filter(
        (go) =>
          go.orderNumber.toLowerCase().includes(q) ||
          go.customerName.toLowerCase().includes(q) ||
          go.customerEmail.toLowerCase().includes(q)
      );
    }

    const totalCount = globalOrders.length;
    const paginatedOrders = globalOrders.slice(Number(offset), Number(offset) + Number(limit));

    return res.json({
      success: true,
      totalCount,
      orders: paginatedOrders,
    });
  } catch (err: any) {
    console.error('Error fetching admin orders:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des commandes d’administration.' });
  }
});

/**
 * GET /api/marketplace/admin/orders/metrics
 * Comprehensive financial and fulfillment KPIs for Nexus Platform Administration
 */
router.get('/admin/orders/metrics', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user!.role)) {
      return res.status(403).json({ error: 'Réservé aux administrateurs Nexus.' });
    }

    const metrics = OrderDispatchService.getAdminMetrics();
    return res.json({
      success: true,
      metrics,
    });
  } catch (err: any) {
    console.error('Error fetching admin metrics:', err);
    return res.status(500).json({ error: 'Erreur lors du calcul des indicateurs de commande.' });
  }
});

/**
 * PATCH /api/marketplace/admin/orders/:globalOrderId/status
 * Administrative override for global order status
 */
router.patch('/admin/orders/:globalOrderId/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user!.role)) {
      return res.status(403).json({ error: 'Réservé aux administrateurs Nexus.' });
    }

    const { globalOrderId } = req.params;
    const { status, note } = req.body;

    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((go) => go.id === globalOrderId);

    if (!globalOrder) {
      return res.status(404).json({ error: 'Commande globale introuvable.' });
    }

    globalOrder.status = status as GlobalOrderStatus;
    globalOrder.updatedAt = new Date().toISOString();
    db.save();

    return res.json({
      success: true,
      message: 'Statut de la commande mis à jour administrativement.',
      globalOrder,
    });
  } catch (err: any) {
    console.error('Error overriding admin order status:', err);
    return res.status(500).json({ error: 'Erreur administrative.' });
  }
});

/**
 * POST /api/marketplace/admin/orders/:shopOrderId/refund
 * Administrative partial or full refund for a specific shop order
 */
router.post('/admin/orders/:shopOrderId/refund', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user!.role)) {
      return res.status(403).json({ error: 'Réservé aux administrateurs Nexus.' });
    }

    const { shopOrderId } = req.params;
    const { reason = 'Remboursement accordé par l’administration' } = req.body;

    const shopOrders = db.get('shopOrders') || [];
    const shopOrder = shopOrders.find((so) => so.id === shopOrderId);

    if (!shopOrder) {
      return res.status(404).json({ error: 'Sous-commande boutique introuvable.' });
    }

    const nowIso = new Date().toISOString();
    shopOrder.status = 'REFUNDED';
    shopOrder.updatedAt = nowIso;
    shopOrder.statusTimeline.push({
      status: 'REFUNDED',
      timestamp: nowIso,
      note: reason,
      author: 'Nexus Platform Admin',
    });

    // Update parent global order status
    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((go) => go.id === shopOrder.globalOrderId);
    if (globalOrder) {
      globalOrder.status = 'PARTIALLY_REFUNDED';
      globalOrder.updatedAt = nowIso;
      if (globalOrder.shopOrdersSummary) {
        const itemInSummary = globalOrder.shopOrdersSummary.find((s) => s.shopOrderId === shopOrderId);
        if (itemInSummary) itemInSummary.status = 'REFUNDED';
      }
    }

    db.save();

    return res.json({
      success: true,
      message: 'Remboursement de la sous-commande enregistré.',
      shopOrder,
      globalOrder,
    });
  } catch (err: any) {
    console.error('Error processing refund:', err);
    return res.status(500).json({ error: 'Erreur lors du traitement du remboursement.' });
  }
});

export default router;
