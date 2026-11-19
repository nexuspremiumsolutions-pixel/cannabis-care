import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../auth/auth';
import { CBDAnalyticsService } from '../services/cbdAnalyticsService';
import {
  CBDConsumption,
  CBDProduct,
  CBDUserProduct,
  CBDWellnessObservation,
  CBDWellnessGoal,
  CBDProductScan,
} from '../../src/types/entities';

const router = Router();

// ==========================================
// 1. DASHBOARD OVERVIEW
// ==========================================
router.get('/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const summary = CBDAnalyticsService.getDashboardSummary(userId);
    return res.json(summary);
  } catch (err) {
    console.error('CBD Dashboard error:', err);
    return res.status(500).json({ error: 'Erreur lors de la génération du tableau de bord CBD.' });
  }
});

// ==========================================
// 2. CONSUMPTION ENTRIES CRUD
// ==========================================

// List consumptions with filtering
router.get('/consumptions', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, category, method, search } = req.query;

    let entries = db.get('cbdConsumptions').filter((c) => c.userId === userId);

    if (startDate) {
      entries = entries.filter((c) => c.date >= String(startDate));
    }
    if (endDate) {
      entries = entries.filter((c) => c.date <= String(endDate));
    }
    if (category && category !== 'ALL') {
      entries = entries.filter((c) => c.productType === category);
    }
    if (method && method !== 'ALL') {
      entries = entries.filter((c) => c.consumptionMethod === method);
    }
    if (search) {
      const q = String(search).toLowerCase();
      entries = entries.filter(
        (c) =>
          c.productName.toLowerCase().includes(q) ||
          (c.brand && c.brand.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q)) ||
          (c.context && c.context.toLowerCase().includes(q))
      );
    }

    entries.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    return res.json({ consumptions: entries, total: entries.length });
  } catch (err) {
    console.error('List CBD consumptions error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des consommations CBD.' });
  }
});

// Create consumption
router.post('/consumptions', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      productId,
      productName,
      brand,
      date,
      time,
      productType,
      consumptionMethod,
      quantity,
      quantityUnit,
      context,
      subjectiveEffects,
      wellnessRating,
      notes,
    } = req.body;

    if (!productName || !productType || !consumptionMethod || quantity === undefined) {
      return res.status(400).json({
        error: 'Nom du produit, catégorie, mode et quantité sont obligatoires.',
      });
    }

    const now = new Date();
    const entryDate = date || now.toISOString().split('T')[0];
    const entryTime = time || now.toTimeString().substring(0, 5);
    const dateTime = new Date(`${entryDate}T${entryTime}:00`).toISOString();

    const newEntry: CBDConsumption = {
      id: 'cbd_c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      productId: productId || null,
      productName: String(productName).trim(),
      brand: brand ? String(brand).trim() : undefined,
      dateTime,
      date: entryDate,
      time: entryTime,
      productType,
      consumptionMethod,
      quantity: Number(quantity) || 0,
      quantityUnit: quantityUnit || 'g',
      context: context || 'relaxation',
      subjectiveEffects: Array.isArray(subjectiveEffects) ? subjectiveEffects : [],
      wellnessRating: wellnessRating !== undefined ? Number(wellnessRating) : undefined,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('cbdConsumptions');
    list.push(newEntry);

    // Update user product stats if tied to a productId
    if (productId) {
      const userProducts = db.get('cbdUserProducts');
      let up = userProducts.find((item) => item.userId === userId && item.productId === productId);
      if (!up) {
        up = {
          id: 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          userId,
          productId,
          isFavorite: false,
          timesConsumed: 1,
          lastUsedAt: dateTime,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        userProducts.push(up);
      } else {
        up.timesConsumed = (up.timesConsumed || 0) + 1;
        up.lastUsedAt = dateTime;
        up.updatedAt = now.toISOString();
      }
    }

    db.save();
    db.logAudit('CREATE_CBD_CONSUMPTION', 'cbdConsumptions', userId, { entryId: newEntry.id });

    return res.status(201).json({ consumption: newEntry });
  } catch (err) {
    console.error('Create CBD consumption error:', err);
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de la consommation CBD.' });
  }
});

