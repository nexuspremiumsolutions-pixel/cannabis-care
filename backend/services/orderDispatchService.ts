import { db } from '../db/database';
import {
  GlobalCartModel,
  CartItemModel,
  ShopCartGroup,
  GlobalOrder,
  ShopOrder,
  MarketplaceOrderItem,
  PaymentIntent,
  FulfillmentMethod,
  GlobalOrderStatus,
  ShopOrderStatus,
  OrderAddressSnapshot,
  PartnerShop,
  CBDMarketplaceProduct,
  MarketplaceCommissionRule,
  UserRole,
} from '../../src/types/entities';
import { FinancialEngineService } from './payment/financialEngineService';
import { PartnerFinancialService } from './payment/partnerFinancialService';
import { LogisticsService } from './logistics/logisticsService';
import { PromotionEligibilityService } from './marketing/promotionEligibilityService';
import { MarketingAttributionService } from './marketing/marketingAttributionService';

// Precise currency rounding to avoid floating-point errors
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Generate human-friendly sequential-style order numbers
export function generateOrderNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `#${prefix}-${year}-${randomPart}`;
}

export class OrderDispatchService {
  /**
   * Helper to retrieve or initialize a user's active cart
   */
  public static getOrCreateCart(userId: string): GlobalCartModel {
    const carts = db.get('marketplaceCarts') || [];
    let cart = carts.find((c) => c.userId === userId);

    if (!cart) {
      cart = {
        id: `cart_${userId}_${Date.now()}`,
        userId,
        items: [],
        groups: [],
        totalItemsCount: 0,
        subtotal: 0,
        deliveryTotal: 0,
        grandTotal: 0,
        currency: 'EUR',
        updatedAt: new Date().toISOString(),
      };
      carts.push(cart);
      db.save();
    }

    return this.calculateCart(userId);
  }

