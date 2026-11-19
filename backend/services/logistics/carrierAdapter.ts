import {
  OrderShippingAddressSnapshot,
  ShipmentStatus,
} from '../../../src/types/entities';

export interface CreateShipmentRequest {
  shipmentId: string;
  orderNumber: string;
  shopName: string;
  senderAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  recipientAddress: OrderShippingAddressSnapshot;
  weightKg: number;
  dimensions?: {
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  serviceCode?: string;
  customerInstructions?: string;
}

export interface CreateShipmentResult {
  success: boolean;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  estimatedDeliveryDate: string;
  carrierReference?: string;
  error?: string;
}

export interface ShippingLabelResult {
  labelUrl: string;
  trackingNumber: string;
  format: 'PDF' | 'ZPL';
  barcode: string;
}

export interface TrackingInfoResult {
  trackingNumber: string;
  carrierName: string;
  status: ShipmentStatus;
  statusLabel: string;
  location?: string;
  estimatedDeliveryDate?: string;
  events: {
    status: ShipmentStatus;
    description: string;
    location?: string;
    timestamp: string;
  }[];
}

export interface RateCalculationParams {
  weightKg: number;
  country: string;
  postalCode: string;
  itemsCount: number;
  subtotal: number;
}

export interface RateCalculationResult {
  serviceName: string;
  serviceCode: string;
  price: number;
  currency: string;
  transitDaysMin: number;
  transitDaysMax: number;
  guaranteed: boolean;
}

export interface ICarrierAdapter {
  carrierCode: string;
  name: string;
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult>;
  generateLabel(shipmentId: string, trackingNumber: string): Promise<ShippingLabelResult>;
  getTracking(trackingNumber: string): Promise<TrackingInfoResult>;
  calculateRates(params: RateCalculationParams): Promise<RateCalculationResult[]>;
  validateAddress(address: OrderShippingAddressSnapshot): Promise<{ valid: boolean; normalizedAddress?: OrderShippingAddressSnapshot; message?: string }>;
}

export class ColissimoAdapter implements ICarrierAdapter {
  carrierCode = 'COLISSIMO';
  name = 'Colissimo (La Poste)';

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const trackingNumber = `6A${randomSuffix}FR`;
    const deliveryDate = new Date(Date.now() + 2 * 86400000).toISOString();

    return {
      success: true,
      trackingNumber,
      trackingUrl: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
      labelUrl: `/api/logistics/shipments/${request.shipmentId}/label.pdf`,
      estimatedDeliveryDate: deliveryDate,
      carrierReference: `COLI-${Date.now()}`,
    };
  }

