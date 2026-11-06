import Link from 'next/link';
import { Badge, Card, Illustration, LinkButton, ProgressSet } from '@/components/ui';
import { fmtTimeLeft } from '@/lib/format';
import { f1 } from '@/messages/f1';
import type { ProgressBars, SupportType } from '@/types';

export interface ProjectCardData {
  id: string; code: string; title: string; urgent: boolean; areaProvince: string;
  fundingMode: string; supportTypes: SupportType[]; endsAt: string | null;
  bars: ProgressBars; acceptingDonations: boolean; starterName: string;
}

export default function ProjectCard({ p, now }: { p: ProjectCardData; now: string }) {
  const left = fmtTimeLeft(p.endsAt, now);
  return (
    <Card testid={`home-card-${p.code}`} className="fade-up">
      <div style={{ position: 'relative' }}>
        <Illustration seed={p.code} />
        {p.urgent && (
          <span style={{ position: 'absolute', top: 10, left: 10 }}>
            <Badge tone="danger" testid={`home-card-urgent-${p.code}`}>{f1.urgent}</Badge>
          </span>
        )}
      </div>
      <div className="card-body stack">
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
            <Link href={`/projects/${p.code}`} data-testid={`home-card-title-${p.code}`} aria-label={f1.detailAria(p.title)} style={{ color: 'inherit' }}>{p.title}</Link>
          </h3>
          <p className="muted" style={{ margin: '4px 0 0' }}>{p.areaProvince} · {f1.by(p.starterName)}</p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {p.supportTypes.map((t) => <Badge key={t} tone="info">{f1.types[t] ?? t}</Badge>)}
        </div>
        <ProgressSet bars={p.bars} testid={`home-card-bars-${p.code}`} />
        <p style={{ margin: 0, fontWeight: 600 }} data-testid={`home-card-timeleft-${p.code}`}>{left}</p>
        <div className="row">
          {p.acceptingDonations ? (
            <LinkButton href={`/donate/${p.code}`} testid={`home-card-help-${p.code}`} aria-label={f1.helpAria(p.title)}>{f1.helpNow}</LinkButton>
          ) : (
            <Badge tone="warn" testid={`home-card-closed-${p.code}`}>{f1.closedNow}</Badge>
          )}
          <LinkButton href={`/projects/${p.code}`} variant="secondary" testid={`home-card-detail-${p.code}`} aria-label={f1.detailAria(p.title)}>{f1.detail}</LinkButton>
        </div>
      </div>
    </Card>
  );
}
