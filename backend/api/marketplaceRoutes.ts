import { Router, Response } from 'express';
import { db } from '../db/database';
import {
  requireAuth,
  optionalAuth,
  AuthenticatedRequest,
} from '../auth/auth';
import {
  UserRole,
  PartnerShop,
  CBDMarketplaceProduct,
  CBDProduct,
  CBDUserProduct,
  UserFavoriteProduct,
  UserFavoriteShop,
  ProductViewHistory,
  ShopViewHistory,
  MarketplaceCommissionRule,
  ProductStockStatus,
  ProductConsumptionMode,
  MarketplaceProductStatus,
} from '../../src/types/entities';

const router = Router();

// ============================================================================
// HELPER PERMISSION FUNCTIONS
// ============================================================================

export function isPlatformAdmin(role?: UserRole): boolean {
  if (!role) return false;
  return (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.PLATFORM_ADMIN ||
    role === UserRole.MODERATOR
  );
}

export function canManageShop(user: any, shopId: string): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user.role)) return true;

  const shops = db.get('partnerShops');
  const shop = shops.find((s) => s.id === shopId);
  if (shop && shop.ownerUserId === user.id) return true;

  const storeAdmins = db.get('storeAdmins') || [];
  const adminEntry = storeAdmins.find(
    (sa) => sa.storeId === shopId && sa.userId === user.id
  );
  if (adminEntry) return true;

  return false;
}

// ============================================================================
// PUBLIC & DISCOVERY ENDPOINTS
// ============================================================================

// 1. GET ALL ACTIVE CATEGORIES
router.get('/categories', (_req, res) => {
  try {
    const categories = db.get('productCategories') || [];
    const active = categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return res.json({ categories: active });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du chargement des catégories.' });
  }
});

// 2. GET PARTNER SHOPS (Search, City, Status, Pagination)
router.get('/shops', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, city, status = 'ACTIVE', page = '1', limit = '12' } = req.query;
    let shops = db.get('partnerShops') || [];

    // Filter by status (unless admin viewing all)
    if (!isPlatformAdmin(req.user?.role)) {
      shops = shops.filter((s) => s.status === 'ACTIVE');
    } else if (status && status !== 'ALL') {
      shops = shops.filter((s) => s.status === status);
    }

    if (city && typeof city === 'string' && city.trim() !== '') {
      const cLower = city.trim().toLowerCase();
      shops = shops.filter((s) => s.city.toLowerCase().includes(cLower));
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      shops = shops.filter(
        (s) =>
          s.commercialName.toLowerCase().includes(q) ||
          s.legalName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.postalCode.includes(q)
      );
    }

    const totalCount = shops.length;
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const paginated = shops.slice((p - 1) * l, p * l);

    // Enrich with productsCount
    const products = db.get('marketplaceProducts') || [];
    const enriched = paginated.map((s) => {
      const prodCount = products.filter(
        (pr) => pr.shopId === s.id && pr.status === 'PUBLISHED'
      ).length;
      return {
        ...s,
        productsCount: prodCount,
      };
    });

    return res.json({
      shops: enriched,
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        totalPages: Math.ceil(totalCount / l),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la recherche des boutiques.' });
  }
});

// 3. GET SINGLE PARTNER SHOP DETAILS
router.get('/shops/:shopId', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const shops = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);

    if (!shop) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    // Increment viewsCount
    shop.viewsCount = (shop.viewsCount || 0) + 1;
    db.save();

    // Record view in history if user authenticated
    if (req.user) {
      const histories = db.get('shopViewHistory') || [];
      histories.push({
        id: 'svh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: req.user.id,
        shopId: shop.id,
        viewedAt: new Date().toISOString(),
      });
      db.set('shopViewHistory', histories);
    }

    // Check favorite status for current user
    let isFavorite = false;
    if (req.user) {
      const favs = db.get('userFavoriteShops') || [];
      isFavorite = favs.some((f) => f.userId === req.user!.id && f.shopId === shop.id);
    }

    const products = db.get('marketplaceProducts') || [];
    const productsCount = products.filter(
      (pr) => pr.shopId === shop.id && pr.status === 'PUBLISHED'
    ).length;

    return res.json({
      shop: {
        ...shop,
        productsCount,
        isFavorite,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du chargement de la boutique.' });
  }
});

