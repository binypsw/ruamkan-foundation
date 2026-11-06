/** type กลางที่ทุกชั้นใช้ร่วมกัน */
export type Role = 'starter' | 'helper' | 'voucher' | 'staff' | 'finance' | 'exec';
export type ProjectStatus = 'pending' | 'active' | 'suspended' | 'closed' | 'rejected';
export type FundingMode = 'all_or_nothing' | 'flexible';
export type SupportType = 'money' | 'item' | 'labor' | 'loan' | 'advocacy';
export type PayMethod = 'promptpay' | 'card' | 'mobile';
export type DonationStatus = 'pending' | 'paid' | 'refunded' | 'expired';
export type MilestoneStatus = 'locked' | 'requested' | 'approved' | 'paid';

/** เงินใน JSON เป็นสตริงทศนิยม 2 ตำแหน่งเสมอ เช่น "1050.00" (ห้าม float) */
export type Money = string;

export interface SessionUser {
  id: string;
  code: string | null;
  email: string;
  role: Role;
  displayName: string;
  consentShowName: boolean;
  kycVerified: boolean;
  skills: string[];
  lineLinked: boolean;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface ProgressBars {
  money?: { raised: Money; target: Money; pct: number };
  item?: { needed: number; reserved: number; pct: number };
  people?: { needed: number; joined: number; pct: number };
}

export const SUPPORT_TYPES: SupportType[] = ['money', 'item', 'labor', 'loan', 'advocacy'];
