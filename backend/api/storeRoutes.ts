import { Router } from 'express';
import { db } from '../db/database';

const router = Router();

// 1. GET ALL STORES
router.get('/stores', (_req, res) => {
  try {
    const stores = db.get('cbdStores');
    return res.json({ stores });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement boutiques.' });
  }
});

// 2. GET ALL CBD PRODUCTS WITH BATCH / LAB TEST INFOS
router.get('/products', (req, res) => {
  try {
    const { category, storeId } = req.query;
    let products = db.get('cbdProducts');
    const batches = db.get('cbdProductBatches');
    const stores = db.get('cbdStores');

    if (category && category !== 'ALL') {
      products = products.filter((p) => p.category === category);
    }
    if (storeId) {
      products = products.filter((p) => p.storeId === storeId);
    }

    const enriched = products.map((prod) => {
      const store = stores.find((s) => s.id === prod.storeId);
      const batch = batches.find((b) => b.productId === prod.id);
      return {
        ...prod,
        storeName: store ? store.name : 'Boutique Partenaire',
        labBatch: batch,
      };
    });

    return res.json({ products: enriched });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement produits.' });
  }
});

export default router;
