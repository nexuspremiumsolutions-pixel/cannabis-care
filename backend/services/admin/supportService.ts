import { db } from '../../db/database';
import { SupportCase, SupportCasePriority, SupportCaseStatus, SupportMessage } from '../../../src/types/entities';

export class SupportService {
  public static getCases(filters: {
    status?: SupportCaseStatus;
    priority?: SupportCasePriority;
    category?: string;
    search?: string;
  } = {}): SupportCase[] {
    const allCases = db.get('supportCases') || [];
    let result = [...allCases];

    if (filters.status) {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((c) => c.priority === filters.priority);
    }
    if (filters.category) {
      result = result.filter((c) => c.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.userNameSnapshot?.toLowerCase().includes(q) ||
          c.userEmailSnapshot?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public static getCaseById(id: string): SupportCase | null {
    const allCases = db.get('supportCases') || [];
    return allCases.find((c) => c.id === id) || null;
  }

  public static createCase(data: {
    userId: string;
    orderId?: string | null;
    shopId?: string | null;
    category: SupportCase['category'];
    priority: SupportCasePriority;
    subject: string;
    initialMessage: string;
    clientName?: string;
    clientEmail?: string;
  }): SupportCase {
    const allCases = db.get('supportCases') || [];
    const allUsers = db.get('users') || [];
    const user = allUsers.find((u) => u.id === data.userId);

    const now = new Date().toISOString();
    const newCase: SupportCase = {
      id: `sup_case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: data.userId,
      userEmailSnapshot: data.clientEmail || user?.email || 'client@nexus.fr',
      userNameSnapshot: data.clientName || 'Client Nexus',
      orderId: data.orderId || null,
      shopId: data.shopId || null,
      category: data.category,
      status: 'OPEN',
      priority: data.priority || 'NORMAL',
      subject: data.subject,
      assignedTo: 'Support Nexus Care',
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'CLIENT',
          authorName: data.clientName || 'Client Nexus',
          text: data.initialMessage,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };

    allCases.unshift(newCase);
    db.save();
    return newCase;
  }

  public static addMessage(caseId: string, sender: 'SUPPORT' | 'CLIENT', authorName: string, text: string): SupportCase | null {
    const allCases = db.get('supportCases') || [];
    const target = allCases.find((c) => c.id === caseId);
    if (!target) return null;

    const now = new Date().toISOString();
    const msg: SupportMessage = {
      id: `msg_${Date.now()}`,
      sender,
      authorName,
      text,
      timestamp: now,
    };

    target.messages.push(msg);
    target.updatedAt = now;
    if (sender === 'SUPPORT' && target.status === 'OPEN') {
      target.status = 'IN_PROGRESS';
    }

    db.save();
    return target;
  }

  public static updateCase(caseId: string, updates: Partial<SupportCase>): SupportCase | null {
    const allCases = db.get('supportCases') || [];
    const target = allCases.find((c) => c.id === caseId);
    if (!target) return null;

    if (updates.status) target.status = updates.status;
    if (updates.priority) target.priority = updates.priority;
    if (updates.assignedTo !== undefined) target.assignedTo = updates.assignedTo;
    if (updates.status === 'RESOLVED' || updates.status === 'CLOSED') {
      target.resolvedAt = new Date().toISOString();
    }
    target.updatedAt = new Date().toISOString();

    db.save();
    return target;
  }

  /**
   * Search User for Administrative / Customer Service
   * STRICT PRIVACY GUARANTEE: Never exposes medical journals, THC dosages, cravings, or private AI chats!
   */
  public static searchUserForSupport(query: string) {
    if (!query || query.trim().length < 2) return [];

    const q = query.toLowerCase().trim();
    const allUsers = db.get('users') || [];
    const allProfiles = db.get('userProfiles') || [];
    const allOrders = db.get('globalOrders') || [];
    const allSubs = db.get('subscriptions') || [];

    const matches = allUsers.filter(
      (u) => u.id.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );

    return matches.slice(0, 10).map((user) => {
      const profile = allProfiles.find((p) => p.userId === user.id);
      const userOrders = allOrders
        .filter((o) => o.userId === user.id)
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          grandTotal: o.grandTotal,
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        }));

      const userSubs = allSubs
        .filter((s) => s.userId === user.id)
        .map((s) => ({
          id: s.id,
          planId: s.planId,
          status: s.status,
          currentPeriodEnd: s.currentPeriodEnd,
        }));

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        nickname: profile?.nickname || 'Utilisateur',
        isOnboarded: profile?.isOnboarded ?? false,
        country: (profile as any)?.preferredCountry || 'FR',
        ordersCount: userOrders.length,
        recentOrders: userOrders.slice(0, 5),
        subscriptions: userSubs,
        sanctuaryNotice: 'Conforme RGPD / Secret médical : Les journaux de consommation et conversations IA sont chiffrés et exclus de cette vue support.',
      };
    });
  }
}
