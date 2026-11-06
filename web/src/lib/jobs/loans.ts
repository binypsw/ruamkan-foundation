import { query, tx } from '../db';
import { now } from '../clock';
import { notify } from '../notify';
import { bkkDateString } from '../rules/labor';
import type { JobResult } from './types';
import { A4 } from '@/messages/a4';

/** FR-37: สัญญายืมที่เลย due_date และยังไม่คืน -> status = 'overdue' + แจ้งผู้ให้ยืมและต้นเรื่อง */
export async function runLoanOverdueJob(): Promise<JobResult> {
  return tx(async (c) => {
    const today = bkkDateString(await now(c));
    const rows = await query<{ id: string; lender_id: string; item_name: string; project_id: string; starter_id: string; code: string }>(
      `UPDATE loans l SET status = 'overdue'
         FROM loan_requests r JOIN projects p ON p.id = r.project_id
        WHERE l.loan_request_id = r.id AND l.status = 'active' AND l.due_date < $1::date
        RETURNING l.id, l.lender_id, r.item_name, p.id AS project_id, p.starter_id, p.code`,
      [today],
      c,
    );
    const details: string[] = [];
    for (const r of rows) {
      const body = A4.loanOverdueBody(r.item_name);
      await notify(c, r.lender_id, { kind: 'loan_overdue', title: A4.loanOverdueTitle, body, projectId: r.project_id });
      await notify(c, r.starter_id, { kind: 'loan_overdue', title: A4.loanOverdueTitle, body, projectId: r.project_id });
      details.push(`${r.code}: ${r.item_name} (${r.id})`);
    }
    return { name: 'loanOverdue', affected: rows.length, details };
  });
}