  /**
   * Recalculates cart items, verifies product and shop freshness,
   * groups by shop, and computes subtotals and delivery fees.
   */
  public static calculateCart(
    userId: string,
    fulfillmentSelections?: Record<string, FulfillmentMethod>
  ): GlobalCartModel {
    const carts = db.get('marketplaceCarts') || [];
    let cart = carts.find((c) => c.userId === userId);

    if (!cart) {
      cart = {
        id: `cart_${userId}_${Date.now()}`,
        userId,
        items: [],
        groups: [],
        totalItemsCount: 0,
        subtotal: 0,
        deliveryTotal: 0,
        grandTotal: 0,
        currency: 'EUR',
        updatedAt: new Date().toISOString(),
      };
      carts.push(cart);
    }

    const allProducts = db.get('marketplaceProducts') || [];
    const allShops = db.get('partnerShops') || [];

    // Filter out items where product or shop no longer exists
    const validItems: CartItemModel[] = [];

    for (const item of cart.items) {
      const product = allProducts.find((p) => p.id === item.productId);
      const shop = allShops.find((s) => s.id === item.shopId);

      if (product && shop && shop.status === 'ACTIVE' && product.status === 'PUBLISHED') {
        // Refresh snapshots with authoritative current price and stock
        const effectivePrice = product.price;
        const currentStock = product.stockQuantity;
        const boundedQuantity = Math.max(1, Math.min(item.quantity, currentStock > 0 ? currentStock : 1));
        const subtotal = roundCurrency(effectivePrice * boundedQuantity);

        validItems.push({
          ...item,
          shopNameSnapshot: shop.commercialName,
          productNameSnapshot: product.name,
          productImageSnapshot: product.images?.[0],
          unitPriceSnapshot: effectivePrice,
          currency: product.currency || 'EUR',
          stockSnapshot: currentStock,
          quantity: boundedQuantity,
          subtotal,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    cart.items = validItems;

    // Group items by shopId
    const shopMap = new Map<string, CartItemModel[]>();
    for (const item of validItems) {
      const list = shopMap.get(item.shopId) || [];
      list.push(item);
      shopMap.set(item.shopId, list);
    }

    const groups: ShopCartGroup[] = [];
    let totalItemsCount = 0;
    let globalSubtotal = 0;
    let globalDeliveryTotal = 0;

    for (const [shopId, items] of shopMap.entries()) {
      const shop = allShops.find((s) => s.id === shopId);
      const shopName = shop?.commercialName || 'Boutique Partenaire';
      const shopCity = shop?.city || 'France';
      const shopLogo = shop?.logo;
      const pickupAddress = shop ? `${shop.address}, ${shop.postalCode} ${shop.city}` : 'En boutique';

      const deliveryAvailable = shop?.deliveryAvailable ?? true;
      const pickupAvailable = shop?.pickupAvailable ?? true;
      const baseDeliveryFee = shop?.deliveryFee ?? 4.90;
      const freeDeliveryThreshold = shop?.freeDeliveryThreshold ?? 50;
      const estimatedDeliveryDays = shop?.estimatedDeliveryDays ?? '2-4 jours ouvrés';
      const estimatedPickupTime = shop?.estimatedPickupTime ?? 'Prêt sous 2h';

      const itemsCount = items.reduce((sum, it) => sum + it.quantity, 0);
      const subtotal = roundCurrency(items.reduce((sum, it) => sum + it.subtotal, 0));

      // Resolve selected fulfillment method
      let selectedMethod: FulfillmentMethod = 'DELIVERY';
      if (fulfillmentSelections && fulfillmentSelections[shopId]) {
        selectedMethod = fulfillmentSelections[shopId];
      } else if (!deliveryAvailable && pickupAvailable) {
        selectedMethod = 'PICKUP';
      }

      // Calculate delivery fee for this shop
      let deliveryFee = 0;
      if (selectedMethod === 'DELIVERY') {
        if (freeDeliveryThreshold && subtotal >= freeDeliveryThreshold) {
          deliveryFee = 0; // Free shipping threshold met
        } else {
          deliveryFee = baseDeliveryFee;
        }
      }

      const shopTotal = roundCurrency(subtotal + deliveryFee);

      groups.push({
        shopId,
        shopName,
        shopCity,
        shopLogo,
        items,
        itemsCount,
        subtotal,
        deliveryFee,
        freeDeliveryThreshold,
        deliveryAvailable,
        pickupAvailable,
        estimatedDeliveryDays,
        estimatedPickupTime,
        pickupAddress,
        selectedFulfillmentMethod: selectedMethod,
        shopTotal,
      });

      totalItemsCount += itemsCount;
      globalSubtotal = roundCurrency(globalSubtotal + subtotal);
      globalDeliveryTotal = roundCurrency(globalDeliveryTotal + deliveryFee);
    }

    cart.groups = groups;
    cart.totalItemsCount = totalItemsCount;
    cart.subtotal = globalSubtotal;
    cart.deliveryTotal = globalDeliveryTotal;

    // Module 15: Evaluate Applied Coupon & Promotions
    if (cart.appliedCouponCode) {
      const evalResult = PromotionEligibilityService.evaluateCoupon(userId, cart.appliedCouponCode, cart);
      if (evalResult.isValid) {
        cart.discountTotal = roundCurrency(evalResult.discountTotal + evalResult.deliveryDiscountTotal);
        cart.promotionSnapshot = evalResult.snapshot;

        // Apply shop-level discount amounts
        for (const group of cart.groups) {
          const shopDiscount = evalResult.discountPerShop.find((d) => d.shopId === group.shopId);
          if (shopDiscount) {
            group.discountAmount = roundCurrency(shopDiscount.discountAmount + shopDiscount.deliveryDiscountAmount);
            group.appliedPromotionName = evalResult.promotion?.name;
            const netSubtotal = Math.max(0, group.subtotal - shopDiscount.discountAmount);
            const netDelivery = Math.max(0, group.deliveryFee - shopDiscount.deliveryDiscountAmount);
            group.shopTotal = roundCurrency(netSubtotal + netDelivery);
          } else {
            group.discountAmount = 0;
            group.appliedPromotionName = undefined;
          }
        }

        cart.grandTotal = roundCurrency(Math.max(0, globalSubtotal + globalDeliveryTotal - cart.discountTotal));
      } else {
        // Invalid or expired coupon: gracefully detach
        cart.appliedCouponCode = undefined;
        cart.discountTotal = 0;
        cart.promotionSnapshot = undefined;
        for (const group of cart.groups) {
          group.discountAmount = 0;
          group.appliedPromotionName = undefined;
        }
        cart.grandTotal = roundCurrency(globalSubtotal + globalDeliveryTotal);
      }
    } else {
      cart.discountTotal = 0;
      cart.promotionSnapshot = undefined;
      for (const group of cart.groups) {
        group.discountAmount = 0;
        group.appliedPromotionName = undefined;
      }
      cart.grandTotal = roundCurrency(globalSubtotal + globalDeliveryTotal);
    }

    cart.updatedAt = new Date().toISOString();

    db.save();
    return cart;
  }

  /**
   * Module 15: Applies a promotional coupon code to the user's cart
   */
  public static applyCoupon(
    userId: string,
    couponCode: string
  ): { success: boolean; error?: string; cart?: GlobalCartModel; snapshot?: any } {
    const rawCart = this.getOrCreateCart(userId);
    if (!rawCart.items || rawCart.items.length === 0) {
      return { success: false, error: 'Votre panier est vide.' };
    }

    const evalResult = PromotionEligibilityService.evaluateCoupon(userId, couponCode, rawCart);
    if (!evalResult.isValid) {
      return { success: false, error: evalResult.error };
    }

    rawCart.appliedCouponCode = evalResult.coupon?.code;
    db.save();

    // Re-calculate cart with promotion applied
    const updatedCart = this.calculateCart(userId);
    return {
      success: true,
      cart: updatedCart,
      snapshot: evalResult.snapshot,
    };
  }

  /**
   * Module 15: Removes the current coupon code from the user's cart
   */
  public static removeCoupon(userId: string): { success: boolean; cart: GlobalCartModel } {
    const cart = this.getOrCreateCart(userId);
    cart.appliedCouponCode = undefined;
    cart.discountTotal = 0;
    cart.promotionSnapshot = undefined;
    db.save();

    const updatedCart = this.calculateCart(userId);
    return { success: true, cart: updatedCart };
  }

  /**
   * Adds an item to the user's cart with validation
   */
  public static addItem(
    userId: string,
    productId: string,
    quantity: number = 1
  ): { success: boolean; error?: string; cart?: GlobalCartModel; item?: CartItemModel } {
    if (quantity <= 0) {
      return { success: false, error: 'La quantité doit être supérieure à 0.' };
    }

    const allProducts = db.get('marketplaceProducts') || [];
    const product = allProducts.find((p) => p.id === productId);

    if (!product) {
      return { success: false, error: 'Produit introuvable.' };
    }

    if (product.status !== 'PUBLISHED') {
      return { success: false, error: 'Ce produit n’est pas disponible à la vente actuellement.' };
    }

    const allShops = db.get('partnerShops') || [];
    const shop = allShops.find((s) => s.id === product.shopId);

    if (!shop || shop.status !== 'ACTIVE') {
      return { success: false, error: 'La boutique partenaire n’est pas active pour le moment.' };
    }

    if (product.stockQuantity <= 0) {
      return { success: false, error: 'Ce produit est actuellement en rupture de stock.' };
    }

    const carts = db.get('marketplaceCarts') || [];
    let cart = carts.find((c) => c.userId === userId);

    if (!cart) {
      cart = {
        id: `cart_${userId}_${Date.now()}`,
        userId,
        items: [],
        groups: [],
        totalItemsCount: 0,
        subtotal: 0,
        deliveryTotal: 0,
        grandTotal: 0,
        currency: 'EUR',
        updatedAt: new Date().toISOString(),
      };
      carts.push(cart);
    }

    const existingItemIndex = cart.items.findIndex((it) => it.productId === productId);
    let targetItem: CartItemModel;

    if (existingItemIndex >= 0) {
      const current = cart.items[existingItemIndex];
      const newQuantity = current.quantity + quantity;

      if (newQuantity > product.stockQuantity) {
        return {
          success: false,
          error: `Stock insuffisant : vous avez déjà ${current.quantity} unité(s) dans votre panier (stock total : ${product.stockQuantity}).`,
        };
      }

      current.quantity = newQuantity;
      current.subtotal = roundCurrency(product.price * newQuantity);
      current.stockSnapshot = product.stockQuantity;
      current.unitPriceSnapshot = product.price;
      current.updatedAt = new Date().toISOString();
      targetItem = current;
    } else {
      if (quantity > product.stockQuantity) {
        return {
          success: false,
          error: `Stock insuffisant (stock disponible : ${product.stockQuantity}).`,
        };
      }

      targetItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        cartId: cart.id,
        userId,
        shopId: product.shopId,
        shopNameSnapshot: shop.commercialName,
        productId: product.id,
        productNameSnapshot: product.name,
        productImageSnapshot: product.images?.[0],
        unitPriceSnapshot: product.price,
        currency: product.currency || 'EUR',
        quantity,
        stockSnapshot: product.stockQuantity,
        subtotal: roundCurrency(product.price * quantity),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cart.items.push(targetItem);
    }

    db.save();
    const updatedCart = this.calculateCart(userId);

    return {
      success: true,
      cart: updatedCart,
      item: targetItem,
    };
  }

  /**
   * Updates the quantity of a specific cart item
   */
  public static updateQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): { success: boolean; error?: string; cart?: GlobalCartModel } {
    const carts = db.get('marketplaceCarts') || [];
    const cart = carts.find((c) => c.userId === userId);

    if (!cart) {
      return { success: false, error: 'Panier introuvable.' };
    }

    const item = cart.items.find((it) => it.id === itemId);
    if (!item) {
      return { success: false, error: 'Article introuvable dans le panier.' };
    }

    if (quantity <= 0) {
      // Remove item if quantity set to 0
      cart.items = cart.items.filter((it) => it.id !== itemId);
    } else {
      const allProducts = db.get('marketplaceProducts') || [];
      const product = allProducts.find((p) => p.id === item.productId);

      if (product && quantity > product.stockQuantity) {
        return {
          success: false,
          error: `Stock maximum disponible pour cet article : ${product.stockQuantity}.`,
        };
      }

      item.quantity = quantity;
      item.subtotal = roundCurrency(item.unitPriceSnapshot * quantity);
      item.updatedAt = new Date().toISOString();
    }

    db.save();
    const updatedCart = this.calculateCart(userId);
    return { success: true, cart: updatedCart };
  }

  /**
   * Removes an item from the cart
   */
  public static removeItem(
    userId: string,
    itemId: string
  ): { success: boolean; cart?: GlobalCartModel } {
    const carts = db.get('marketplaceCarts') || [];
    const cart = carts.find((c) => c.userId === userId);

    if (cart) {
      cart.items = cart.items.filter((it) => it.id !== itemId);
      db.save();
    }

    const updatedCart = this.calculateCart(userId);
    return { success: true, cart: updatedCart };
  }

  /**
   * Clears the user's cart completely
   */
  public static clearCart(userId: string): void {
    const carts = db.get('marketplaceCarts') || [];
    const cart = carts.find((c) => c.userId === userId);
    if (cart) {
      cart.items = [];
      cart.groups = [];
      cart.totalItemsCount = 0;
      cart.subtotal = 0;
      cart.deliveryTotal = 0;
      cart.grandTotal = 0;
      cart.updatedAt = new Date().toISOString();
      db.save();
    }
  }

  /**
   * Validates cart before checkout: stock availability, shop status, price drift
   */
  public static validateCartForCheckout(userId: string): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    cart: GlobalCartModel;
  } {
    const cart = this.calculateCart(userId);
    const allProducts = db.get('marketplaceProducts') || [];
    const allShops = db.get('partnerShops') || [];

    const warnings: string[] = [];
    const errors: string[] = [];

    if (cart.items.length === 0) {
      errors.push('Votre panier est vide.');
      return { isValid: false, warnings, errors, cart };
    }

    for (const item of cart.items) {
      const product = allProducts.find((p) => p.id === item.productId);
      const shop = allShops.find((s) => s.id === item.shopId);

      if (!product || product.status !== 'PUBLISHED') {
        errors.push(`Le produit "${item.productNameSnapshot}" n’est plus disponible à la vente.`);
      } else if (product.stockQuantity < item.quantity) {
        errors.push(
          `Stock insuffisant pour "${item.productNameSnapshot}" (demandé: ${item.quantity}, disponible: ${product.stockQuantity}).`
        );
      }

      if (!shop || shop.status !== 'ACTIVE') {
        errors.push(`La boutique "${item.shopNameSnapshot}" n'est pas active actuellement.`);
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      cart,
    };
  }

  /**
   * Helper to resolve commission rate for a shop
   */
  private static resolveCommissionRate(shopId: string): number {
    const rules = db.get('commissionRules') || [];
    // 1. Shop-specific active rule
    const shopRule = rules.find((r) => r.shopId === shopId && r.isActive);
    if (shopRule?.percentage) {
      return shopRule.percentage;
    }
    // 2. Global active rule
    const globalRule = rules.find((r) => !r.shopId && r.isActive);
    if (globalRule?.percentage) {
      return globalRule.percentage;
    }
    // 3. Platform default 6%
    return 6.0;
  }

  /**
   * DISPATCH ENGINE: Transforms the multi-shop global cart into:
   * 1 x GlobalOrder
   * N x ShopOrders (one per partner shop)
   * M x MarketplaceOrderItems
   * 1 x PaymentIntent with financial allocation
   * Updates product stock atomically
   */
  public static dispatchOrder(params: {
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    billingAddress: OrderAddressSnapshot;
    shippingAddress: OrderAddressSnapshot;
    shopFulfillments: {
      shopId: string;
      fulfillmentMethod: FulfillmentMethod;
      customerNote?: string;
    }[];
    paymentMethod?: string;
    paymentTransactionId?: string;
  }): {
    success: boolean;
    error?: string;
    globalOrder?: GlobalOrder;
    shopOrders?: ShopOrder[];
    paymentIntent?: PaymentIntent;
  } {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      billingAddress,
      shippingAddress,
      shopFulfillments,
      paymentMethod = 'STRIPE_CARD',
      paymentTransactionId,
    } = params;

    // Step 1: Pre-dispatch validation
    const validation = this.validateCartForCheckout(userId);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    // Map user fulfillment choices
    const fulfillmentMap: Record<string, FulfillmentMethod> = {};
    const notesMap: Record<string, string | undefined> = {};
    for (const sf of shopFulfillments) {
      fulfillmentMap[sf.shopId] = sf.fulfillmentMethod;
      notesMap[sf.shopId] = sf.customerNote;
    }

    // Step 2: Calculate cart with exact fulfillment options
    const cart = this.calculateCart(userId, fulfillmentMap);

    const allProducts = db.get('marketplaceProducts') || [];
    const allShops = db.get('partnerShops') || [];

    // Step 3: Initialize IDs and references
    const globalOrderId = `gord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const globalOrderNumber = generateOrderNumber('NEXUS');
    const nowIso = new Date().toISOString();

    const createdShopOrders: ShopOrder[] = [];
    const createdOrderItems: MarketplaceOrderItem[] = [];
    const paymentAllocations: {
      shopId: string;
      shopOrderId: string;
      grossAmount: number;
      deliveryFee: number;
      commission: number;
      netAmount: number;
    }[] = [];

    let totalCommissionPlatform = 0;

    // Step 4: Generate a ShopOrder for each shop group
    for (const group of cart.groups) {
      const shop = allShops.find((s) => s.id === group.shopId);
      const shopOwnerId = shop?.ownerUserId || 'usr_admin';
      const shopOrderId = `sord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const shopOrderNumber = generateOrderNumber(
        shop?.commercialName ? shop.commercialName.replace(/[^A-Za-z0-9]/g, '').substring(0, 5).toUpperCase() : 'SHOP'
      );

      const fulfillmentMethod: FulfillmentMethod = fulfillmentMap[group.shopId] || group.selectedFulfillmentMethod;
      const deliveryFee = fulfillmentMethod === 'DELIVERY' ? group.deliveryFee : 0;
      const commissionRate = this.resolveCommissionRate(group.shopId);

      // Module 15: Shop discount & platform subsidy resolution
      const shopDiscountInfo = cart.promotionSnapshot?.discountPerShop.find((d) => d.shopId === group.shopId);
      const discountAmount = shopDiscountInfo ? roundCurrency(shopDiscountInfo.discountAmount) : 0;
      const platformSubsidyAmount = shopDiscountInfo ? shopDiscountInfo.platformShareAmount : 0;
      const partnerDiscountAbsorbed = shopDiscountInfo ? shopDiscountInfo.partnerShareAmount : 0;

      // Commission is calculated on product subtotal
      const commissionAmount = roundCurrency((group.subtotal * commissionRate) / 100);
      totalCommissionPlatform = roundCurrency(totalCommissionPlatform + commissionAmount);

      // Net amount due to shop = Subtotal - Discount + PlatformSubsidy + DeliveryFee - Platform Commission
      const shopNetAmount = roundCurrency(group.subtotal - discountAmount + platformSubsidyAmount + deliveryFee - commissionAmount);

      // Construct pickup information if method is PICKUP
      const pickupInformation =
        fulfillmentMethod === 'PICKUP' && shop
          ? {
              shopName: shop.commercialName,
              address: `${shop.address}, ${shop.postalCode} ${shop.city}`,
              openingHours: typeof shop.openingHours === 'string' ? shop.openingHours : JSON.stringify(shop.openingHours || {}),
              instructions: shop.pickupInstructions || 'Veuillez présenter votre confirmation de commande au comptoir.',
            }
          : undefined;

      const shopOrder: ShopOrder = {
        id: shopOrderId,
        globalOrderId,
        globalOrderNumber,
        shopId: group.shopId,
        shopOwnerId,
        shopNameSnapshot: group.shopName,
        orderNumber: shopOrderNumber,
        status: 'PENDING',
        currency: 'EUR',
        subtotal: group.subtotal,
        discountAmount,
        platformSubsidyAmount,
        promotionSnapshot: cart.promotionSnapshot || undefined,
        deliveryFee,
        commissionRate,
        commissionAmount,
        shopNetAmount,
        fulfillmentMethod,
        shippingAddressSnapshot: fulfillmentMethod === 'DELIVERY' ? shippingAddress : undefined,
        pickupInformation,
        customerNote: notesMap[group.shopId],
        statusTimeline: [
          {
            status: 'PENDING',
            timestamp: nowIso,
            note: 'Commande transmise à la boutique partenaire.',
            author: 'Nexus Dispatch Engine',
          },
        ],
        itemsCount: group.itemsCount,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      createdShopOrders.push(shopOrder);

      // Generate order items and decrement stock
      for (const item of group.items) {
        const itemCommission = roundCurrency((item.subtotal * commissionRate) / 100);
        const product = allProducts.find((p) => p.id === item.productId);

        const orderItem: MarketplaceOrderItem = {
          id: `mitem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          globalOrderId,
          shopOrderId,
          shopId: group.shopId,
          productId: item.productId,
          productName: item.productNameSnapshot,
          productImage: item.productImageSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPriceSnapshot,
          subtotal: item.subtotal,
          commissionRate,
          commissionAmount: itemCommission,
          currency: 'EUR',
          productMetadataSnapshot: {
            category: product?.categoryId,
            brand: product?.brand,
            cbdPercentage: product?.declaredCBDPercentage,
            thcPercentage: product?.declaredTHCPercentage,
            batchNumber: product?.batchNumber,
          },
          createdAt: nowIso,
        };

        createdOrderItems.push(orderItem);

        // Atomic stock decrement
        if (product) {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
          if (product.stockQuantity === 0) {
            product.stockStatus = 'OUT_OF_STOCK';
          } else if (product.stockQuantity <= 5) {
            product.stockStatus = 'LOW_STOCK';
          }
          product.updatedAt = nowIso;
        }
      }

      paymentAllocations.push({
        shopId: group.shopId,
        shopOrderId,
        grossAmount: roundCurrency(group.subtotal + deliveryFee),
        deliveryFee,
        commission: commissionAmount,
        netAmount: shopNetAmount,
      });
    }

    // Step 5: Construct GlobalOrder
    const globalOrder: GlobalOrder = {
      id: globalOrderId,
      orderNumber: globalOrderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      status: 'PAID', // In marketplace demo flow, payment is captured at checkout
      currency: 'EUR',
      subtotal: cart.subtotal,
      deliveryTotal: cart.deliveryTotal,
      discountTotal: cart.discountTotal || 0,
      promotionSnapshot: cart.promotionSnapshot,
      commissionTotal: totalCommissionPlatform,
      grandTotal: cart.grandTotal,
      billingSnapshot: billingAddress,
      shippingSnapshot: shippingAddress,
      paymentStatus: 'PAID',
      paymentMethod,
      paymentTransactionId: paymentTransactionId || `tx_${Date.now()}`,
      shopOrdersCount: createdShopOrders.length,
      shopOrdersSummary: createdShopOrders.map((so) => ({
        shopOrderId: so.id,
        shopId: so.shopId,
        shopName: so.shopNameSnapshot,
        orderNumber: so.orderNumber,
        status: so.status,
        fulfillmentMethod: so.fulfillmentMethod,
        total: roundCurrency(so.subtotal + so.deliveryFee),
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Step 6: Construct PaymentIntent
    const isRealStripeTx = Boolean(paymentTransactionId && paymentTransactionId.startsWith('pi_') && !paymentTransactionId.startsWith('pi_stripe_'));
    const paymentIntent: PaymentIntent = {
      id: paymentTransactionId || `pi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      globalOrderId,
      globalOrderNumber,
      amount: cart.grandTotal,
      currency: 'EUR',
      status: 'SUCCEEDED',
      provider: isRealStripeTx ? 'STRIPE_CONNECT' : 'NEXUS_MARKETPLACE_ENGINE',
      allocation: paymentAllocations,
      createdAt: nowIso,
    };

    // Step 7: Persist everything to database
    const globalOrders = db.get('globalOrders') || [];
    globalOrders.unshift(globalOrder);

    const shopOrders = db.get('shopOrders') || [];
    shopOrders.unshift(...createdShopOrders);

    const orderItems = db.get('marketplaceOrderItems') || [];
    orderItems.push(...createdOrderItems);

    const paymentIntents = db.get('paymentIntents') || [];
    paymentIntents.push(paymentIntent);

    // Step 8: Clear user's cart
    this.clearCart(userId);

    // Step 9 (Module 10): Record in Immutable Financial Ledger & Dispatch Transfers
    try {
      const orderFinancials = FinancialEngineService.calculateOrderFinancials({
        subtotal: cart.subtotal,
        deliveryTotal: cart.deliveryTotal,
        shops: createdShopOrders.map((so) => ({
          shopId: so.shopId,
          shopOrderId: so.id,
          shopName: so.shopNameSnapshot,
          subtotal: so.subtotal,
          deliveryFee: so.deliveryFee,
        })),
        currency: 'EUR',
      });

      FinancialEngineService.recordOrderPaymentInLedger(
        globalOrder,
        createdShopOrders,
        orderFinancials,
        globalOrder.paymentTransactionId || `tx_${Date.now()}`
      );

      // Trigger automatic Connect transfer creation to partner accounts
      PartnerFinancialService.dispatchOrderTransfers(globalOrder.id).catch((e) =>
        console.error('Transfer dispatch error:', e)
      );
    } catch (finErr) {
      console.error('Module 10 Financial Ledger error:', finErr);
    }

    // Step 10 (Module 11): Initialize Shipments, Tracking and Pickup Confirmations
    try {
      for (const so of createdShopOrders) {
        const itemsForShop = createdOrderItems.filter((it) => it.shopOrderId === so.id);
        LogisticsService.initializeShipmentForShopOrder(
          so,
          itemsForShop,
          so.fulfillmentMethod,
          params.shippingAddress
        );
      }
    } catch (logisticsErr) {
      console.error('Module 11 Logistics initialization error:', logisticsErr);
    }

    // Step 11 (Module 15): Record Promotion Redemption and Attribution
    try {
      if (cart.promotionSnapshot) {
        PromotionEligibilityService.recordCouponUsage(
          cart.promotionSnapshot.couponCode,
          userId,
          cart.discountTotal || 0
        );

        let totalPartnerAbsorbed = 0;
        let totalPlatformAbsorbed = 0;
        for (const d of cart.promotionSnapshot.discountPerShop) {
          totalPartnerAbsorbed += d.partnerShareAmount;
          totalPlatformAbsorbed += d.platformShareAmount;
        }

        MarketingAttributionService.recordAttribution({
          orderId: globalOrder.id,
          userId,
          campaignId: cart.promotionSnapshot.campaignId,
          couponCode: cart.promotionSnapshot.couponCode,
          source: 'CAMPAIGN',
          grossAmount: roundCurrency(globalOrder.subtotal + globalOrder.deliveryTotal),
          discountAmount: globalOrder.discountTotal || 0,
          netPaidAmount: globalOrder.grandTotal,
          commissionAmount: globalOrder.commissionTotal,
          partnerDiscountAbsorbed: roundCurrency(totalPartnerAbsorbed),
          platformDiscountAbsorbed: roundCurrency(totalPlatformAbsorbed),
        });
      }
    } catch (mktErr) {
      console.error('Module 15 Promotion Attribution error:', mktErr);
    }

    db.save();

    return {
      success: true,
      globalOrder,
      shopOrders: createdShopOrders,
      paymentIntent,
    };
  }

  /**
   * Updates status of an individual ShopOrder and recalculates parent GlobalOrder status
   */
  public static updateShopOrderStatus(params: {
    shopId: string;
    shopOrderId: string;
    userId: string;
    userRole: string;
    newStatus: ShopOrderStatus;
    trackingNumber?: string;
    carrierName?: string;
    note?: string;
  }): {
    success: boolean;
    error?: string;
    shopOrder?: ShopOrder;
    globalOrderStatus?: GlobalOrderStatus;
  } {
    const { shopId, shopOrderId, userId, userRole, newStatus, trackingNumber, carrierName, note } = params;

    const allShops = db.get('partnerShops') || [];
    const shop = allShops.find((s) => s.id === shopId);

    // IDOR / Security check: verify caller owns the shop or is admin
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isOwner = shop && shop.ownerUserId === userId;

    if (!isAdmin && !isOwner) {
      return { success: false, error: 'Accès non autorisé à cette commande de boutique.' };
    }

    const shopOrders = db.get('shopOrders') || [];
    const shopOrder = shopOrders.find((so) => so.id === shopOrderId && so.shopId === shopId);

    if (!shopOrder) {
      return { success: false, error: 'Sous-commande boutique introuvable.' };
    }

    const nowIso = new Date().toISOString();
    shopOrder.status = newStatus;
    shopOrder.updatedAt = nowIso;

    if (trackingNumber) shopOrder.trackingNumber = trackingNumber;
    if (carrierName) shopOrder.carrierName = carrierName;

    let defaultNote = `Statut mis à jour : ${newStatus}`;
    if (newStatus === 'ACCEPTED') defaultNote = 'Commande prise en charge par la boutique.';
    if (newStatus === 'PROCESSING') defaultNote = 'Préparation de la commande en cours.';
    if (newStatus === 'READY') defaultNote = 'Commande prête pour le retrait en boutique.';
    if (newStatus === 'SHIPPED') defaultNote = `Colis expédié (${carrierName || 'Transporteur'}${trackingNumber ? ` - Suivi : ${trackingNumber}` : ''}).`;
    if (newStatus === 'DELIVERED') defaultNote = 'Colis livré au destinataire.';
    if (newStatus === 'COMPLETED') defaultNote = 'Commande terminée et clôturée.';
    if (newStatus === 'CANCELLED') defaultNote = 'Commande annulée par la boutique.';

    shopOrder.statusTimeline.push({
      status: newStatus,
      timestamp: nowIso,
      note: note || defaultNote,
      author: isAdmin ? 'Admin Nexus' : (shop?.commercialName || 'Boutique Partenaire'),
    });

    // Recompute GlobalOrder status based on all child ShopOrders
    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((go) => go.id === shopOrder.globalOrderId);

    let globalStatus: GlobalOrderStatus = 'PROCESSING';

    if (globalOrder) {
      const childShopOrders = shopOrders.filter((so) => so.globalOrderId === globalOrder.id);
      const statuses = childShopOrders.map((so) => so.status);

      // Update summary in globalOrder
      if (globalOrder.shopOrdersSummary) {
        const itemInSummary = globalOrder.shopOrdersSummary.find((s) => s.shopOrderId === shopOrder.id);
        if (itemInSummary) {
          itemInSummary.status = newStatus;
        }
      }

      if (statuses.every((s) => s === 'COMPLETED')) {
        globalStatus = 'COMPLETED';
      } else if (statuses.every((s) => s === 'CANCELLED')) {
        globalStatus = 'CANCELLED';
      } else if (statuses.some((s) => s === 'CANCELLED')) {
        globalStatus = 'PARTIALLY_CANCELLED';
      } else if (statuses.every((s) => s === 'READY' || s === 'SHIPPED' || s === 'DELIVERED' || s === 'COMPLETED')) {
        globalStatus = 'READY';
      } else if (statuses.some((s) => s === 'READY' || s === 'SHIPPED' || s === 'DELIVERED')) {
        globalStatus = 'PARTIALLY_READY';
      } else if (statuses.some((s) => s === 'PROCESSING')) {
        globalStatus = 'PROCESSING';
      } else {
        globalStatus = 'PAID';
      }

      globalOrder.status = globalStatus;
      globalOrder.updatedAt = nowIso;
    }

    db.save();

    return {
      success: true,
      shopOrder,
      globalOrderStatus: globalStatus,
    };
  }

  /**
   * Retrieves all orders for a specific shop (strictly filtered)
   */
  public static getShopOrders(
    shopId: string,
    userId: string,
    userRole: string
  ): { success: boolean; error?: string; orders?: ShopOrder[] } {
    const allShops = db.get('partnerShops') || [];
    const shop = allShops.find((s) => s.id === shopId);

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isOwner = shop && shop.ownerUserId === userId;

    if (!isAdmin && !isOwner) {
      return { success: false, error: 'Accès refusé aux commandes de cette boutique.' };
    }

    const shopOrders = db.get('shopOrders') || [];
    const allItems = db.get('marketplaceOrderItems') || [];

    const ordersForShop = shopOrders
      .filter((so) => so.shopId === shopId)
      .map((so) => ({
        ...so,
        items: allItems.filter((it) => it.shopOrderId === so.id),
      }));

    return { success: true, orders: ordersForShop };
  }

  /**
   * Retrieves admin KPIs and metrics for all distributed orders
   */
  public static getAdminMetrics(): {
    gmvTotal: number;
    commissionTotal: number;
    shopNetTotal: number;
    deliveryTotal: number;
    totalGlobalOrders: number;
    totalShopOrders: number;
    multiShopOrdersCount: number;
    averageBasket: number;
    ordersByStatus: Record<string, number>;
  } {
    const globalOrders = db.get('globalOrders') || [];
    const shopOrders = db.get('shopOrders') || [];

    let gmvTotal = 0;
    let commissionTotal = 0;
    let shopNetTotal = 0;
    let deliveryTotal = 0;
    let multiShopOrdersCount = 0;
    const ordersByStatus: Record<string, number> = {};

    for (const go of globalOrders) {
      gmvTotal = roundCurrency(gmvTotal + go.grandTotal);
      commissionTotal = roundCurrency(commissionTotal + go.commissionTotal);
      deliveryTotal = roundCurrency(deliveryTotal + go.deliveryTotal);

      if (go.shopOrdersCount > 1) {
        multiShopOrdersCount++;
      }

      ordersByStatus[go.status] = (ordersByStatus[go.status] || 0) + 1;
    }

    for (const so of shopOrders) {
      shopNetTotal = roundCurrency(shopNetTotal + so.shopNetAmount);
    }

    const totalGlobalOrders = globalOrders.length;
    const averageBasket = totalGlobalOrders > 0 ? roundCurrency(gmvTotal / totalGlobalOrders) : 0;

    return {
      gmvTotal,
      commissionTotal,
      shopNetTotal,
      deliveryTotal,
      totalGlobalOrders,
      totalShopOrders: shopOrders.length,
      multiShopOrdersCount,
      averageBasket,
      ordersByStatus,
    };
  }
}