// 4. GET SHOP PRODUCTS
router.get('/shops/:shopId/products', (req, res) => {
  try {
    const { shopId } = req.params;
    const { category, search, page = '1', limit = '12' } = req.query;

    let products = db.get('marketplaceProducts') || [];
    products = products.filter((p) => p.shopId === shopId && p.status === 'PUBLISHED');

    if (category && category !== 'ALL') {
      products = products.filter(
        (p) => p.categoryId === category || p.category === category
      );
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    const totalCount = products.length;
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const paginated = products.slice((p - 1) * l, p * l);

    return res.json({
      products: paginated,
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        totalPages: Math.ceil(totalCount / l),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du chargement des produits de la boutique.' });
  }
});

// 5. NATIONAL SEARCH & MARKETPLACE PRODUCT CATALOG
router.get('/products', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      category,
      consumptionMode,
      city,
      brand,
      minPrice,
      maxPrice,
      inStockOnly,
      verifiedShopOnly,
      sortBy = 'popular',
      page = '1',
      limit = '12',
    } = req.query;

    let products = db.get('marketplaceProducts') || [];
    const shops = db.get('partnerShops') || [];
    const categories = db.get('productCategories') || [];

    // Filter published only (or drafts if own partner/admin)
    products = products.filter((p) => p.status === 'PUBLISHED');

    // Filter by category
    if (category && category !== 'ALL') {
      products = products.filter(
        (p) => p.categoryId === category || p.category === category
      );
    }

    // Filter by consumption mode
    if (consumptionMode && consumptionMode !== 'ALL') {
      products = products.filter((p) => p.consumptionMode === consumptionMode);
    }

    // Filter by brand
    if (brand && typeof brand === 'string' && brand.trim() !== '') {
      products = products.filter(
        (p) => p.brand.toLowerCase() === brand.trim().toLowerCase()
      );
    }

    // Filter by price range
    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) products = products.filter((p) => p.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) products = products.filter((p) => p.price <= max);
    }

    // Filter by stock
    if (inStockOnly === 'true' || inStockOnly === '1') {
      products = products.filter((p) => p.stockStatus !== 'OUT_OF_STOCK' && p.stockQuantity > 0);
    }

    // City & Search query
    let matchingShopIds: Set<string> | null = null;
    if (city && typeof city === 'string' && city.trim() !== '') {
      const cLower = city.trim().toLowerCase();
      matchingShopIds = new Set(
        shops
          .filter((s) => s.city.toLowerCase().includes(cLower))
          .map((s) => s.id)
      );
    }

    if (matchingShopIds !== null) {
      products = products.filter((p) => matchingShopIds!.has(p.shopId));
    }

    // Verified shop only filter
    if (verifiedShopOnly === 'true' || verifiedShopOnly === '1') {
      const verifiedIds = new Set(
        shops.filter((s) => s.verificationStatus === 'VERIFIED').map((s) => s.id)
      );
      products = products.filter((p) => verifiedIds.has(p.shopId));
    }

    // General text search (name, brand, description, ingredients, city)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter((p) => {
        const shop = shops.find((s) => s.id === p.shopId);
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchShortDesc = p.shortDescription ? p.shortDescription.toLowerCase().includes(q) : false;
        const matchIngredients = p.ingredients ? p.ingredients.some((ing) => ing.toLowerCase().includes(q)) : false;
        const matchShop = shop ? shop.commercialName.toLowerCase().includes(q) || shop.city.toLowerCase().includes(q) : false;
        return matchName || matchBrand || matchDesc || matchShortDesc || matchIngredients || matchShop;
      });
    }

    // Sorting
    if (sortBy === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'cbd_desc') {
      products.sort((a, b) => (b.declaredCBDPercentage || 0) - (a.declaredCBDPercentage || 0));
    } else {
      // 'popular' default
      products.sort((a, b) => ((b.viewsCount || 0) + (b.favoritesCount || 0) * 3) - ((a.viewsCount || 0) + (a.favoritesCount || 0) * 3));
    }

    const totalCount = products.length;
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const paginated = products.slice((p - 1) * l, p * l);

    // Enrich with Shop details & Category details
    const userFavs = req.user ? db.get('userFavoriteProducts') || [] : [];
    const enriched = paginated.map((prod) => {
      const shop = shops.find((s) => s.id === prod.shopId);
      const cat = categories.find((c) => c.id === prod.categoryId || c.slug === prod.category);
      const isFav = req.user ? userFavs.some((f) => f.userId === req.user!.id && f.productId === prod.id) : false;
      return {
        ...prod,
        shopName: shop ? shop.commercialName : 'Boutique Partenaire',
        shopCity: shop ? shop.city : 'France',
        shopIsVerified: shop ? shop.verificationStatus === 'VERIFIED' : false,
        shopBadges: shop ? shop.badges : [],
        categoryName: cat ? cat.name : prod.category,
        isFavorite: isFav,
      };
    });

    return res.json({
      products: enriched,
      pagination: {
        page: p,
        limit: l,
        total: totalCount,
        totalPages: Math.ceil(totalCount / l),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la recherche des produits.' });
  }
});

