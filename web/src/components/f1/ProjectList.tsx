'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Empty, SelectField, TextField } from '@/components/ui';
import { api } from '@/lib/client/api';
import { f1 } from '@/messages/f1';
import ProjectCard, { type ProjectCardData } from './ProjectCard';

const TYPES = ['money', 'item', 'labor', 'loan', 'advocacy'];

export default function ProjectList() {
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectCardData[] | null>(null);
  const [now, setNow] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set('q', q.trim());
      if (area) qs.set('area', area);
      if (type) qs.set('type', type);
      const s = qs.toString();
      const r = await api<{ projects: ProjectCardData[]; now: string }>(`/api/projects${s ? `?${s}` : ''}`);
      if (id !== seq.current) return;
      if (!r.ok) { setError(r.error?.message ?? f1.loadError); setProjects([]); return; }
      setError(null);
      setProjects(r.data.projects);
      setNow(r.data.now);
      if (!s) setAreas(Array.from(new Set(r.data.projects.map((p) => p.areaProvince).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th')));
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, area, type, tick]);

  const filtered = !!(q || area || type);
  return (
    <section id="projects" aria-labelledby="home-projects-title" style={{ scrollMarginTop: 76 }}>
      <h2 id="home-projects-title" data-testid="home-projects-title">{f1.sectionTitle}</h2>
      <div className="card card-body" style={{ marginBottom: 16 }} role="search">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0 16px' }}>
          <TextField label={f1.searchLabel} testid="home-search-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={f1.searchPlaceholder} />
          <SelectField label={f1.areaLabel} testid="home-area-select" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">{f1.areaAll}</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            {area && !areas.includes(area) && <option value={area}>{area}</option>}
          </SelectField>
          <SelectField label={f1.typeLabel} testid="home-type-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{f1.typeAll}</option>
            {TYPES.map((t) => <option key={t} value={t}>{f1.types[t]}</option>)}
          </SelectField>
        </div>
        {filtered && <div><Button variant="ghost" testid="home-clear-filters" onClick={() => { setQ(''); setArea(''); setType(''); }}>{f1.clear}</Button></div>}
      </div>
      {error && (
        <Alert kind="error" testid="home-error">
          {error} <Button variant="secondary" testid="home-retry" onClick={() => setTick((n) => n + 1)}>{f1.retry}</Button>
        </Alert>
      )}
      {projects === null ? (
        <p className="muted" data-testid="home-loading" role="status">{f1.loading}</p>
      ) : (
        <>
          <p className="muted" data-testid="home-count" role="status">{f1.count(projects.length)}</p>
          {projects.length === 0 && !error ? <Empty testid="home-empty">{f1.empty}</Empty> : (
            <div className="grid" data-testid="home-project-list">
              {projects.map((p) => <ProjectCard key={p.id} p={p} now={now} />)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
