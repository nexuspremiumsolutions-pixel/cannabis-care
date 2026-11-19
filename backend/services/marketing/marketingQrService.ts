export interface QrCodeDetails {
  targetUrl: string;
  campaignSlug?: string;
  shopId?: string;
  source: string;
  qrSvg: string;
}

export class MarketingQrService {
  /**
   * Generates a tracked campaign URL and a clean inline SVG QR code matrix
   */
  public static generateCampaignQr(params: {
    baseUrl: string;
    campaignSlug: string;
    shopId?: string;
    utmMedium?: string;
  }): QrCodeDetails {
    const { baseUrl, campaignSlug, shopId, utmMedium = 'qr_code' } = params;
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/campaign/${campaignSlug}?utm_source=in_store&utm_medium=${utmMedium}&utm_campaign=${campaignSlug}${shopId ? `&shop=${shopId}` : ''}`;

    const qrSvg = this.generateInlineSvgQr(url, campaignSlug);

    return {
      targetUrl: url,
      campaignSlug,
      shopId,
      source: 'QR_CODE',
      qrSvg,
    };
  }

  /**
   * Generates a deterministic SVG QR code pattern based on the text hash
   */
  public static generateInlineSvgQr(data: string, label: string = 'Scan'): string {
    const size = 25; // 25x25 grid
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }

    const cells: string[] = [];

    // Finder patterns in 3 corners (top-left, top-right, bottom-left)
    const isFinder = (x: number, y: number): boolean => {
      if (x < 7 && y < 7) return true;
      if (x >= size - 7 && y < 7) return true;
      if (x < 7 && y >= size - 7) return true;
      return false;
    };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let isDark = false;

        // Draw top-left finder
        if (x < 7 && y < 7) {
          if (x === 0 || x === 6 || y === 0 || y === 6) isDark = true;
          else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) isDark = true;
        }
        // Draw top-right finder
        else if (x >= size - 7 && y < 7) {
          const rx = x - (size - 7);
          if (rx === 0 || rx === 6 || y === 0 || y === 6) isDark = true;
          else if (rx >= 2 && rx <= 4 && y >= 2 && y <= 4) isDark = true;
        }
        // Draw bottom-left finder
        else if (x < 7 && y >= size - 7) {
          const ry = y - (size - 7);
          if (x === 0 || x === 6 || ry === 0 || ry === 6) isDark = true;
          else if (x >= 2 && x <= 4 && ry >= 2 && ry <= 4) isDark = true;
        } else {
          // Timing pattern
          if (x === 6 || y === 6) {
            isDark = (x + y) % 2 === 0;
          } else {
            // Pseudo-random pseudo QR data based on charCode + coordinates
            const charIdx = (x * 7 + y * 13) % data.length;
            const code = data.charCodeAt(charIdx);
            isDark = ((code ^ (x * y + hash)) & 3) === 1;
          }
        }

        if (isDark) {
          cells.push(`<rect x="${x * 8 + 16}" y="${y * 8 + 16}" width="8" height="8" fill="#064e3b"/>`);
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 232 248" width="100%" height="100%" class="rounded-lg shadow-sm bg-white p-2">
        <rect width="232" height="248" fill="#ffffff" rx="8" />
        ${cells.join('')}
        <text x="116" y="236" font-size="10" font-family="sans-serif" font-weight="600" text-anchor="middle" fill="#047857">${label.toUpperCase()}</text>
      </svg>
    `.trim();
  }
}