// Get single consumption
router.get('/consumptions/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entry = db.get('cbdConsumptions').find((c) => c.id === req.params.id && c.userId === userId);
    if (!entry) {
      return res.status(404).json({ error: 'Entrée introuvable.' });
    }
    return res.json({ consumption: entry });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération de l’entrée.' });
  }
});

// Update consumption
router.put('/consumptions/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const list = db.get('cbdConsumptions');
    const index = list.findIndex((c) => c.id === req.params.id && c.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Entrée introuvable ou non autorisée.' });
    }

    const {
      productName,
      brand,
      date,
      time,
      productType,
      consumptionMethod,
      quantity,
      quantityUnit,
      context,
      subjectiveEffects,
      wellnessRating,
      notes,
    } = req.body;

    const existing = list[index];
    const entryDate = date || existing.date;
    const entryTime = time || existing.time;
    const dateTime = new Date(`${entryDate}T${entryTime}:00`).toISOString();

    const updated: CBDConsumption = {
      ...existing,
      productName: productName ? String(productName).trim() : existing.productName,
      brand: brand !== undefined ? String(brand).trim() : existing.brand,
      date: entryDate,
      time: entryTime,
      dateTime,
      productType: productType || existing.productType,
      consumptionMethod: consumptionMethod || existing.consumptionMethod,
      quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
      quantityUnit: quantityUnit || existing.quantityUnit,
      context: context !== undefined ? context : existing.context,
      subjectiveEffects: Array.isArray(subjectiveEffects) ? subjectiveEffects : existing.subjectiveEffects,
      wellnessRating: wellnessRating !== undefined ? Number(wellnessRating) : existing.wellnessRating,
      notes: notes !== undefined ? String(notes).trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    db.save();
    db.logAudit('UPDATE_CBD_CONSUMPTION', 'cbdConsumptions', userId, { entryId: updated.id });

    return res.json({ consumption: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la modification de la consommation.' });
  }
});

// Delete consumption
router.delete('/consumptions/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const list = db.get('cbdConsumptions');
    const initialLen = list.length;
    const filtered = list.filter((c) => !(c.id === req.params.id && c.userId === userId));

    if (filtered.length === initialLen) {
      return res.status(404).json({ error: 'Entrée introuvable ou non autorisée.' });
    }

    db.set('cbdConsumptions', filtered);
    db.logAudit('DELETE_CBD_CONSUMPTION', 'cbdConsumptions', userId, { entryId: req.params.id });

    return res.json({ success: true, message: 'Consommation supprimée.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de la consommation.' });
  }
});

// ==========================================
// 3. PRODUCTS & CATALOG
// ==========================================

// List catalog products + user's personal products
router.get('/products', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { category, search, favoritesOnly, brand } = req.query;

    const allProducts = db.get('cbdProducts') || [];
    const userFavorites = (db.get('cbdUserProducts') || []).filter((up) => up.userId === userId && up.isFavorite);
    const favoriteSet = new Set(userFavorites.map((f) => f.productId));
    const stores = db.get('cbdStores') || [];
    const batches = db.get('cbdProductBatches') || [];

    // Filter available products: catalog products OR user's own products
    let products = allProducts.filter((p) => p.sourceType !== 'user' || p.userId === userId);

    if (category && category !== 'ALL') {
      products = products.filter((p) => p.category === category);
    }
    if (brand && brand !== 'ALL') {
      products = products.filter((p) => p.brand.toLowerCase() === String(brand).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.ingredients && p.ingredients.some((ing) => ing.toLowerCase().includes(q)))
      );
    }
    if (favoritesOnly === 'true') {
      products = products.filter((p) => favoriteSet.has(p.id));
    }

    const enriched = products.map((prod) => {
      const store = stores.find((s) => s.id === (prod.shopId || prod.storeId));
      const batch = batches.find((b) => b.productId === prod.id);
      return {
        ...prod,
        isFavorite: favoriteSet.has(prod.id),
        storeName: store ? store.name : undefined,
        labBatch: batch,
      };
    });

    return res.json({ products: enriched, total: enriched.length });
  } catch (err) {
    console.error('List CBD products error:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des produits CBD.' });
  }
});