// 6. GET SINGLE PRODUCT FULL DETAILS
router.get('/products/:productId', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const products = db.get('marketplaceProducts') || [];
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    // Increment viewsCount
    product.viewsCount = (product.viewsCount || 0) + 1;
    db.save();

    // Record view in history
    if (req.user) {
      const histories = db.get('productViewHistory') || [];
      histories.push({
        id: 'pvh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: req.user.id,
        productId: product.id,
        shopId: product.shopId,
        viewedAt: new Date().toISOString(),
      });
      db.set('productViewHistory', histories);
    }

    const shops = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === product.shopId);

    const categories = db.get('productCategories') || [];
    const cat = categories.find((c) => c.id === product.categoryId || c.slug === product.category);

    let isFavorite = false;
    let isTrackedInPersonalCBD = false;

    if (req.user) {
      const favs = db.get('userFavoriteProducts') || [];
      isFavorite = favs.some((f) => f.userId === req.user!.id && f.productId === product.id);

      const userProds = db.get('cbdUserProducts') || [];
      isTrackedInPersonalCBD = userProds.some(
        (up) => up.userId === req.user!.id && up.productId === product.id
      );
    }

    return res.json({
      product: {
        ...product,
        shop: shop || null,
        categoryDetails: cat || null,
        isFavorite,
        isTrackedInPersonalCBD,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du chargement du produit.' });
  }
});

// ============================================================================
// USER FAVORITES & MODULE 3 TRACKING INTEGRATION
// ============================================================================

// 7. TOGGLE PRODUCT FAVORITE
router.post('/products/:productId/favorite', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.id;
    const products = db.get('marketplaceProducts') || [];
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const favs = db.get('userFavoriteProducts') || [];
    const existingIndex = favs.findIndex((f) => f.userId === userId && f.productId === productId);

    let isFavorite = false;
    if (existingIndex >= 0) {
      favs.splice(existingIndex, 1);
      product.favoritesCount = Math.max(0, (product.favoritesCount || 1) - 1);
      isFavorite = false;
    } else {
      favs.push({
        id: 'ufp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        productId,
        shopId: product.shopId,
        createdAt: new Date().toISOString(),
      });
      product.favoritesCount = (product.favoritesCount || 0) + 1;
      isFavorite = true;
    }

    db.set('userFavoriteProducts', favs);
    db.save();

    return res.json({ isFavorite, favoritesCount: product.favoritesCount });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des favoris.' });
  }
});

// 8. TOGGLE SHOP FAVORITE
router.post('/shops/:shopId/favorite', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const userId = req.user!.id;
    const shops = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);

    if (!shop) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    const favs = db.get('userFavoriteShops') || [];
    const existingIndex = favs.findIndex((f) => f.userId === userId && f.shopId === shopId);

    let isFavorite = false;
    if (existingIndex >= 0) {
      favs.splice(existingIndex, 1);
      shop.favoritesCount = Math.max(0, (shop.favoritesCount || 1) - 1);
      isFavorite = false;
    } else {
      favs.push({
        id: 'ufs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        shopId,
        createdAt: new Date().toISOString(),
      });
      shop.favoritesCount = (shop.favoritesCount || 0) + 1;
      isFavorite = true;
    }

    db.set('userFavoriteShops', favs);
    db.save();

    return res.json({ isFavorite, favoritesCount: shop.favoritesCount });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des boutiques favorites.' });
  }
});

// 9. GET USER FAVORITES (PRODUCTS & SHOPS)
router.get('/user/favorites', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const favProds = db.get('userFavoriteProducts') || [];
    const favShops = db.get('userFavoriteShops') || [];
    const products = db.get('marketplaceProducts') || [];
    const shops = db.get('partnerShops') || [];

    const userFavProds = favProds
      .filter((f) => f.userId === userId)
      .map((f) => {
        const prod = products.find((p) => p.id === f.productId);
        const shop = prod ? shops.find((s) => s.id === prod.shopId) : null;
        return prod
          ? {
              ...prod,
              shopName: shop ? shop.commercialName : '',
              shopCity: shop ? shop.city : '',
              favoriteCreatedAt: f.createdAt,
            }
          : null;
      })
      .filter(Boolean);

    const userFavShops = favShops
      .filter((f) => f.userId === userId)
      .map((f) => {
        const shop = shops.find((s) => s.id === f.shopId);
        return shop
          ? {
              ...shop,
              favoriteCreatedAt: f.createdAt,
            }
          : null;
      })
      .filter(Boolean);

    return res.json({
      favoriteProducts: userFavProds,
      favoriteShops: userFavShops,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement favoris.' });
  }
});

// 10. GET USER BROWSING HISTORY
router.get('/user/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const pHist = db.get('productViewHistory') || [];
    const sHist = db.get('shopViewHistory') || [];
    const products = db.get('marketplaceProducts') || [];
    const shops = db.get('partnerShops') || [];

    const recentProductViews = pHist
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 10)
      .map((h) => {
        const prod = products.find((p) => p.id === h.productId);
        return prod ? { ...prod, viewedAt: h.viewedAt } : null;
      })
      .filter(Boolean);

    const recentShopViews = sHist
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 5)
      .map((h) => {
        const shop = shops.find((s) => s.id === h.shopId);
        return shop ? { ...shop, viewedAt: h.viewedAt } : null;
      })
      .filter(Boolean);

    return res.json({
      recentProductViews,
      recentShopViews,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement historique.' });
  }
});

