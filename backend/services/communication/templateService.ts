import { db } from '../../db/database';
import {
  NotificationTemplate,
  NotificationCategory,
  NotificationChannel,
  TemplateStatus,
} from '../../../src/types/entities';

/**
 * Escapes characters that could be dangerous if injected into HTML/renderers
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return String(text ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class TemplateService {
  public static getAllTemplates(): NotificationTemplate[] {
    return db.get('notificationTemplates') || [];
  }

  public static getTemplateById(id: string): NotificationTemplate | undefined {
    const templates = this.getAllTemplates();
    return templates.find((t) => t.id === id);
  }

  public static getTemplate(
    key: string,
    locale: 'fr' | 'en' | 'ar' = 'fr',
    channel: NotificationChannel = 'IN_APP'
  ): NotificationTemplate | undefined {
    const templates = this.getAllTemplates();
    // Match key, locale, channel first
    let tmpl = templates.find(
      (t) => t.key === key && t.locale === locale && t.channel === channel && t.status === 'ACTIVE'
    );
    // Fallback to IN_APP if channel template not found
    if (!tmpl && channel !== 'IN_APP') {
      tmpl = templates.find(
        (t) => t.key === key && t.locale === locale && t.channel === 'IN_APP' && t.status === 'ACTIVE'
      );
    }
    // Fallback to 'fr' if requested locale not found
    if (!tmpl && locale !== 'fr') {
      tmpl = templates.find(
        (t) => t.key === key && t.locale === 'fr' && t.status === 'ACTIVE'
      );
    }
    return tmpl;
  }

  public static renderTemplate(
    template: NotificationTemplate,
    variables: Record<string, any> = {}
  ): { title: string; body: string; subject?: string } {
    let renderedTitle = template.title;
    let renderedBody = template.body;
    let renderedSubject = template.subject;

    for (const [key, rawValue] of Object.entries(variables)) {
      const sanitized = escapeHtml(String(rawValue ?? ''));
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      renderedTitle = renderedTitle.replace(pattern, sanitized);
      renderedBody = renderedBody.replace(pattern, sanitized);
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(pattern, sanitized);
      }
    }

    // Clean up any remaining unresolved {{var}} placeholders
    renderedTitle = renderedTitle.replace(/\{\{\s*[\w.-]+\s*\}\}/g, '').trim();
    renderedBody = renderedBody.replace(/\{\{\s*[\w.-]+\s*\}\}/g, '').trim();
    if (renderedSubject) {
      renderedSubject = renderedSubject.replace(/\{\{\s*[\w.-]+\s*\}\}/g, '').trim();
    }

    return {
      title: renderedTitle,
      body: renderedBody,
      subject: renderedSubject,
    };
  }

  public static createTemplate(params: {
    key: string;
    category: NotificationCategory;
    channel: NotificationChannel;
    locale: 'fr' | 'en' | 'ar';
    title: string;
    body: string;
    subject?: string;
    variables?: string[];
  }): NotificationTemplate {
    const templates = this.getAllTemplates();
    const now = new Date().toISOString();

    // Extract variables automatically if not provided
    const detectedVariables = params.variables && params.variables.length > 0
      ? params.variables
      : Array.from(new Set(
          (`${params.title} ${params.body} ${params.subject || ''}`.match(/\{\{\s*(\w+)\s*\}\}/g) || [])
            .map((match) => match.replace(/[{}]/g, '').trim())
        ));

    const newTemplate: NotificationTemplate = {
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: params.key.toUpperCase(),
      category: params.category,
      channel: params.channel,
      locale: params.locale,
      subject: params.subject,
      title: params.title,
      body: params.body,
      variables: detectedVariables,
      version: 1,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    templates.push(newTemplate);
    db.set('notificationTemplates', templates);
    db.save();
    return newTemplate;
  }

  public static updateTemplate(
    id: string,
    updates: Partial<Omit<NotificationTemplate, 'id' | 'createdAt'>>
  ): NotificationTemplate | null {
    const templates = this.getAllTemplates();
    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = templates[index];
    const updated: NotificationTemplate = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };

    templates[index] = updated;
    db.set('notificationTemplates', templates);
    db.save();
    return updated;
  }
}