// Add a new product (either user custom product or partner)
router.post('/products', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      brand,
      category,
      description,
      cbdPercentage,
      thcPercentage,
      cbdAmount,
      cannabinoidProfile,
      terpeneProfile,
      ingredients,
      carrierOil,
      flavors,
      volumeOrWeight,
      quantity,
      quantityUnit,
      price,
      barcode,
      countryOfOrigin,
      qualityInformation,
    } = req.body;

    if (!name || !brand || !category) {
      return res.status(400).json({ error: 'Nom, marque et catégorie sont requis.' });
    }

    // Safety check on THC rate: must be <= 0.3%
    const normalizedThc = thcPercentage !== undefined ? Number(thcPercentage) : 0.0;
    if (normalizedThc > 0.3) {
      return res.status(400).json({
        error: 'Conformité légale : le taux de THC ne peut pas dépasser 0.3% en France et dans l’UE.',
      });
    }

    const now = new Date().toISOString();
    const newProduct: CBDProduct = {
      id: 'cbd_p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: String(name).trim(),
      brand: String(brand).trim(),
      category,
      description: description ? String(description).trim() : '',
      cbdPercentage: cbdPercentage !== undefined ? Number(cbdPercentage) : null,
      thcPercentage: normalizedThc,
      cbdAmount: cbdAmount !== undefined ? Number(cbdAmount) : null,
      cannabinoidProfile: cannabinoidProfile || {
        cbd: cbdPercentage !== undefined ? Number(cbdPercentage) : undefined,
        thc: normalizedThc,
      },
      terpeneProfile: Array.isArray(terpeneProfile) ? terpeneProfile : [],
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      carrierOil: carrierOil ? String(carrierOil).trim() : undefined,
      flavors: Array.isArray(flavors) ? flavors : [],
      volumeOrWeight: volumeOrWeight ? String(volumeOrWeight).trim() : undefined,
      quantity: quantity !== undefined ? Number(quantity) : null,
      quantityUnit: quantityUnit ? String(quantityUnit).trim() : null,
      price: price !== undefined ? Number(price) : null,
      currency: 'EUR',
      barcode: barcode ? String(barcode).trim() : null,
      countryOfOrigin: countryOfOrigin ? String(countryOfOrigin).trim() : 'France',
      qualityInformation: qualityInformation || null,
      sourceType: 'user',
      isUserCreated: true,
      userId,
      inStock: true,
      featured: false,
      createdAt: now,
      updatedAt: now,
    };

    const products = db.get('cbdProducts');
    products.push(newProduct);

    // Also auto-add to userProducts list
    const userProducts = db.get('cbdUserProducts');
    userProducts.push({
      id: 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      productId: newProduct.id,
      isFavorite: false,
      timesConsumed: 0,
      createdAt: now,
      updatedAt: now,
    });

    db.save();
    db.logAudit('CREATE_CBD_PRODUCT', 'cbdProducts', userId, { productId: newProduct.id });

    return res.status(201).json({ product: newProduct });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Erreur lors de la création du produit.' });
  }
});