// 11. LINK TO MODULE 3: ADD TO PERSONAL TRACKED CBD PRODUCTS
router.post('/products/:productId/track-cbd', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.id;

    const mktProducts = db.get('marketplaceProducts') || [];
    const mktProd = mktProducts.find((p) => p.id === productId);
    if (!mktProd) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const cbdUserProducts = db.get('cbdUserProducts') || [];
    const existing = cbdUserProducts.find(
      (up) => up.userId === userId && up.productId === productId
    );

    if (existing) {
      return res.json({
        success: true,
        message: 'Ce produit fait déjà partie de vos produits CBD suivis.',
        userProduct: existing,
      });
    }

    // Also ensure this product exists in cbdProducts collection for backward compat
    const baseCbdProducts = db.get('cbdProducts') || [];
    let baseProd = baseCbdProducts.find((p) => p.id === productId);
    if (!baseProd) {
      baseProd = {
        id: mktProd.id,
        name: mktProd.name,
        brand: mktProd.brand,
        description: mktProd.description,
        category: (mktProd.category as any) || 'CBD_oil',
        productType: mktProd.productType,
        imageUrl: mktProd.images[0] || undefined,
        cbdPercentage: mktProd.declaredCBDPercentage,
        thcPercentage: mktProd.declaredTHCPercentage,
        cbdAmount: mktProd.cannabinoidProfile?.cbd || null,
        cannabinoidProfile: mktProd.cannabinoidProfile as any,
        terpeneProfile: mktProd.terpeneProfile,
        quantity: mktProd.quantityPerUnit,
        quantityUnit: mktProd.unit,
        volumeOrWeight: `${mktProd.quantityPerUnit} ${mktProd.unit}`,
        ingredients: mktProd.ingredients,
        carrierOil: mktProd.ingredients?.find((i) => i.toLowerCase().includes('huile')),
        batchNumber: mktProd.batchNumber,
        shopId: mktProd.shopId,
        storeId: mktProd.shopId,
        sourceType: 'partner',
        barcode: mktProd.barcode,
        qrCode: mktProd.qrCode,
        price: mktProd.price,
        currency: mktProd.currency,
        countryOfOrigin: mktProd.origin,
        qualityInformation: mktProd.qualityInformation,
        inStock: mktProd.stockStatus !== 'OUT_OF_STOCK',
        featured: false,
        isUserCreated: false,
        userId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      baseCbdProducts.push(baseProd);
      db.set('cbdProducts', baseCbdProducts);
    }

    // Create entry in cbdUserProducts
    const newUserProduct: CBDUserProduct = {
      id: 'cup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      productId: mktProd.id,
      isFavorite: false,
      customNotes: `Ajouté depuis la marketplace partenaire (${mktProd.brand})`,
      timesConsumed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cbdUserProducts.push(newUserProduct);
    db.set('cbdUserProducts', cbdUserProducts);

    db.logAudit(
      'TRACK_MARKETPLACE_PRODUCT',
      'CBDUserProduct',
      userId,
      { productId: mktProd.id, shopId: mktProd.shopId }
    );

    return res.json({
      success: true,
      message: 'Produit ajouté avec succès à vos produits CBD suivis (Module 3).',
      userProduct: newUserProduct,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l’ajout aux produits suivis.' });
  }
});

// ============================================================================
// PARTNER SPACE & SHOP OWNER ENDPOINTS
// ============================================================================

// 12. GET SHOPS MANAGED BY CURRENT USER
router.get('/partner/my-shops', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const shops = db.get('partnerShops') || [];

    let managedShops: PartnerShop[] = [];
    if (isPlatformAdmin(user.role)) {
      managedShops = shops;
    } else {
      const storeAdmins = db.get('storeAdmins') || [];
      const adminStoreIds = new Set(
        storeAdmins.filter((sa) => sa.userId === user.id).map((sa) => sa.storeId)
      );
      managedShops = shops.filter(
        (s) => s.ownerUserId === user.id || adminStoreIds.has(s.id)
      );
    }

    return res.json({ shops: managedShops });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement boutiques partenaires.' });
  }
});

