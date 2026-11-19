export interface EstimateCalculationInput {
  currentDate?: Date;
  cutoffTime?: string; // "14:00"
  processingDays?: number; // default 1
  transitMinDays: number;
  transitMaxDays: number;
  businessDays?: number[]; // [1, 2, 3, 4, 5] (Monday=1, Sunday=0)
  closedDates?: string[]; // ["2026-05-01", "2026-12-25"]
  language?: 'fr' | 'en' | 'ar';
}

export interface EstimateCalculationResult {
  minDeliveryDate: string; // ISO string
  maxDeliveryDate: string; // ISO string
  minDeliveryFormatted: string;
  maxDeliveryFormatted: string;
  isSameDayPossible: boolean;
  cutoffPassedToday: boolean;
  summaryText: string;
}

export class DeliveryEstimateService {
  /**
   * Checks if a given date is a valid operating day for the merchant.
   */
  private static isBusinessDay(
    date: Date,
    businessDays: number[] = [1, 2, 3, 4, 5],
    closedDates: string[] = []
  ): boolean {
    const dayOfWeek = date.getDay();
    if (!businessDays.includes(dayOfWeek)) {
      return false;
    }
    const isoDay = date.toISOString().split('T')[0];
    if (closedDates.includes(isoDay)) {
      return false;
    }
    return true;
  }

  /**
   * Advances a date by N business days.
   */
  private static addBusinessDays(
    startDate: Date,
    daysToAdd: number,
    businessDays: number[] = [1, 2, 3, 4, 5],
    closedDates: string[] = []
  ): Date {
    const current = new Date(startDate.getTime());
    let added = 0;

    while (added < daysToAdd) {
      current.setDate(current.getDate() + 1);
      if (this.isBusinessDay(current, businessDays, closedDates)) {
        added++;
      }
    }
    return current;
  }

  /**
   * Main calculation algorithm for delivery / pickup estimates.
   */
  public static calculateEstimate(input: EstimateCalculationInput): EstimateCalculationResult {
    const now = input.currentDate ? new Date(input.currentDate) : new Date();
    const cutoffStr = input.cutoffTime || '14:00';
    const [cutoffHours, cutoffMinutes] = cutoffStr.split(':').map(Number);

    const businessDays = input.businessDays || [1, 2, 3, 4, 5];
    const closedDates = input.closedDates || [];

    // Check if cutoff has passed today
    const cutoffToday = new Date(now.getTime());
    cutoffToday.setHours(cutoffHours, cutoffMinutes || 0, 0, 0);

    const cutoffPassedToday = now.getTime() > cutoffToday.getTime();

    // Determine when preparation starts
    let prepStartDate = new Date(now.getTime());
    if (cutoffPassedToday || !this.isBusinessDay(prepStartDate, businessDays, closedDates)) {
      // Must advance to next operating business day
      prepStartDate = this.addBusinessDays(prepStartDate, 1, businessDays, closedDates);
    }

    const processingDays = Math.max(0, input.processingDays ?? 1);
    const shipDate = processingDays === 0
      ? prepStartDate
      : this.addBusinessDays(prepStartDate, processingDays, businessDays, closedDates);

    // Add transit min and max days
    const minDelivery = input.transitMinDays === 0
      ? shipDate
      : this.addBusinessDays(shipDate, input.transitMinDays, [1, 2, 3, 4, 5, 6], closedDates); // carriers often deliver on Saturday

    const maxDelivery = input.transitMaxDays === 0
      ? shipDate
      : this.addBusinessDays(shipDate, input.transitMaxDays, [1, 2, 3, 4, 5, 6], closedDates);

    // Formatters
    const lang = input.language || 'fr';
    const localeStr = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-FR' : 'fr-FR';

    const minDeliveryFormatted = minDelivery.toLocaleDateString(localeStr, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    const maxDeliveryFormatted = maxDelivery.toLocaleDateString(localeStr, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    const isSameDayPossible =
      minDelivery.toDateString() === now.toDateString() && !cutoffPassedToday;

    let summaryText = '';
    if (isSameDayPossible) {
      summaryText =
        lang === 'fr'
          ? 'Disponible aujourd’hui en retrait ou livraison locale rapide.'
          : 'Available today for local delivery or pickup.';
    } else if (minDelivery.toDateString() === maxDelivery.toDateString()) {
      summaryText =
        lang === 'fr'
          ? `Livraison estimée le ${minDeliveryFormatted}`
          : `Estimated delivery on ${minDeliveryFormatted}`;
    } else {
      summaryText =
        lang === 'fr'
          ? `Livraison estimée entre le ${minDeliveryFormatted} et le ${maxDeliveryFormatted}`
          : `Estimated delivery between ${minDeliveryFormatted} and ${maxDeliveryFormatted}`;
    }

    return {
      minDeliveryDate: minDelivery.toISOString(),
      maxDeliveryDate: maxDelivery.toISOString(),
      minDeliveryFormatted,
      maxDeliveryFormatted,
      isSameDayPossible,
      cutoffPassedToday,
      summaryText,
    };
  }
}
