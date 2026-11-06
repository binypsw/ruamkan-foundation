import type { PoolClient } from 'pg';
import { query, queryOne } from './db';
import { AppError } from './http';

/**
 * Ledger กลาง (FR-58, NFR-07, BR-34, BR-35): เพิ่มอย่างเดียว · balance = เข้า − ออก − ค่าธรรมเนียม
 * ทุกการเงินเข้า/ออกของ wallet ต้องผ่านฟังก์ชันในไฟล์นี้เท่านั้น (ต้องเรียกภายใน transaction ของผู้เรียก)
 */
export type SpecialWallet = 'central' | 'admin_fee';

export async function projectWalletId(c: PoolClient, projectId: string): Promise<string> {
  const w = await queryOne<{ id: string }>('SELECT id FROM wallets WHERE project_id = $1 FOR UPDATE', [projectId], c);
  if (!w) throw new AppError(404, 'WALLET_NOT_FOUND', 'ไม่พบบัญชีพักของโครงการ');
  return w.id;
}

export async function specialWalletId(c: PoolClient, kind: SpecialWallet): Promise<string> {
  const w = await queryOne<{ id: string }>('SELECT id FROM wallets WHERE kind = $1 FOR UPDATE', [kind], c);
  if (!w) throw new AppError(404, 'WALLET_NOT_FOUND', 'ไม่พบบัญชีพิเศษ');
  return w.id;
}

export interface LedgerOpts {
  at: Date;
  donationId?: string | null;
  disbursementId?: string | null;
  memo?: string;
  payeeName?: string | null;
}

/** เงินเข้า (balance += amount) */
export async function ledgerIn(c: PoolClient, walletId: string, amount: string, o: LedgerOpts): Promise<void> {
  await query('UPDATE wallets SET balance = balance + $2::numeric WHERE id = $1', [walletId, amount], c);
  await query(
    `INSERT INTO ledger_entries (wallet_id, kind, amount, donation_id, disbursement_id, memo, payee_name, at)
     VALUES ($1,'in',$2,$3,$4,$5,$6,$7)`,
    [walletId, amount, o.donationId ?? null, o.disbursementId ?? null, o.memo ?? null, o.payeeName ?? null, o.at],
    c,
  );
}

/** ค่าธรรมเนียม (balance −= amount) หักจากยอดโครงการ ไม่ให้ผู้บริจาคจ่ายเพิ่ม (BR-20) */
export async function ledgerFee(c: PoolClient, walletId: string, amount: string, o: LedgerOpts): Promise<void> {
  if (amount === '0.00') return;
  await debit(c, walletId, amount, 'fee', o);
}

/**
 * เงินออก (balance −= amount) · forProjectId = โครงการที่จะใช้เงินนี้ ต้องตรงกับเจ้าของ wallet (BR-34)
 * เงินพักไม่พอ -> 422 WALLET_INSUFFICIENT (CHECK balance >= 0 ที่ฐานข้อมูลเป็นด่านสุดท้าย)
 */
export async function ledgerOut(c: PoolClient, walletId: string, amount: string, o: LedgerOpts, forProjectId?: string | null): Promise<void> {
  if (forProjectId !== undefined) {
    const w = await queryOne<{ project_id: string | null }>('SELECT project_id FROM wallets WHERE id = $1', [walletId], c);
    if (!w || w.project_id !== forProjectId) {
      throw new AppError(422, 'BR_34_CROSS_PROJECT', 'ห้ามใช้เงินพักของโครงการหนึ่งไปจ่ายให้โครงการอื่นหรือค่าบริหาร');
    }
  }
  await debit(c, walletId, amount, 'out', o);
}

async function debit(c: PoolClient, walletId: string, amount: string, kind: 'out' | 'fee', o: LedgerOpts): Promise<void> {
  const r = await query<{ id: string }>(
    'UPDATE wallets SET balance = balance - $2::numeric WHERE id = $1 AND balance >= $2::numeric RETURNING id',
    [walletId, amount],
    c,
  );
  if (r.length === 0) throw new AppError(422, 'WALLET_INSUFFICIENT', 'เงินพักของโครงการไม่เพียงพอ');
  await query(
    `INSERT INTO ledger_entries (wallet_id, kind, amount, donation_id, disbursement_id, memo, payee_name, at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [walletId, kind, amount, o.donationId ?? null, o.disbursementId ?? null, o.memo ?? null, o.payeeName ?? null, o.at],
    c,
  );
}

/** กระทบยอด: ผลต่างระหว่าง wallets.balance กับผลรวม ledger ต้องเป็น 0.00 ทุกบัญชี (NFR-07) */
export async function reconcile(c?: PoolClient) {
  return query<{ wallet_id: string; kind: string; project_code: string | null; balance: string; ledger_sum: string; diff: string }>(
    `SELECT w.id AS wallet_id, w.kind, p.code AS project_code, w.balance,
            COALESCE(SUM(CASE WHEN l.kind = 'in' THEN l.amount ELSE -l.amount END), 0) AS ledger_sum,
            w.balance - COALESCE(SUM(CASE WHEN l.kind = 'in' THEN l.amount ELSE -l.amount END), 0) AS diff
       FROM wallets w LEFT JOIN projects p ON p.id = w.project_id LEFT JOIN ledger_entries l ON l.wallet_id = w.id
      GROUP BY w.id, p.code ORDER BY p.code NULLS LAST, w.kind`,
    [],
    c,
  );
}