// Product detail with lab info and warnings
router.get('/products/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const product = db.get('cbdProducts').find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const stores = db.get('cbdStores') || [];
    const batches = db.get('cbdProductBatches') || [];
    const userProducts = db.get('cbdUserProducts') || [];

    const store = stores.find((s) => s.id === (product.shopId || product.storeId));
    const batch = batches.find((b) => b.productId === product.id);
    const userProduct = userProducts.find((up) => up.userId === userId && up.productId === product.id);

    return res.json({
      product: {
        ...product,
        isFavorite: Boolean(userProduct?.isFavorite),
        userCustomNotes: userProduct?.customNotes,
        timesConsumedByUser: userProduct?.timesConsumed || 0,
        storeName: store ? store.name : undefined,
        storeCity: store ? store.city : undefined,
        labBatch: batch,
      },
      qualityNotice: {
        legalLimit: 'Taux certifié de THC ≤ 0.3% selon la réglementation en vigueur.',
        medicalDisclaimer:
          'Ne constitue pas un médicament. En cas de traitement en cours, demandez conseil à votre médecin ou pharmacien.',
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement détail produit.' });
  }
});

// Update personal product
router.put('/products/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const products = db.get('cbdProducts');
    const index = products.findIndex((p) => p.id === req.params.id && p.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Produit non trouvé ou modification non autorisée.' });
    }

    const existing = products[index];
    const { name, brand, category, description, cbdPercentage, volumeOrWeight, barcode, notes } = req.body;

    const updated: CBDProduct = {
      ...existing,
      name: name ? String(name).trim() : existing.name,
      brand: brand ? String(brand).trim() : existing.brand,
      category: category || existing.category,
      description: description !== undefined ? String(description).trim() : existing.description,
      cbdPercentage: cbdPercentage !== undefined ? Number(cbdPercentage) : existing.cbdPercentage,
      volumeOrWeight: volumeOrWeight !== undefined ? String(volumeOrWeight).trim() : existing.volumeOrWeight,
      barcode: barcode !== undefined ? String(barcode).trim() : existing.barcode,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;

    if (notes !== undefined) {
      const userProducts = db.get('cbdUserProducts');
      const up = userProducts.find((item) => item.userId === userId && item.productId === existing.id);
      if (up) {
        up.customNotes = String(notes).trim();
        up.updatedAt = new Date().toISOString();
      }
    }

    db.save();
    return res.json({ product: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur modification produit.' });
  }
});

// Toggle Favorite
router.post('/products/:id/favorite', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const productId = req.params.id;
    const product = db.get('cbdProducts').find((p) => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const userProducts = db.get('cbdUserProducts');
    let up = userProducts.find((item) => item.userId === userId && item.productId === productId);

    const now = new Date().toISOString();
    if (!up) {
      up = {
        id: 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        productId,
        isFavorite: true,
        timesConsumed: 0,
        createdAt: now,
        updatedAt: now,
      };
      userProducts.push(up);
    } else {
      up.isFavorite = !up.isFavorite;
      up.updatedAt = now;
    }

    db.save();
    return res.json({ success: true, isFavorite: up.isFavorite });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour favori.' });
  }
});

// List favorites
router.get('/favorites', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const userFavorites = (db.get('cbdUserProducts') || []).filter((up) => up.userId === userId && up.isFavorite);
    const favoriteIds = new Set(userFavorites.map((f) => f.productId));
    const allProducts = db.get('cbdProducts') || [];
    const favorites = allProducts.filter((p) => favoriteIds.has(p.id));

    return res.json({ favorites, count: favorites.length });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération favoris.' });
  }
});

// ==========================================
// 4. WELLNESS OBSERVATIONS & HABITS
// ==========================================

// List wellness observations
router.get('/wellness', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const list = db.get('cbdWellnessObservations') || [];
    const userList = list
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({ observations: userList });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement observations bien-être.' });
  }
});

// Record wellness observation
router.post('/wellness', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      date,
      time,
      sleepQuality,
      energy,
      stressLevel,
      mood,
      relaxation,
      physicalActivity,
      activityDurationMinutes,
      activityType,
      notes,
    } = req.body;

    const now = new Date();
    const entryDate = date || now.toISOString().split('T')[0];
    const entryTime = time || now.toTimeString().substring(0, 5);

    const list = db.get('cbdWellnessObservations') || [];
    // Check if entry for that date already exists for user
    const existingIndex = list.findIndex((w) => w.userId === userId && w.date === entryDate);

    const observation: CBDWellnessObservation = {
      id: existingIndex >= 0 ? list[existingIndex].id : 'cbd_w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      date: entryDate,
      time: entryTime,
      sleepQuality: sleepQuality !== undefined ? Number(sleepQuality) : undefined,
      energy: energy !== undefined ? Number(energy) : undefined,
      stressLevel: stressLevel !== undefined ? Number(stressLevel) : undefined,
      mood: mood !== undefined ? Number(mood) : undefined,
      relaxation: relaxation !== undefined ? Number(relaxation) : undefined,
      physicalActivity: Boolean(physicalActivity),
      activityDurationMinutes: activityDurationMinutes ? Number(activityDurationMinutes) : undefined,
      activityType: activityType ? String(activityType).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = observation;
    } else {
      list.push(observation);
    }

    db.save();
    return res.status(201).json({ observation });
  } catch (err) {
    console.error('Wellness observation error:', err);
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’observation.' });
  }
});

