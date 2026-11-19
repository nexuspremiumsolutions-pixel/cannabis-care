import { db } from '../../db/database';
import {
  MarketingCampaign,
  MarketingPromotion,
  MarketingCoupon,
  OrderPromotionSnapshot,
  GlobalCartModel,
  ShopCartGroup,
  CartItemModel,
} from '../../../src/types/entities';

export interface PromotionEvaluationResult {
  isValid: boolean;
  error?: string;
  coupon?: MarketingCoupon;
  promotion?: MarketingPromotion;
  campaign?: MarketingCampaign;
  discountTotal: number;
  deliveryDiscountTotal: number;
  discountPerShop: {
    shopId: string;
    shopName: string;
    discountAmount: number;
    deliveryDiscountAmount: number;
    partnerShareAmount: number;
    platformShareAmount: number;
  }[];
  snapshot?: OrderPromotionSnapshot;
}

export class PromotionEligibilityService {
  /**
   * Evaluates a coupon code against a user's cart and determines discounts and funding distribution
   */
  public static evaluateCoupon(
    userId: string,
    couponCode: string,
    cart: GlobalCartModel
  ): PromotionEvaluationResult {
    const normalizedCode = couponCode.trim().toUpperCase();

    const coupons = db.get('marketingCoupons') || [];
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === normalizedCode && c.status === 'ACTIVE'
    );

