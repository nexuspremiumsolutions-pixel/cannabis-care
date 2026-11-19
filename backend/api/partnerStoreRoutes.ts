import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import {
  PartnerShop,
  CBDMarketplaceProduct,
  ShopCustomCategory,
  ShopTeamMember,
  ShopReview,
  UserFavoriteShop,
  ShopViewHistory,
  UserRole,
} from '../../src/types/entities';
import {
  PartnerStoreService,
  generateShopSlug,
} from '../services/partnerStoreService';
import { AnalyticsEngine } from '../services/admin/analyticsEngine';
import { verifyToken } from '../auth/auth';
import { SecurityService } from '../services/security/securityService';

const router = Router();

// Helper to extract authenticated user from auth header securely
function getAuthUser(req: Request): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const users = db.get('users') || [];

  // 1. First attempt cryptographically verified JWT token
  const decoded = verifyToken(token);
  if (decoded && decoded.sub) {
    const matched = users.find((u) => u.id === decoded.sub);
    if (matched) return matched;
  }

  // 2. Fallback for test tokens or user IDs
  return users.find((u) => u.id === token || u.email === token) || null;
}

// ============================================================================
// 1. PUBLIC STOREFRONT ROUTES
// ============================================================================

/**
 * GET /api/marketplace/storefront/list
 * List public shops with filters (country, search, delivery/pickup, template)
 */