// ==========================================
// 5. STATISTICS & INSIGHTS
// ==========================================
router.get('/stats', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const period = (req.query.period as '7days' | '30days' | '90days' | 'year' | 'all') || '30days';
    const stats = CBDAnalyticsService.getConsumptionStats(userId, period);
    return res.json(stats);
  } catch (err) {
    console.error('CBD Stats error:', err);
    return res.status(500).json({ error: 'Erreur lors de la génération des statistiques CBD.' });
  }
});

// ==========================================
// 6. SCANS & LOOKUPS
// ==========================================
router.post('/scans', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { code, scanType } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code-barres ou QR code requis.' });
    }

    const cleanCode = String(code).trim();
    const products = db.get('cbdProducts') || [];
    const matched = products.find((p) => p.barcode === cleanCode || p.qrCode === cleanCode);

    const scanRecord: CBDProductScan = {
      id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      code: cleanCode,
      scanType: scanType === 'qr' ? 'qr' : 'barcode',
      productId: matched ? matched.id : null,
      result: matched ? 'found' : 'not_found',
      matchedProductName: matched ? matched.name : undefined,
      createdAt: new Date().toISOString(),
    };

    const scans = db.get('cbdProductScans') || [];
    scans.push(scanRecord);
    db.save();

    return res.json({
      scan: scanRecord,
      matchedProduct: matched || null,
      message: matched ? 'Produit identifié avec succès.' : 'Produit non répertorié dans la base certifiée.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du scan du produit.' });
  }
});

router.get('/scans', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const scans = (db.get('cbdProductScans') || [])
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ scans });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du chargement des scans.' });
  }
});

// ==========================================
// 7. WELLNESS GOALS & HABITS
// ==========================================
router.get('/goals', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const goals = (db.get('cbdWellnessGoals') || []).filter((g) => g.userId === userId);
    return res.json({ goals });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement des objectifs bien-être.' });
  }
});

router.post('/goals', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { category, title, description, targetDaysPerWeek, notes } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Titre et catégorie requis.' });
    }

    const now = new Date().toISOString();
    const newGoal: CBDWellnessGoal = {
      id: 'cbd_g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      category,
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      targetDaysPerWeek: targetDaysPerWeek ? Number(targetDaysPerWeek) : 5,
      status: 'active',
      progressPercent: 0,
      currentStreakDays: 0,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const goals = db.get('cbdWellnessGoals') || [];
    goals.push(newGoal);
    db.save();

    return res.status(201).json({ goal: newGoal });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur création objectif.' });
  }
});

router.put('/goals/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const goals = db.get('cbdWellnessGoals') || [];
    const index = goals.findIndex((g) => g.id === req.params.id && g.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Objectif introuvable.' });
    }

    const existing = goals[index];
    const { title, description, status, progressPercent, currentStreakDays } = req.body;

    const updated: CBDWellnessGoal = {
      ...existing,
      title: title ? String(title).trim() : existing.title,
      description: description !== undefined ? String(description).trim() : existing.description,
      status: status || existing.status,
      progressPercent: progressPercent !== undefined ? Number(progressPercent) : existing.progressPercent,
      currentStreakDays: currentStreakDays !== undefined ? Number(currentStreakDays) : existing.currentStreakDays,
      updatedAt: new Date().toISOString(),
    };

    goals[index] = updated;
    db.save();

    return res.json({ goal: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour objectif.' });
  }
});

router.delete('/goals/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const goals = db.get('cbdWellnessGoals') || [];
    const filtered = goals.filter((g) => !(g.id === req.params.id && g.userId === userId));

    db.set('cbdWellnessGoals', filtered);
    return res.json({ success: true, message: 'Objectif supprimé.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur suppression objectif.' });
  }
});

export default router;