// 13. CREATE NEW PARTNER SHOP APPLICATION
router.post('/partner/shops', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      commercialName,
      legalName,
      description,
      address,
      city,
      postalCode,
      country = 'France',
      phone,
      email,
      website,
      openingHours,
      socialLinks,
      logo,
      coverImage,
    } = req.body;

    if (!commercialName || !legalName || !city || !address || !email) {
      return res.status(400).json({
        error: 'Veuillez renseigner tous les champs obligatoires (nom commercial, raison sociale, ville, adresse, email).',
      });
    }

    const shops = db.get('partnerShops') || [];
    const newShopId = 'shop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newShop: PartnerShop = {
      id: newShopId,
      ownerUserId: user.id,
      legalName,
      commercialName,
      description: description || '',
      logo: logo || undefined,
      coverImage: coverImage || undefined,
      email,
      phone: phone || undefined,
      website: website || undefined,
      address,
      city,
      postalCode: postalCode || '',
      country,
      openingHours: openingHours || {
        'Lundi - Vendredi': '09:30 - 19:00',
        'Samedi': '10:00 - 19:00',
        'Dimanche': 'Fermé',
      },
      socialLinks: socialLinks || {},
      status: 'PENDING',
      verificationStatus: 'PENDING_REVIEW',
      badges: ['Candidature Partenaire'],
      viewsCount: 0,
      favoritesCount: 0,
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    shops.push(newShop);
    db.set('partnerShops', shops);

    // Sync to storeAdmins
    const storeAdmins = db.get('storeAdmins') || [];
    storeAdmins.push({
      id: 'sa_' + Date.now(),
      storeId: newShopId,
      userId: user.id,
      role: 'owner',
    });
    db.set('storeAdmins', storeAdmins);

    // Also sync to legacy cbdStores for backward compatibility
    const legacyStores = db.get('cbdStores') || [];
    legacyStores.push({
      id: newShopId,
      name: commercialName,
      legalEntity: legalName,
      registrationNumber: `REG-${newShopId}`,
      city,
      country,
      description: description || '',
      verified: false,
      createdAt: new Date().toISOString(),
    });
    db.set('cbdStores', legacyStores);

    db.logAudit('CREATE_PARTNER_SHOP', 'PartnerShop', user.id, { shopId: newShopId, commercialName });

    return res.status(201).json({
      success: true,
      message: 'Demande d’adhésion partenaire créée avec succès. En attente de vérification par l’équipe Nexus.',
      shop: newShop,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la création de la boutique partenaire.' });
  }
});