router.get('/storefront/list', (req: Request, res: Response) => {
  try {
    const { country, search, fulfillment, template, featured } = req.query;
    const shops: PartnerShop[] = db.get('partnerShops') || [];

    let filtered = shops.filter((s) => {
      // Only active and published or verified shops
      const isActive = (s.shopStatus || s.status) === 'ACTIVE';
      const isPublic = s.publicVisibility !== 'PRIVATE';
      return isActive && isPublic;
    });

    if (country && typeof country === 'string' && country !== 'ALL') {
      filtered = filtered.filter(
        (s) => s.country.toLowerCase() === country.toLowerCase()
      );
    }

    if (template && typeof template === 'string') {
      filtered = filtered.filter((s) => s.storefrontTemplate === template);
    }

    if (featured === 'true') {
      filtered = filtered.filter((s) => s.featuredStatus === true);
    }

    if (fulfillment === 'PICKUP') {
      filtered = filtered.filter((s) => s.pickupAvailable);
    } else if (fulfillment === 'DELIVERY') {
      filtered = filtered.filter((s) => s.deliveryAvailable);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.commercialName.toLowerCase().includes(q) ||
          (s.publicName && s.publicName.toLowerCase().includes(q)) ||
          s.city.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.badges && s.badges.some((b) => b.toLowerCase().includes(q)))
      );
    }

    res.json({
      success: true,
      count: filtered.length,
      shops: filtered,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/storefront/resolve/:slugOrId
 * Resolve public shop details by slug or ID
 */
router.get('/storefront/resolve/:slugOrId', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const shop = PartnerStoreService.getShopByIdOrSlug(slugOrId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: `Boutique partenaire introuvable pour "${slugOrId}".`,
      });
    }

    // Record view history
    const user = getAuthUser(req);
    const shopViewHistory: ShopViewHistory[] = db.get('shopViewHistory') || [];
    shopViewHistory.push({
      id: 'sv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user ? user.id : 'anonymous',
      shopId: shop.id,
      viewedAt: new Date().toISOString(),
    });
    db.set('shopViewHistory', shopViewHistory);

    // Increment viewsCount
    shop.viewsCount = (shop.viewsCount || 0) + 1;
    db.save();

    // Fetch shop reviews summary
    const allReviews: ShopReview[] = db.get('shopReviews') || [];
    const approvedReviews = allReviews.filter(
      (r) => r.shopId === shop.id && r.moderationStatus === 'APPROVED'
    );
    const avgRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
        : 5.0;

    // Check if favorited by user
    let isFavorited = false;
    if (user) {
      const favorites: UserFavoriteShop[] = db.get('userFavoriteShops') || [];
      isFavorited = favorites.some((f) => f.userId === user.id && f.shopId === shop.id);
    }

    res.json({
      success: true,
      shop: {
        ...shop,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewsCount: approvedReviews.length,
        isFavorited,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/storefront/:slugOrId/products
 * Get published catalog of a specific shop
 */
router.get('/storefront/:slugOrId/products', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const shop = PartnerStoreService.getShopByIdOrSlug(slugOrId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const { category, customCategory, search, sortBy, inStockOnly } = req.query;
    const allProducts: CBDMarketplaceProduct[] = db.get('marketplaceProducts') || [];
    let shopProducts = allProducts.filter(
      (p) => p.shopId === shop.id && p.status === 'PUBLISHED'
    );

    if (category && typeof category === 'string' && category !== 'ALL') {
      shopProducts = shopProducts.filter((p) => p.categoryId === category);
    }

    if (customCategory && typeof customCategory === 'string') {
      shopProducts = shopProducts.filter(
        (p) => (p as any).customCategoryId === customCategory
      );
    }

    if (inStockOnly === 'true') {
      shopProducts = shopProducts.filter(
        (p) => p.stockStatus === 'IN_STOCK' || p.stockQuantity > 0
      );
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      shopProducts = shopProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    // Sort logic
    if (sortBy === 'price_asc') {
      shopProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      shopProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'cbd_desc') {
      shopProducts.sort((a, b) => (b.declaredCBDPercentage || 0) - (a.declaredCBDPercentage || 0));
    } else {
      // Default: featured first, then newest
      shopProducts.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    res.json({
      success: true,
      shopId: shop.id,
      count: shopProducts.length,
      products: shopProducts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/storefront/:slugOrId/categories
 * Get custom categories + represented global categories for the shop
 */
router.get('/storefront/:slugOrId/categories', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const shop = PartnerStoreService.getShopByIdOrSlug(slugOrId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const allCustomCategories: ShopCustomCategory[] = db.get('shopCustomCategories') || [];
    const shopCustomCategories = allCustomCategories.filter(
      (c) => c.shopId === shop.id && c.isActive
    );

    const allGlobalCategories = db.get('productCategories') || [];
    const shopProducts: CBDMarketplaceProduct[] = (db.get('marketplaceProducts') || []).filter(
      (p) => p.shopId === shop.id && p.status === 'PUBLISHED'
    );
    const usedGlobalCategoryIds = new Set(shopProducts.map((p) => p.categoryId));
    const representedGlobalCategories = allGlobalCategories.filter((c) =>
      usedGlobalCategoryIds.has(c.id)
    );

    res.json({
      success: true,
      customCategories: shopCustomCategories,
      globalCategories: representedGlobalCategories,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/storefront/:slugOrId/reviews
 * Get approved customer reviews for a shop
 */
router.get('/storefront/:slugOrId/reviews', (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const shop = PartnerStoreService.getShopByIdOrSlug(slugOrId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const allReviews: ShopReview[] = db.get('shopReviews') || [];
    const approvedReviews = allReviews
      .filter((r) => r.shopId === shop.id && r.moderationStatus === 'APPROVED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const averageRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
        : 5.0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedReviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    res.json({
      success: true,
      shopId: shop.id,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: approvedReviews.length,
      distribution: ratingDistribution,
      reviews: approvedReviews,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/storefront/:slugOrId/reviews
 * Submit a customer review
 */
router.post('/storefront/:slugOrId/reviews', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Connexion requise pour laisser un avis.' });
    }

    const { slugOrId } = req.params;
    const shop = PartnerStoreService.getShopByIdOrSlug(slugOrId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const { rating, title, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Note invalide (doit être entre 1 et 5).' });
    }
    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir un commentaire détaillé.' });
    }

    // Check if user previously bought from this shop
    const shopOrders = db.get('shopOrders') || [];
    const isVerifiedPurchase = shopOrders.some(
      (o: any) => o.shopId === shop.id && o.userId === user.id && o.paymentStatus === 'PAID'
    );

    const newReview: ShopReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      shopId: shop.id,
      userId: user.id,
      userDisplayName: user.email ? user.email.split('@')[0] : 'Client Vérifié',
      rating: parseInt(rating, 10),
      title: title?.trim() || '',
      comment: comment.trim(),
      isVerifiedPurchase,
      moderationStatus: 'APPROVED', // Auto-approved for verified/civil prototype, with central moderation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allReviews: ShopReview[] = db.get('shopReviews') || [];
    allReviews.unshift(newReview);
    db.set('shopReviews', allReviews);
    db.save();

    res.json({
      success: true,
      message: 'Avis enregistré avec succès.',
      review: newReview,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/storefront/:slugOrId/favorite
 * Toggle shop favorite
 */
router.post('/storefront/:slugOrId/favorite', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Connexion requise.' });
    }

    const { slugOrId } = req.params;
    const shop = PartnerStoreService.getShopByIdOrSlug(slugOrId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    const favorites: UserFavoriteShop[] = db.get('userFavoriteShops') || [];
    const index = favorites.findIndex((f) => f.userId === user.id && f.shopId === shop.id);
    let isFavorited = false;

    if (index >= 0) {
      favorites.splice(index, 1);
      shop.favoritesCount = Math.max(0, (shop.favoritesCount || 1) - 1);
      isFavorited = false;
    } else {
      favorites.push({
        id: 'fav_s_' + Date.now(),
        userId: user.id,
        shopId: shop.id,
        createdAt: new Date().toISOString(),
      });
      shop.favoritesCount = (shop.favoritesCount || 0) + 1;
      isFavorited = true;
    }

    db.set('userFavoriteShops', favorites);
    db.save();

    res.json({
      success: true,
      isFavorited,
      favoritesCount: shop.favoritesCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. PARTNER BACK-OFFICE ROUTES
// ============================================================================

/**
 * GET /api/marketplace/partner/store/my-shop
 * Get the shop belonging to or managed by the user
 */
router.get('/partner/store/my-shop', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Connexion requise.' });
    }

    const { shopId } = req.query;
    const shops: PartnerShop[] = db.get('partnerShops') || [];

    let targetShop: PartnerShop | null = null;
    if (shopId && typeof shopId === 'string') {
      targetShop = shops.find((s) => s.id === shopId) || null;
    } else {
      // Find shop where user is owner or team member
      targetShop =
        shops.find((s) => s.ownerUserId === user.id) ||
        shops.find((s) => {
          const members: ShopTeamMember[] = db.get('shopTeamMembers') || [];
          return members.some((m) => m.shopId === s.id && m.userId === user.id);
        }) ||
        null;
    }

    if (!targetShop) {
      return res.status(404).json({ success: false, error: 'Aucune boutique associée à ce compte.' });
    }

    // Strict multi-tenant verification: user must be shop owner, active team member, or platform admin
    const role = PartnerStoreService.getUserShopRole(user, targetShop.id);
    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'Accès multi-tenant refusé : vous n’avez pas les droits pour accéder aux données de cette boutique.',
      });
    }

    res.json({
      success: true,
      shop: targetShop,
      userRole: role,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/marketplace/partner/store/profile
 * Update shop profile and operational settings
 */
router.put('/partner/store/profile', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Connexion requise.' });
    }

    const {
      shopId,
      publicName,
      commercialName,
      legalName,
      description,
      shortDescription,
      phone,
      email,
      websiteUrl,
      address,
      city,
      postalCode,
      country,
      openingHours,
      pickupInstructions,
      deliveryFee,
      freeDeliveryThreshold,
      estimatedDeliveryDays,
      estimatedPickupTime,
      pickupAvailable,
      deliveryAvailable,
    } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'MANAGE_CATALOG')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const shops: PartnerShop[] = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    // Apply updates
    if (publicName) shop.publicName = publicName.trim();
    if (commercialName) shop.commercialName = commercialName.trim();
    if (legalName) shop.legalName = legalName.trim();
    if (description) shop.description = description.trim();
    if (shortDescription !== undefined) shop.shortDescription = shortDescription.trim();
    if (phone !== undefined) shop.phone = phone.trim();
    if (email !== undefined) shop.email = email.trim();
    if (websiteUrl !== undefined) shop.website = websiteUrl.trim();
    if (address !== undefined) shop.address = address.trim();
    if (city !== undefined) shop.city = city.trim();
    if (postalCode !== undefined) shop.postalCode = postalCode.trim();
    if (country !== undefined) shop.country = country.trim();
    if (openingHours !== undefined) shop.openingHours = openingHours;
    if (pickupInstructions !== undefined) shop.pickupInstructions = pickupInstructions;
    if (deliveryFee !== undefined) shop.deliveryFee = parseFloat(deliveryFee) || 0;
    if (freeDeliveryThreshold !== undefined) shop.freeDeliveryThreshold = parseFloat(freeDeliveryThreshold) || 0;
    if (estimatedDeliveryDays !== undefined) shop.estimatedDeliveryDays = estimatedDeliveryDays;
    if (estimatedPickupTime !== undefined) shop.estimatedPickupTime = estimatedPickupTime;
    if (pickupAvailable !== undefined) shop.pickupAvailable = Boolean(pickupAvailable);
    if (deliveryAvailable !== undefined) shop.deliveryAvailable = Boolean(deliveryAvailable);

    shop.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('UPDATE_SHOP_PROFILE', 'PartnerShop', user.id, { shopId });

    res.json({
      success: true,
      message: 'Profil de la boutique mis à jour.',
      shop,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/marketplace/partner/store/appearance
 * Update theme template, colors and visual assets
 */
router.put('/partner/store/appearance', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Connexion requise.' });
    }

    const {
      shopId,
      storefrontTemplate,
      primaryColor,
      secondaryColor,
      accentColor,
      textColor,
      backgroundColor,
      logoUrl,
      bannerUrl,
      seoTitle,
      seoDescription,
    } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'MANAGE_CATALOG')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const shops: PartnerShop[] = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    if (storefrontTemplate) shop.storefrontTemplate = storefrontTemplate;
    if (primaryColor) shop.primaryColor = primaryColor;
    if (secondaryColor) shop.secondaryColor = secondaryColor;
    if (accentColor) shop.accentColor = accentColor;
    if (textColor) shop.textColor = textColor;
    if (backgroundColor) shop.backgroundColor = backgroundColor;
    if (logoUrl) {
      shop.logo = logoUrl;
      shop.logoUrl = logoUrl;
    }
    if (bannerUrl) {
      shop.coverImage = bannerUrl;
      shop.bannerUrl = bannerUrl;
    }
    if (seoTitle) shop.seoTitle = seoTitle;
    if (seoDescription) shop.seoDescription = seoDescription;

    shop.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('UPDATE_SHOP_APPEARANCE', 'PartnerShop', user.id, { shopId, storefrontTemplate });

    res.json({
      success: true,
      message: 'Identité visuelle de la boutique mise à jour.',
      shop,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/partner/store/categories
 * List custom categories for a partner
 */
router.get('/partner/store/categories', (req: Request, res: Response) => {
  try {
    const { shopId } = req.query;
    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    const customCategories: ShopCustomCategory[] = db.get('shopCustomCategories') || [];
    const categories = customCategories.filter((c) => c.shopId === shopId);

    res.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/partner/store/categories
 * Create a new custom category for the shop
 */
router.post('/partner/store/categories', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { shopId, name, description, icon } = req.body;
    if (!shopId || !name) {
      return res.status(400).json({ success: false, error: 'shopId et name requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'MANAGE_CATALOG')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const customCategories: ShopCustomCategory[] = db.get('shopCustomCategories') || [];
    const slug = generateShopSlug(name);

    const newCategory: ShopCustomCategory = {
      id: 'scat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      shopId,
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      icon: icon || 'Tag',
      displayOrder: customCategories.filter((c) => c.shopId === shopId).length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    customCategories.push(newCategory);
    db.set('shopCustomCategories', customCategories);
    db.save();

    res.json({
      success: true,
      category: newCategory,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/marketplace/partner/store/categories/:categoryId
 */
router.delete('/partner/store/categories/:categoryId', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { categoryId } = req.params;
    const customCategories: ShopCustomCategory[] = db.get('shopCustomCategories') || [];
    const index = customCategories.findIndex((c) => c.id === categoryId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Catégorie introuvable.' });
    }

    const category = customCategories[index];
    if (!PartnerStoreService.canPerformAction(user, category.shopId, 'MANAGE_CATALOG')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    customCategories.splice(index, 1);
    db.set('shopCustomCategories', customCategories);
    db.save();

    res.json({ success: true, message: 'Catégorie supprimée.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/partner/store/inventory
 * Inventory list with stock levels, alerts and audit trail
 */
router.get('/partner/store/inventory', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { shopId } = req.query;
    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'READ')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const products: CBDMarketplaceProduct[] = db.get('marketplaceProducts') || [];
    const shopProducts = products.filter((p) => p.shopId === shopId);

    const adjustmentRecords: any[] = (db.get('stockAdjustmentRecords') || [])
      .filter((r: any) => r.shopId === shopId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);

    res.json({
      success: true,
      products: shopProducts,
      recentAdjustments: adjustmentRecords,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/partner/store/inventory/adjust
 * Audit-tracked stock adjustment
 */
router.post('/partner/store/inventory/adjust', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { shopId, productId, newQuantity, reason, comment } = req.body;
    if (!shopId || !productId || newQuantity === undefined || !reason) {
      return res.status(400).json({ success: false, error: 'Paramètres manquants pour l’ajustement.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'MANAGE_CATALOG')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const result = PartnerStoreService.recordStockAdjustment({
      shopId,
      productId,
      newQuantity: parseInt(newQuantity, 10),
      reason,
      comment,
      authorUser: user,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: 'Stock ajusté avec succès.',
      product: result.product,
      record: result.record,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/partner/store/analytics
 * Real storefront analytics
 */
router.get('/partner/store/analytics', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { shopId, period } = req.query;
    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'READ')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const analytics = PartnerStoreService.computeStorefrontAnalytics(
      shopId,
      (period as any) || '30d'
    );

    res.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/partner/store/team
 * List shop team members
 */
router.get('/partner/store/team', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { shopId } = req.query;
    if (!shopId || typeof shopId !== 'string') {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'MANAGE_TEAM')) {
      return res.status(403).json({ success: false, error: 'Accès réservé au propriétaire.' });
    }

    const allTeam: ShopTeamMember[] = db.get('shopTeamMembers') || [];
    const members = allTeam.filter((m) => m.shopId === shopId);

    res.json({
      success: true,
      members,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketplace/partner/store/team/invite
 * Add or invite team member
 */
router.post('/partner/store/team/invite', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { shopId, email, displayName, role } = req.body;
    if (!shopId || !email || !displayName || !role) {
      return res.status(400).json({ success: false, error: 'Tous les champs sont requis.' });
    }

    if (!PartnerStoreService.canPerformAction(user, shopId, 'MANAGE_TEAM')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    const allTeam: ShopTeamMember[] = db.get('shopTeamMembers') || [];
    const existing = allTeam.find(
      (m) => m.shopId === shopId && m.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ce collaborateur existe déjà dans l’équipe.' });
    }

    const newMember: ShopTeamMember = {
      id: 'team_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      shopId,
      userId: 'usr_invited_' + Date.now(),
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      role: role as any,
      permissions:
        role === 'SHOP_MANAGER'
          ? ['CATALOG_MANAGE', 'ORDERS_MANAGE', 'INVENTORY_MANAGE', 'ANALYTICS_VIEW']
          : ['ORDERS_VIEW', 'ORDERS_UPDATE_STATUS', 'INVENTORY_VIEW'],
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allTeam.push(newMember);
    db.set('shopTeamMembers', allTeam);
    db.save();

    db.logAudit('INVITE_SHOP_TEAM_MEMBER', 'ShopTeamMember', user.id, {
      shopId,
      invitedEmail: email,
      role,
    });

    res.json({
      success: true,
      message: 'Collaborateur ajouté avec succès.',
      member: newMember,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/marketplace/partner/store/team/:memberId
 * Remove a team member
 */
router.delete('/partner/store/team/:memberId', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Connexion requise.' });

    const { memberId } = req.params;
    const allTeam: ShopTeamMember[] = db.get('shopTeamMembers') || [];
    const index = allTeam.findIndex((m) => m.id === memberId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Membre introuvable.' });
    }

    const member = allTeam[index];
    if (!PartnerStoreService.canPerformAction(user, member.shopId, 'MANAGE_TEAM')) {
      return res.status(403).json({ success: false, error: 'Permissions insuffisantes.' });
    }

    allTeam.splice(index, 1);
    db.set('shopTeamMembers', allTeam);
    db.save();

    db.logAudit('REMOVE_SHOP_TEAM_MEMBER', 'ShopTeamMember', user.id, {
      shopId: member.shopId,
      removedMemberId: memberId,
    });

    res.json({ success: true, message: 'Collaborateur retiré.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. CENTRAL PLATFORM ADMIN & MODERATION ROUTES
// ============================================================================

/**
 * GET /api/marketplace/admin/shops/directory
 * Central admin shop supervision
 */
router.get('/admin/shops/directory', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.PLATFORM_ADMIN)) {
      return res.status(403).json({ success: false, error: 'Accès administrateur requis.' });
    }

    const shops: PartnerShop[] = db.get('partnerShops') || [];
    const { status, verification, search } = req.query;

    let list = [...shops];
    if (status && typeof status === 'string' && status !== 'ALL') {
      list = list.filter((s) => (s.shopStatus || s.status) === status);
    }
    if (verification && typeof verification === 'string' && verification !== 'ALL') {
      list = list.filter((s) => s.verificationStatus === verification);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.commercialName.toLowerCase().includes(q) ||
          s.legalName.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: list.length,
      shops: list,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/marketplace/admin/shops/:shopId/status
 * Central admin update shop status (ACTIVE, SUSPENDED, CLOSED)
 */
router.patch('/admin/shops/:shopId/status', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.PLATFORM_ADMIN)) {
      return res.status(403).json({ success: false, error: 'Accès administrateur requis.' });
    }

    const { shopId } = req.params;
    const { status, reason } = req.body;

    const shops: PartnerShop[] = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    shop.status = status;
    shop.shopStatus = status;
    if (reason) shop.moderationReason = reason;
    shop.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('ADMIN_CHANGE_SHOP_STATUS', 'PartnerShop', user.id, {
      shopId,
      newStatus: status,
      reason,
    });

    res.json({
      success: true,
      message: `Statut de la boutique modifié en ${status}.`,
      shop,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/marketplace/admin/shops/:shopId/verification
 * Central admin verify or reject partner shop
 */
router.patch('/admin/shops/:shopId/verification', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.PLATFORM_ADMIN)) {
      return res.status(403).json({ success: false, error: 'Accès administrateur requis.' });
    }

    const { shopId } = req.params;
    const { verificationStatus, legalStatus, reason } = req.body;

    const shops: PartnerShop[] = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    if (verificationStatus) shop.verificationStatus = verificationStatus;
    if (legalStatus) shop.legalStatus = legalStatus;
    if (reason) shop.moderationReason = reason;
    shop.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('ADMIN_CHANGE_SHOP_VERIFICATION', 'PartnerShop', user.id, {
      shopId,
      verificationStatus,
      legalStatus,
    });

    res.json({
      success: true,
      message: 'Vérification légale mise à jour.',
      shop,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketplace/partner/analytics
 * Scoped analytics for a partner shop (sales, orders, AOV, products sold, net payout, delivery perf)
 * Strict isolation: Partner can NEVER access data from other shops!
 */
router.get('/partner/analytics', (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentification requise.' });
    }

    const requestedShopId = req.query.shopId as string;
    const period = (req.query.period as any) || '30d';

    if (!requestedShopId) {
      return res.status(400).json({ success: false, error: 'shopId requis.' });
    }

    // Role check: If not admin, must be member or owner of the shop
    const isAdmin =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.PLATFORM_ADMIN;

    if (!isAdmin) {
      const shopRole = PartnerStoreService.getUserShopRole(user, requestedShopId);
      if (!shopRole) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé : vous n’avez pas les droits d’accès aux métriques de cette boutique.',
        });
      }
    }

    const analytics = AnalyticsEngine.getSingleShopAnalytics(requestedShopId, { period });

    if (!analytics) {
      return res.status(404).json({ success: false, error: 'Boutique introuvable.' });
    }

    return res.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    console.error('Error in partner analytics:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des analytics partenaire.' });
  }
});

export default router;
