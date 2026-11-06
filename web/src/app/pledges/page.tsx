'use client';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Empty, PageTitle } from '@/components/ui';
import { api, useMe } from '@/lib/client/api';
import { f6 } from '@/messages/f6';
import { LoginNeeded } from '@/components/f6/common';

type AnyPledge = Record<string, any>;
const pick = (p: AnyPledge, ...keys: string[]) => {
  for (const k of keys) { const v = k.split('.').reduce((o: any, s) => (o == null ? undefined : o[s]), p); if (v !== undefined && v !== null) return v; }
  return undefined;
};

const PRINT_CSS = `
@media print {
  .site-header, .site-footer, .floating-help, .no-print { display: none !important; }
  body { background: #fff !important; }
  .container.page { padding: 0 !important; }
  .pledge-label { break-inside: avoid; box-shadow: none !important; }
  body.print-one .pledge-label:not(.printing) { display: none !important; }
}
.pledge-label { border: 2px dashed var(--navy); border-radius: 12px; padding: 16px; background: var(--paper); }
.pledge-label dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
.pledge-label dt { font-weight: 700; }
.pledge-label dd { margin: 0; }
.pledge-tracking { font-size: 1.5rem; font-weight: 700; letter-spacing: .06em; word-break: break-all; }
`;

export default function PledgesPage() {
  const { me } = useMe();
  const [pledges, setPledges] = useState<AnyPledge[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    void api<{ pledges: AnyPledge[] }>('/api/me/pledges').then((r) => {
      if (!r.ok) { setLoadErr(r.error?.message ?? f6.loadFailed); setPledges([]); return; }
      setPledges(r.data.pledges);
    });
  }, [me]);

  useEffect(() => {
    const after = () => { document.body.classList.remove('print-one'); setPrinting(null); };
    window.addEventListener('afterprint', after);
    return () => window.removeEventListener('afterprint', after);
  }, []);

  function printOne(id: string) {
    setPrinting(id);
    document.body.classList.add('print-one');
    setTimeout(() => window.print(), 50);
  }
  function printAll() {
    document.body.classList.remove('print-one');
    setPrinting(null);
    setTimeout(() => window.print(), 50);
  }

  if (me === undefined) return <div className="container page"><p data-testid="pledges-loading">{f6.loading}</p></div>;
  if (me === null) return <div className="container page"><PageTitle sub={f6.pledges.sub}>{f6.pledges.title}</PageTitle><LoginNeeded next="/pledges" testid="pledges" /></div>;

  return (
    <div className="container page stack">
      <style>{PRINT_CSS}</style>
      <div className="no-print"><PageTitle sub={f6.pledges.sub}>{f6.pledges.title}</PageTitle></div>
      {loadErr && <Alert kind="error" testid="pledges-error">{loadErr}</Alert>}
      {pledges === null && <p data-testid="pledges-loading">{f6.loading}</p>}
      {pledges && pledges.length === 0 && !loadErr && <Empty testid="pledges-empty">{f6.pledges.empty}</Empty>}
      {pledges && pledges.length > 1 && (
        <div className="row no-print"><Button variant="secondary" testid="pledges-print-all" onClick={printAll}>{f6.pledges.printAll}</Button></div>
      )}
      <div className="stack" data-testid="pledges-list">
        {pledges?.map((p, i) => {
          const id = String(pick(p, 'id', 'pledgeId') ?? i);
          const tracking = String(pick(p, 'trackingNo', 'tracking_no', 'label.trackingNo') ?? '-');
          const item = String(pick(p, 'itemName', 'item_name', 'item.name', 'label.itemName') ?? '-');
          const qty = pick(p, 'qty', 'label.qty') ?? '-';
          const project = pick(p, 'projectTitle', 'project_title', 'project.title', 'label.projectTitle');
          const recipient = String(pick(p, 'recipient', 'label.recipient') ?? f6.pledges.recipientName);
          const received = Boolean(pick(p, 'received'));
          return (
            <section key={id} className={`pledge-label${printing === id ? ' printing' : ''}`} data-testid={`pledge-${id}`} aria-label={`${f6.pledges.title} ${tracking}`}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="muted">{f6.pledges.tracking}</div>
                  <div className="pledge-tracking" data-testid={`pledge-tracking-${id}`}>{tracking}</div>
                </div>
                <Badge tone={received ? 'ok' : 'warn'} testid={`pledge-status-${id}`}>{received ? f6.pledges.received : f6.pledges.waiting}</Badge>
              </div>
              <dl style={{ marginTop: 12 }}>
                <dt>{f6.pledges.item}</dt><dd data-testid={`pledge-item-${id}`}>{item}</dd>
                <dt>{f6.pledges.qty}</dt><dd data-testid={`pledge-qty-${id}`}>{String(qty)} {f6.pledges.piece}</dd>
                {project && <><dt>{f6.pledges.project}</dt><dd data-testid={`pledge-project-${id}`}>{String(project)}</dd></>}
                <dt>{f6.pledges.recipient}</dt><dd data-testid={`pledge-recipient-${id}`}>{recipient}</dd>
              </dl>
              <div className="row no-print" style={{ marginTop: 12 }}>
                <Button testid={`pledge-print-${id}`} onClick={() => printOne(id)} aria-label={`${f6.pledges.print} ${tracking}`}>{f6.pledges.print}</Button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
