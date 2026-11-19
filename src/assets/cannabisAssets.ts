import cannabisHeroBanner from './images/cannabis_hero_banner_1789323442899.jpg';
import dispensaryStorefront from './images/dispensary_storefront_1789323456938.jpg';
import cannabisOilSerum from './images/cannabis_oil_serum_1789323473920.jpg';
import cannabisFlowerJar from './images/cannabis_flower_jar_1789323488303.jpg';
import cannabisTeaInfusion from './images/cannabis_tea_infusion_1789323506795.jpg';
import cannabisBotanicalBalm from './images/cannabis_botanical_balm_1789334875522.jpg';
import cannabisCapsulesBottle from './images/cannabis_capsules_bottle_1789334885679.jpg';

export const CANNABIS_IMAGES = {
  heroBanner: cannabisHeroBanner,
  dispensaryStorefront: dispensaryStorefront,
  oilSerum: cannabisOilSerum,
  flowerJar: cannabisFlowerJar,
  teaInfusion: cannabisTeaInfusion,
  botanicalBalm: cannabisBotanicalBalm,
  capsulesBottle: cannabisCapsulesBottle,
};

export function getProductImage(category?: string, name?: string): string {
  const query = `${category || ''} ${name || ''}`.toLowerCase();
  if (query.includes('baume') || query.includes('crème') || query.includes('creme') || query.includes('cosmétique') || query.includes('soin') || query.includes('salve')) {
    return CANNABIS_IMAGES.botanicalBalm;
  }
  if (query.includes('capsule') || query.includes('gélule') || query.includes('gelule') || query.includes('comprimé') || query.includes('softgel')) {
    return CANNABIS_IMAGES.capsulesBottle;
  }
  if (query.includes('fleur') || query.includes('flower') || query.includes('bud') || query.includes('weed') || query.includes('résine') || query.includes('resine') || query.includes('amnesia')) {
    return CANNABIS_IMAGES.flowerJar;
  }
  if (query.includes('huile') || query.includes('oil') || query.includes('goutte') || query.includes('sublingual') || query.includes('sérum') || query.includes('tincture') || query.includes('elixir') || query.includes('élixir')) {
    return CANNABIS_IMAGES.oilSerum;
  }
  if (query.includes('thé') || query.includes('tea') || query.includes('infusion') || query.includes('tisane') || query.includes('boisson')) {
    return CANNABIS_IMAGES.teaInfusion;
  }
  if (query.includes('boutique') || query.includes('shop') || query.includes('store') || query.includes('herboristerie')) {
    return CANNABIS_IMAGES.dispensaryStorefront;
  }
  return CANNABIS_IMAGES.oilSerum;
}