  async generateLabel(shipmentId: string, trackingNumber: string): Promise<ShippingLabelResult> {
    return {
      labelUrl: `/api/logistics/shipments/${shipmentId}/label.pdf`,
      trackingNumber,
      format: 'PDF',
      barcode: `*${trackingNumber}*`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfoResult> {
    return {
      trackingNumber,
      carrierName: this.name,
      status: 'IN_TRANSIT',
      statusLabel: 'En cours d’acheminement sur le réseau Colissimo',
      location: 'Plateforme Logistique Régionale',
      events: [
        {
          status: 'CREATED',
          description: 'Prise en charge informatique enregistrée.',
          location: 'Plateforme Expéditeur',
          timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
        {
          status: 'SHIPPED',
          description: 'Colis déposé au bureau de poste.',
          location: 'Bureau de Poste Émetteur',
          timestamp: new Date(Date.now() - 16 * 3600000).toISOString(),
        },
        {
          status: 'IN_TRANSIT',
          description: 'En transit sur la plateforme de distribution.',
          location: 'Hub Central',
          timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
      ],
    };
  }

  async calculateRates(params: RateCalculationParams): Promise<RateCalculationResult[]> {
    let base = 4.90;
    if (params.weightKg > 1) base += (params.weightKg - 1) * 1.5;
    if (params.country !== 'France') base += 4.0;

    return [
      {
        serviceName: 'Colissimo Domicile Suivi',
        serviceCode: 'COLI_HOME',
        price: Math.round(base * 100) / 100,
        currency: 'EUR',
        transitDaysMin: 2,
        transitDaysMax: 3,
        guaranteed: false,
      },
    ];
  }

  async validateAddress(address: OrderShippingAddressSnapshot): Promise<{ valid: boolean; normalizedAddress?: OrderShippingAddressSnapshot; message?: string }> {
    if (!address.postalCode || !address.city || !address.addressLine1) {
      return { valid: false, message: 'Adresse incomplète (voie, code postal ou ville manquant).' };
    }
    return {
      valid: true,
      normalizedAddress: {
        ...address,
        postalCode: address.postalCode.trim().toUpperCase(),
        city: address.city.trim().toUpperCase(),
      },
    };
  }
}

export class ChronopostAdapter implements ICarrierAdapter {
  carrierCode = 'CHRONOPOST';
  name = 'Chronopost Express 24h';

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const trackingNumber = `XP${randomSuffix}FR`;
    const deliveryDate = new Date(Date.now() + 86400000).toISOString();

    return {
      success: true,
      trackingNumber,
      trackingUrl: `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${trackingNumber}`,
      labelUrl: `/api/logistics/shipments/${request.shipmentId}/label.pdf`,
      estimatedDeliveryDate: deliveryDate,
      carrierReference: `CHRONO-${Date.now()}`,
    };
  }

  async generateLabel(shipmentId: string, trackingNumber: string): Promise<ShippingLabelResult> {
    return {
      labelUrl: `/api/logistics/shipments/${shipmentId}/label.pdf`,
      trackingNumber,
      format: 'PDF',
      barcode: `*${trackingNumber}*`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfoResult> {
    return {
      trackingNumber,
      carrierName: this.name,
      status: 'IN_TRANSIT',
      statusLabel: 'En cours de transit express',
      location: 'Hub Chronopost Paris-Sud',
      events: [
        {
          status: 'SHIPPED',
          description: 'Colis enlevé par le chauffeur Chronopost.',
          location: 'Agence Expéditrice',
          timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
        },
        {
          status: 'IN_TRANSIT',
          description: 'Colis scanné au hub national.',
          location: 'Hub National Chronopost',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
      ],
    };
  }

  async calculateRates(params: RateCalculationParams): Promise<RateCalculationResult[]> {
    return [
      {
        serviceName: 'Chrono 13 Express 24h',
        serviceCode: 'CHRONO_13',
        price: 9.90,
        currency: 'EUR',
        transitDaysMin: 1,
        transitDaysMax: 1,
        guaranteed: true,
      },
    ];
  }

  async validateAddress(address: OrderShippingAddressSnapshot): Promise<{ valid: boolean; normalizedAddress?: OrderShippingAddressSnapshot; message?: string }> {
    return { valid: true, normalizedAddress: address };
  }
}

export class MondialRelayAdapter implements ICarrierAdapter {
  carrierCode = 'MONDIAL_RELAY';
  name = 'Mondial Relay Point Relais';

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const trackingNumber = `MR-${randomSuffix}`;
    const deliveryDate = new Date(Date.now() + 3 * 86400000).toISOString();

    return {
      success: true,
      trackingNumber,
      trackingUrl: `https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition=${trackingNumber}`,
      labelUrl: `/api/logistics/shipments/${request.shipmentId}/label.pdf`,
      estimatedDeliveryDate: deliveryDate,
    };
  }

  async generateLabel(shipmentId: string, trackingNumber: string): Promise<ShippingLabelResult> {
    return {
      labelUrl: `/api/logistics/shipments/${shipmentId}/label.pdf`,
      trackingNumber,
      format: 'PDF',
      barcode: `*${trackingNumber}*`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfoResult> {
    return {
      trackingNumber,
      carrierName: this.name,
      status: 'IN_TRANSIT',
      statusLabel: 'En transit vers le Point Relais',
      events: [
        {
          status: 'SHIPPED',
          description: 'Colis déposé en Point Relais expéditeur.',
          timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
        },
      ],
    };
  }

  async calculateRates(params: RateCalculationParams): Promise<RateCalculationResult[]> {
    return [
      {
        serviceName: 'Mondial Relay Point Relais',
        serviceCode: 'MR_POINT_RELAIS',
        price: 3.90,
        currency: 'EUR',
        transitDaysMin: 3,
        transitDaysMax: 5,
        guaranteed: false,
      },
    ];
  }

  async validateAddress(address: OrderShippingAddressSnapshot): Promise<{ valid: boolean; normalizedAddress?: OrderShippingAddressSnapshot; message?: string }> {
    return { valid: true, normalizedAddress: address };
  }
}

export class ManualCarrierAdapter implements ICarrierAdapter {
  carrierCode = 'MANUAL_CARRIER';
  name = 'Transporteur Artisanal / Coursier Local';

  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult> {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const trackingNumber = `NX-LOCAL-${randomSuffix}`;

    return {
      success: true,
      trackingNumber,
      trackingUrl: `https://nexus-cannabis-care.fr/tracking/${trackingNumber}`,
      labelUrl: `/api/logistics/shipments/${request.shipmentId}/label.pdf`,
      estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  async generateLabel(shipmentId: string, trackingNumber: string): Promise<ShippingLabelResult> {
    return {
      labelUrl: `/api/logistics/shipments/${shipmentId}/label.pdf`,
      trackingNumber,
      format: 'PDF',
      barcode: `*${trackingNumber}*`,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfoResult> {
    return {
      trackingNumber,
      carrierName: this.name,
      status: 'PROCESSING',
      statusLabel: 'Prise en charge par le service logistique de la boutique',
      events: [
        {
          status: 'CREATED',
          description: 'Fiche d’expédition créée.',
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  async calculateRates(params: RateCalculationParams): Promise<RateCalculationResult[]> {
    return [
      {
        serviceName: 'Livraison Urbaine Dédiée',
        serviceCode: 'LOCAL_COURIER',
        price: 5.00,
        currency: 'EUR',
        transitDaysMin: 0,
        transitDaysMax: 1,
        guaranteed: false,
      },
    ];
  }

  async validateAddress(address: OrderShippingAddressSnapshot): Promise<{ valid: boolean; normalizedAddress?: OrderShippingAddressSnapshot; message?: string }> {
    return { valid: true, normalizedAddress: address };
  }
}

export class CarrierAdapterRegistry {
  private static adapters: Map<string, ICarrierAdapter> = new Map();

  static {
    const colissimo = new ColissimoAdapter();
    const chronopost = new ChronopostAdapter();
    const mondialRelay = new MondialRelayAdapter();
    const manual = new ManualCarrierAdapter();

    this.adapters.set('COLISSIMO', colissimo);
    this.adapters.set('CHRONOPOST', chronopost);
    this.adapters.set('MONDIAL_RELAY', mondialRelay);
    this.adapters.set('DPD', colissimo); // fallback adapter
    this.adapters.set('DHL', chronopost); // fallback adapter
    this.adapters.set('MANUAL_CARRIER', manual);
  }

  static getAdapter(carrierCode?: string): ICarrierAdapter {
    if (!carrierCode) return this.adapters.get('COLISSIMO')!;
    const code = carrierCode.toUpperCase();
    return this.adapters.get(code) || this.adapters.get('COLISSIMO') || new ManualCarrierAdapter();
  }
}
