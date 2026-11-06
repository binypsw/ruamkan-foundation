import type { FundingMode, Money, ProgressBars, ProjectStatus, SupportType } from '@/types';

export interface ProjectDetail {
  id: string; code: string; title: string; status: ProjectStatus; fundingMode: FundingMode; urgent: boolean;
  areaProvince: string; supportTypes: SupportType[]; endsAt: string | null; activatedAt: string | null;
  bars: ProgressBars; acceptingDonations: boolean; starterName: string;
  storyWhat: string | null; storyWhere: string | null; storyNeed: string | null;
  evidenceUrl: string | null; voiceUrl: string | null; videoUrl: string | null; transcript: string | null;
  goalAmount: Money; durationHours: number; outcome: string | null; fundraisingState: string;
  frozen: boolean; suspendReason: string | null; rejectReason?: string | null;
  closing: { beforeUrl: string | null; afterUrl: string | null; thanksVideoUrl: string | null } | null;
  items: { id: string; name: string; needed: number; reserved: number; remaining: number }[];
  skills: { id: string; skill: string; headcount: number; joined: number; workDate: string | null; checkedIn: number }[];
  loanRequests: { id: string; itemName: string; days: number; activeLoan: boolean }[];
  rewardTiers: { tier: number; minAmount: Money; description: string }[];
  signatures: { goal: number | null; count: number };
  now: string;
}