// 14. UPDATE PARTNER SHOP PROFILE
router.put('/partner/shops/:shopId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const user = req.user!;

    if (!canManageShop(user, shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé pour cette boutique.' });
    }

    const shops = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    const {
      commercialName,
      legalName,
      description,
      address,
      city,
      postalCode,
      phone,
      email,
      website,
      openingHours,
      socialLinks,
      logo,
      coverImage,
    } = req.body;

    if (commercialName) shop.commercialName = commercialName;
    if (legalName) shop.legalName = legalName;
    if (description !== undefined) shop.description = description;
    if (address) shop.address = address;
    if (city) shop.city = city;
    if (postalCode !== undefined) shop.postalCode = postalCode;
    if (phone !== undefined) shop.phone = phone;
    if (email) shop.email = email;
    if (website !== undefined) shop.website = website;
    if (openingHours) shop.openingHours = openingHours;
    if (socialLinks) shop.socialLinks = socialLinks;
    if (logo !== undefined) shop.logo = logo;
    if (coverImage !== undefined) shop.coverImage = coverImage;
    shop.updatedAt = new Date().toISOString();

    db.save();

    // Update legacy cbdStore if present
    const legacyStores = db.get('cbdStores') || [];
    const leg = legacyStores.find((s) => s.id === shopId);
    if (leg) {
      leg.name = shop.commercialName;
      leg.legalEntity = shop.legalName;
      leg.city = shop.city;
      leg.description = shop.description;
      db.save();
    }

    db.logAudit('UPDATE_PARTNER_SHOP', 'PartnerShop', user.id, { shopId });

    return res.json({
      success: true,
      message: 'Profil de la boutique mis à jour.',
      shop,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour boutique.' });
  }
});

// 15. GET PARTNER SHOP ANALYTICS & STATS
router.get('/partner/shops/:shopId/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const user = req.user!;

    if (!canManageShop(user, shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const shops = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    const products = db.get('marketplaceProducts') || [];
    const shopProducts = products.filter((p) => p.shopId === shopId);

    const totalProducts = shopProducts.length;
    const publishedProducts = shopProducts.filter((p) => p.status === 'PUBLISHED').length;
    const draftProducts = shopProducts.filter((p) => p.status === 'DRAFT').length;
    const outOfStockCount = shopProducts.filter(
      (p) => p.stockStatus === 'OUT_OF_STOCK' || p.stockQuantity <= 0
    ).length;

    let totalProductViews = 0;
    let totalProductFavorites = 0;
    shopProducts.forEach((p) => {
      totalProductViews += p.viewsCount || 0;
      totalProductFavorites += p.favoritesCount || 0;
    });

    const commRules = db.get('commissionRules') || [];
    const rule = commRules.find((r) => r.shopId === shopId && r.isActive) || commRules.find((r) => !r.shopId && r.isActive);

    const audits = db.get('auditLogs') || [];
    const recentActivity = audits
      .filter((a) => a.details?.shopId === shopId)
      .slice(0, 10);

    return res.json({
      stats: {
        shopViews: shop.viewsCount || 0,
        shopFavorites: shop.favoritesCount || 0,
        totalProducts,
        publishedProducts,
        draftProducts,
        outOfStockCount,
        totalProductViews,
        totalProductFavorites,
      },
      commissionRule: rule || null,
      recentActivity,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement statistiques partenaire.' });
  }
});

// 16. GET ALL PRODUCTS FOR A PARTNER SHOP (WITH DRAFTS/STATUSES)
router.get('/partner/shops/:shopId/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const user = req.user!;

    if (!canManageShop(user, shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const { status, search } = req.query;
    let products = db.get('marketplaceProducts') || [];
    products = products.filter((p) => p.shopId === shopId);

    if (status && status !== 'ALL') {
      products = products.filter((p) => p.status === status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
      );
    }

    return res.json({ products });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement catalogue partenaire.' });
  }
});

// 17. CREATE PRODUCT (FULL 7-STEP COMPLIANT DATA MODEL)
router.post('/partner/shops/:shopId/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const user = req.user!;

    if (!canManageShop(user, shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const {
      name,
      brand,
      categoryId,
      category,
      consumptionMode = 'SUBLINGUAL',
      description,
      shortDescription,
      productType,
      images = [],
      price,
      currency = 'EUR',
      stockQuantity = 0,
      stockStatus = 'IN_STOCK',
      unit = 'g',
      quantityPerUnit = 1,
      declaredCBDPercentage = null,
      declaredTHCPercentage = 0.0,
      cannabinoidProfile,
      terpeneProfile = [],
      ingredients = [],
      allergens = [],
      batchNumber,
      barcode,
      qrCode,
      origin = 'France',
      qualityInformation,
      laboratoryInformation,
      manufacturerInformation,
      productWarnings = [],
      legalInformation,
      status = 'PUBLISHED',
    } = req.body;

    if (!name || !brand || !price) {
      return res.status(400).json({ error: 'Le nom, la marque et le prix sont obligatoires.' });
    }

    // STRICT LEGAL GUARDRAIL: THC must be <= 0.3%
    const thcVal = declaredTHCPercentage !== null ? parseFloat(declaredTHCPercentage) : 0;
    if (thcVal > 0.3) {
      return res.status(400).json({
        error: 'Conformité légale refusée : Le taux de THC déclaré ne peut pas excéder 0.3% en conformité avec la réglementation européenne et française.',
      });
    }

    const products = db.get('marketplaceProducts') || [];
    const newProductId = 'prod_mkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const categories = db.get('productCategories') || [];
    const matchedCategory = categories.find((c) => c.id === categoryId || c.slug === category);
    const finalCatSlug = matchedCategory ? matchedCategory.slug : (category || 'autres');
    const finalCatId = matchedCategory ? matchedCategory.id : (categoryId || 'cat_autres');

    const defaultWarnings = [
      'Réservé aux personnes majeures de plus de 18 ans.',
      'Tenir hors de portée des enfants.',
      'Ne pas dépasser la dose d’utilisation conseillée.',
      'Ne constitue pas un médicament.',
    ];

    const newProduct: CBDMarketplaceProduct = {
      id: newProductId,
      shopId,
      categoryId: finalCatId,
      category: finalCatSlug,
      name,
      brand,
      description: description || '',
      shortDescription: shortDescription || '',
      productType: productType || '',
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
      ],
      price: parseFloat(price) || 0,
      currency: currency || 'EUR',
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      stockStatus: (stockStatus as ProductStockStatus) || (stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'),
      unit: unit || 'g',
      quantityPerUnit: parseFloat(quantityPerUnit) || 1,
      declaredCBDPercentage: declaredCBDPercentage !== null ? parseFloat(declaredCBDPercentage) : null,
      declaredTHCPercentage: thcVal,
      cannabinoidProfile: cannabinoidProfile || {},
      terpeneProfile: Array.isArray(terpeneProfile) ? terpeneProfile : [],
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      allergens: Array.isArray(allergens) ? allergens : [],
      batchNumber: batchNumber || null,
      barcode: barcode || null,
      qrCode: qrCode || null,
      origin: origin || 'France',
      qualityInformation: qualityInformation || {
        cultivationMethod: 'Chanvre européen conforme',
        manufacturerName: brand,
      },
      laboratoryInformation: laboratoryInformation || '',
      manufacturerInformation: manufacturerInformation || '',
      productWarnings: productWarnings.length > 0 ? productWarnings : defaultWarnings,
      legalInformation: legalInformation || 'Certifié conforme réglementation UE - THC < 0.3%.',
      consumptionMode: (consumptionMode as ProductConsumptionMode) || 'SUBLINGUAL',
      status: (status as MarketplaceProductStatus) || 'PUBLISHED',
      viewsCount: 0,
      favoritesCount: 0,
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    db.set('marketplaceProducts', products);

    db.logAudit('CREATE_PRODUCT', 'CBDMarketplaceProduct', user.id, {
      productId: newProductId,
      shopId,
      name,
    });

    return res.status(201).json({
      success: true,
      message: 'Fiche produit créée avec succès.',
      product: newProduct,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la création du produit.' });
  }
});

// 18. UPDATE PRODUCT
router.put('/partner/products/:productId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const user = req.user!;

    const products = db.get('marketplaceProducts') || [];
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (!canManageShop(user, product.shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const {
      name,
      brand,
      categoryId,
      category,
      consumptionMode,
      description,
      shortDescription,
      productType,
      images,
      price,
      currency,
      stockQuantity,
      stockStatus,
      unit,
      quantityPerUnit,
      declaredCBDPercentage,
      declaredTHCPercentage,
      cannabinoidProfile,
      terpeneProfile,
      ingredients,
      allergens,
      batchNumber,
      barcode,
      qrCode,
      origin,
      qualityInformation,
      laboratoryInformation,
      manufacturerInformation,
      productWarnings,
      legalInformation,
      status,
    } = req.body;

    if (declaredTHCPercentage !== undefined) {
      const thcVal = declaredTHCPercentage !== null ? parseFloat(declaredTHCPercentage) : 0;
      if (thcVal > 0.3) {
        return res.status(400).json({
          error: 'Conformité légale refusée : Le taux de THC ne peut pas excéder 0.3%.',
        });
      }
      product.declaredTHCPercentage = thcVal;
    }

    if (name !== undefined) product.name = name;
    if (brand !== undefined) product.brand = brand;
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (category !== undefined) product.category = category;
    if (consumptionMode !== undefined) product.consumptionMode = consumptionMode;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (productType !== undefined) product.productType = productType;
    if (images !== undefined) product.images = images;
    if (price !== undefined) product.price = parseFloat(price);
    if (currency !== undefined) product.currency = currency;
    if (stockQuantity !== undefined) {
      product.stockQuantity = parseInt(stockQuantity, 10);
      if (product.stockQuantity <= 0) {
        product.stockStatus = 'OUT_OF_STOCK';
      }
    }
    if (stockStatus !== undefined) product.stockStatus = stockStatus;
    if (unit !== undefined) product.unit = unit;
    if (quantityPerUnit !== undefined) product.quantityPerUnit = parseFloat(quantityPerUnit);
    if (declaredCBDPercentage !== undefined) {
      product.declaredCBDPercentage = declaredCBDPercentage !== null ? parseFloat(declaredCBDPercentage) : null;
    }
    if (cannabinoidProfile !== undefined) product.cannabinoidProfile = cannabinoidProfile;
    if (terpeneProfile !== undefined) product.terpeneProfile = terpeneProfile;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (allergens !== undefined) product.allergens = allergens;
    if (batchNumber !== undefined) product.batchNumber = batchNumber;
    if (barcode !== undefined) product.barcode = barcode;
    if (qrCode !== undefined) product.qrCode = qrCode;
    if (origin !== undefined) product.origin = origin;
    if (qualityInformation !== undefined) product.qualityInformation = qualityInformation;
    if (laboratoryInformation !== undefined) product.laboratoryInformation = laboratoryInformation;
    if (manufacturerInformation !== undefined) product.manufacturerInformation = manufacturerInformation;
    if (productWarnings !== undefined) product.productWarnings = productWarnings;
    if (legalInformation !== undefined) product.legalInformation = legalInformation;
    if (status !== undefined) product.status = status;

    product.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('UPDATE_PRODUCT', 'CBDMarketplaceProduct', user.id, { productId });

    return res.json({
      success: true,
      message: 'Fiche produit mise à jour avec succès.',
      product,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du produit.' });
  }
});

// 19. QUICK STOCK & AVAILABILITY UPDATE
router.patch('/partner/products/:productId/stock', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const user = req.user!;
    const { stockQuantity, stockStatus } = req.body;

    const products = db.get('marketplaceProducts') || [];
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (!canManageShop(user, product.shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    if (stockQuantity !== undefined) {
      product.stockQuantity = Math.max(0, parseInt(stockQuantity, 10) || 0);
    }
    if (stockStatus !== undefined) {
      product.stockStatus = stockStatus;
    } else if (product.stockQuantity === 0) {
      product.stockStatus = 'OUT_OF_STOCK';
    } else if (product.stockQuantity < 5) {
      product.stockStatus = 'LOW_STOCK';
    } else {
      product.stockStatus = 'IN_STOCK';
    }

    product.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('UPDATE_STOCK', 'CBDMarketplaceProduct', user.id, {
      productId,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
    });

    return res.json({
      success: true,
      stockQuantity: product.stockQuantity,
      stockStatus: product.stockStatus,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour stock.' });
  }
});

// 20. ARCHIVE OR DELETE PRODUCT
router.delete('/partner/products/:productId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const user = req.user!;

    const products = db.get('marketplaceProducts') || [];
    const index = products.findIndex((p) => p.id === productId);
    if (index < 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const product = products[index];
    if (!canManageShop(user, product.shopId)) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    // Soft delete / archive
    product.status = 'ARCHIVED';
    product.updatedAt = new Date().toISOString();
    db.save();

    db.logAudit('ARCHIVE_PRODUCT', 'CBDMarketplaceProduct', user.id, { productId });

    return res.json({ success: true, message: 'Produit archivé avec succès.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur suppression produit.' });
  }
});

// ============================================================================
// ADMIN NEXUS — MODERATION & MARKETPLACE MANAGEMENT
// ============================================================================

// 21. GET ADMIN OVERVIEW METRICS
router.get('/admin/overview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const shops = db.get('partnerShops') || [];
    const products = db.get('marketplaceProducts') || [];
    const rules = db.get('commissionRules') || [];

    const totalShops = shops.length;
    const verifiedShops = shops.filter((s) => s.verificationStatus === 'VERIFIED').length;
    const pendingShops = shops.filter((s) => s.verificationStatus === 'PENDING_REVIEW').length;
    const activeShops = shops.filter((s) => s.status === 'ACTIVE').length;

    const totalProducts = products.length;
    const publishedProducts = products.filter((p) => p.status === 'PUBLISHED').length;
    const pendingProducts = products.filter((p) => p.status === 'PENDING_REVIEW').length;
    const outOfStockProducts = products.filter((p) => p.stockStatus === 'OUT_OF_STOCK').length;

    let totalViews = 0;
    let totalFavorites = 0;
    products.forEach((p) => {
      totalViews += p.viewsCount || 0;
      totalFavorites += p.favoritesCount || 0;
    });

    return res.json({
      metrics: {
        totalShops,
        verifiedShops,
        pendingShops,
        activeShops,
        totalProducts,
        publishedProducts,
        pendingProducts,
        outOfStockProducts,
        totalViews,
        totalFavorites,
      },
      commissionRules: rules,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur métriques admin.' });
  }
});

// 22. ADMIN VERIFY/REJECT SHOP
router.patch('/admin/shops/:shopId/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const { shopId } = req.params;
    const { verificationStatus, status, moderationReason } = req.body;

    const shops = db.get('partnerShops') || [];
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    if (verificationStatus) shop.verificationStatus = verificationStatus;
    if (status) shop.status = status;
    if (moderationReason !== undefined) shop.moderationReason = moderationReason;

    if (verificationStatus === 'VERIFIED') {
      shop.status = 'ACTIVE';
      if (!shop.badges?.includes('Partenaire Vérifié')) {
        shop.badges = [...(shop.badges || []), 'Partenaire Vérifié'];
      }
    }

    shop.updatedAt = new Date().toISOString();
    db.save();

    // Sync legacy cbdStore
    const legStores = db.get('cbdStores') || [];
    const leg = legStores.find((s) => s.id === shopId);
    if (leg) {
      leg.verified = shop.verificationStatus === 'VERIFIED';
      db.save();
    }

    db.logAudit('ADMIN_MODERATE_SHOP', 'PartnerShop', req.user!.id, {
      shopId,
      verificationStatus,
      status: shop.status,
      moderationReason,
    });

    return res.json({
      success: true,
      message: `Statut de la boutique mis à jour : ${shop.verificationStatus}`,
      shop,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur modération boutique.' });
  }
});

// 23. ADMIN MODERATE PRODUCT (APPROVE / SUSPEND / ARCHIVE)
router.patch('/admin/products/:productId/moderate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const { productId } = req.params;
    const { status, moderationReason } = req.body;

    const products = db.get('marketplaceProducts') || [];
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    if (status) product.status = status;
    if (moderationReason !== undefined) product.moderationReason = moderationReason;
    product.updatedAt = new Date().toISOString();

    db.save();

    db.logAudit('ADMIN_MODERATE_PRODUCT', 'CBDMarketplaceProduct', req.user!.id, {
      productId,
      status,
      moderationReason,
    });

    return res.json({
      success: true,
      message: `Statut du produit mis à jour : ${product.status}`,
      product,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur modération produit.' });
  }
});

// 24. MANAGE COMMISSION RULES
router.post('/admin/commission-rules', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!isPlatformAdmin(req.user?.role)) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }

    const { shopId, ruleType = 'PERCENTAGE', percentage, fixedAmount, minCommission } = req.body;
    const rules = db.get('commissionRules') || [];

    const newRule: MarketplaceCommissionRule = {
      id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      shopId: shopId || undefined,
      ruleType,
      percentage: percentage !== undefined ? parseFloat(percentage) : undefined,
      fixedAmount: fixedAmount !== undefined ? parseFloat(fixedAmount) : undefined,
      minCommission: minCommission !== undefined ? parseFloat(minCommission) : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    rules.push(newRule);
    db.set('commissionRules', rules);

    db.logAudit('CREATE_COMMISSION_RULE', 'MarketplaceCommissionRule', req.user!.id, {
      ruleId: newRule.id,
      shopId,
      percentage,
    });

    return res.status(201).json({ success: true, rule: newRule });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur création règle de commission.' });
  }
});

export default router;