    if (!coupon) {
      return {
        isValid: false,
        error: `Le code promo « ${normalizedCode} » est invalide ou expiré.`,
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      return {
        isValid: false,
        error: `Le code promo « ${normalizedCode} » n’est pas actif pour la période actuelle.`,
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Check global coupon usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        error: `Le code promo « ${normalizedCode} » a atteint son nombre d'utilisations maximal.`,
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Check per-user limit
    const userUsage = coupon.userUsageMap?.[userId] || 0;
    if (coupon.usagePerUser && userUsage >= coupon.usagePerUser) {
      return {
        isValid: false,
        error: `Vous avez déjà utilisé le code promo « ${normalizedCode} » le nombre maximum de fois autorisé.`,
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Fetch associated promotion and campaign
    const promotions = db.get('marketingPromotions') || [];
    const promotion = promotions.find((p) => p.id === coupon.promotionId);

    if (!promotion || promotion.status !== 'ACTIVE') {
      return {
        isValid: false,
        error: 'La promotion associée à ce code n’est pas disponible.',
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    const campaigns = db.get('marketingCampaigns') || [];
    const campaign = campaigns.find((c) => c.id === coupon.campaignId);

    if (!campaign || campaign.status !== 'ACTIVE') {
      return {
        isValid: false,
        error: 'La campagne associée à cette offre est actuellement inactive.',
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Check campaign budget cap
    if (campaign.budget && campaign.budgetSpent >= campaign.budget) {
      return {
        isValid: false,
        error: 'Le budget alloué à cette offre promotionnelle a été entièrement consommé.',
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Evaluate against Cart Items and Shops
    return this.calculatePromotionDiscount({
      userId,
      coupon,
      promotion,
      campaign,
      cart,
    });
  }

  /**
   * Calculates discount details across cart items and shops based on eligibility rules
   */
  private static calculatePromotionDiscount(params: {
    userId: string;
    coupon: MarketingCoupon;
    promotion: MarketingPromotion;
    campaign: MarketingCampaign;
    cart: GlobalCartModel;
  }): PromotionEvaluationResult {
    const { coupon, promotion, campaign, cart } = params;

    // Filter eligible groups and items
    const allProducts = db.get('marketplaceProducts') || [];
    let eligibleSubtotal = 0;
    const shopEligibilityMap = new Map<
      string,
      {
        group: ShopCartGroup;
        eligibleItems: CartItemModel[];
        eligibleItemsSubtotal: number;
      }
    >();

    for (const group of cart.groups) {
      // Check shop restriction:
      // If promotion is partner-specific, only that shop is eligible
      if (promotion.shopId && promotion.shopId !== group.shopId) {
        continue;
      }
      if (promotion.eligibleShopIds && !promotion.eligibleShopIds.includes(group.shopId)) {
        continue;
      }

      const eligibleItems: CartItemModel[] = [];
      let shopSubtotal = 0;

      for (const item of group.items) {
        const product = allProducts.find((p) => p.id === item.productId);
        if (!product) continue;

        // Check product exclusion
        if (promotion.excludedProductIds?.includes(item.productId)) {
          continue;
        }

        // Check product restriction
        if (promotion.eligibleProductIds && !promotion.eligibleProductIds.includes(item.productId)) {
          continue;
        }

        // Check category restriction
        if (
          promotion.eligibleCategoryIds &&
          product.categoryId &&
          !promotion.eligibleCategoryIds.includes(product.categoryId)
        ) {
          continue;
        }

        eligibleItems.push(item);
        shopSubtotal += item.subtotal;
      }

      if (eligibleItems.length > 0 || promotion.promotionType === 'FREE_SHIPPING') {
        shopEligibilityMap.set(group.shopId, {
          group,
          eligibleItems,
          eligibleItemsSubtotal: shopSubtotal,
        });
        eligibleSubtotal += shopSubtotal;
      }
    }

    if (shopEligibilityMap.size === 0 && promotion.promotionType !== 'FREE_SHIPPING') {
      return {
        isValid: false,
        error: 'Aucun article de votre panier n’est éligible à cette promotion.',
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Minimum order amount check
    const minAmount = promotion.minimumOrderAmount || 0;
    if (minAmount > 0 && eligibleSubtotal < minAmount) {
      return {
        isValid: false,
        error: `Le montant minimum d’achat pour cette offre est de ${minAmount.toFixed(2)} € (actuel: ${eligibleSubtotal.toFixed(2)} €).`,
        discountTotal: 0,
        deliveryDiscountTotal: 0,
        discountPerShop: [],
      };
    }

    // Calculate Discounts based on Promotion Type
    let totalDiscount = 0;
    let totalDeliveryDiscount = 0;
    const discountPerShop: {
      shopId: string;
      shopName: string;
      discountAmount: number;
      deliveryDiscountAmount: number;
      partnerShareAmount: number;
      platformShareAmount: number;
    }[] = [];

    const partnerRatio = promotion.partnerFundingRatio ?? (promotion.fundingSource === 'PARTNER' ? 1.0 : 0.0);

    if (promotion.promotionType === 'PERCENTAGE') {
      const rawDiscount = (eligibleSubtotal * promotion.value) / 100;
      const cappedDiscount = promotion.maximumDiscountAmount
        ? Math.min(rawDiscount, promotion.maximumDiscountAmount)
        : rawDiscount;

      totalDiscount = Math.round(cappedDiscount * 100) / 100;

      // Apportion discount proportionately across eligible shops
      for (const [shopId, data] of shopEligibilityMap.entries()) {
        const ratio = eligibleSubtotal > 0 ? data.eligibleItemsSubtotal / eligibleSubtotal : 1;
        const shopDiscount = Math.round(totalDiscount * ratio * 100) / 100;
        const partnerShare = Math.round(shopDiscount * partnerRatio * 100) / 100;
        const platformShare = Math.round((shopDiscount - partnerShare) * 100) / 100;

        discountPerShop.push({
          shopId,
          shopName: data.group.shopName,
          discountAmount: shopDiscount,
          deliveryDiscountAmount: 0,
          partnerShareAmount: partnerShare,
          platformShareAmount: platformShare,
        });
      }
    } else if (promotion.promotionType === 'FIXED_AMOUNT') {
      totalDiscount = Math.min(promotion.value, eligibleSubtotal);
      totalDiscount = Math.round(totalDiscount * 100) / 100;

      for (const [shopId, data] of shopEligibilityMap.entries()) {
        const ratio = eligibleSubtotal > 0 ? data.eligibleItemsSubtotal / eligibleSubtotal : 1;
        const shopDiscount = Math.round(totalDiscount * ratio * 100) / 100;
        const partnerShare = Math.round(shopDiscount * partnerRatio * 100) / 100;
        const platformShare = Math.round((shopDiscount - partnerShare) * 100) / 100;

        discountPerShop.push({
          shopId,
          shopName: data.group.shopName,
          discountAmount: shopDiscount,
          deliveryDiscountAmount: 0,
          partnerShareAmount: partnerShare,
          platformShareAmount: platformShare,
        });
      }
    } else if (promotion.promotionType === 'FREE_SHIPPING') {
      for (const [shopId, data] of shopEligibilityMap.entries()) {
        if (data.group.selectedFulfillmentMethod === 'DELIVERY' && data.group.deliveryFee > 0) {
          const feeDiscount = data.group.deliveryFee;
          totalDeliveryDiscount += feeDiscount;
          const partnerShare = Math.round(feeDiscount * partnerRatio * 100) / 100;
          const platformShare = Math.round((feeDiscount - partnerShare) * 100) / 100;

          discountPerShop.push({
            shopId,
            shopName: data.group.shopName,
            discountAmount: 0,
            deliveryDiscountAmount: feeDiscount,
            partnerShareAmount: partnerShare,
            platformShareAmount: platformShare,
          });
        }
      }
      totalDiscount = 0;
    }

    const snapshot: OrderPromotionSnapshot = {
      couponCode: coupon.code,
      campaignId: campaign.id,
      campaignName: campaign.name,
      promotionId: promotion.id,
      promotionType: promotion.promotionType,
      promotionName: promotion.name,
      totalDiscountAmount: totalDiscount + totalDeliveryDiscount,
      discountPerShop,
      fundingSource: promotion.fundingSource,
      partnerFundingRatio: partnerRatio,
    };

    return {
      isValid: true,
      coupon,
      promotion,
      campaign,
      discountTotal: totalDiscount,
      deliveryDiscountTotal: totalDeliveryDiscount,
      discountPerShop,
      snapshot,
    };
  }

  /**
   * Records that a coupon has been used on a successful order
   */
  public static recordCouponUsage(couponCode: string, userId: string, discountAmount: number) {
    const coupons = db.get('marketingCoupons') || [];
    const coupon = coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (!coupon) return;

    coupon.usageCount = (coupon.usageCount || 0) + 1;
    if (!coupon.userUsageMap) coupon.userUsageMap = {};
    coupon.userUsageMap[userId] = (coupon.userUsageMap[userId] || 0) + 1;
    coupon.updatedAt = new Date().toISOString();

    // Increment campaign budgetSpent
    const campaigns = db.get('marketingCampaigns') || [];
    const campaign = campaigns.find((c) => c.id === coupon.campaignId);
    if (campaign) {
      campaign.budgetSpent = Math.round(((campaign.budgetSpent || 0) + discountAmount) * 100) / 100;
      if (campaign.budget && campaign.budgetSpent >= campaign.budget) {
        campaign.status = 'PAUSED';
      }
      campaign.updatedAt = new Date().toISOString();
    }

    // Increment promotion usageCount
    const promotions = db.get('marketingPromotions') || [];
    const promo = promotions.find((p) => p.id === coupon.promotionId);
    if (promo) {
      promo.usageCount = (promo.usageCount || 0) + 1;
      promo.updatedAt = new Date().toISOString();
    }

    db.save();
  }
}
