'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, LinkButton, PageTitle } from '@/components/ui';
import { LoginRequired, fmtThai } from '@/components/f5/LoginRequired';
import { api, useMe } from '@/lib/client/api';
import { f5 } from '@/messages/f5';

const t = f5.notifications;
interface Notif { id: string; channel: string; kind: string; title: string; body: string; projectId: string | null; read: boolean; createdAt: string }

export default function NotificationsPage() {
  const { me } = useMe();
  const [items, setItems] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ items: Notif[]; unread: number }>('/api/notifications');
    if (r.ok) { setItems(r.data.items); setUnread(r.data.unread); setError(null); }
    else setError(r.error?.message ?? 'ทำรายการไม่สำเร็จ');
  }, []);

  useEffect(() => { if (me) void load(); }, [me, load]);

  async function markRead(ids?: string[]) {
    const r = await api('/api/notifications/read', { body: ids ? { ids } : {} });
    if (!r.ok) { setError(r.error?.message ?? 'ทำรายการไม่สำเร็จ'); return; }
    await load();
  }

  if (me === undefined) return <p className="muted" data-testid="notifications-loading">{f5.loading}</p>;

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageTitle sub={t.sub} testid="notifications-title">{f5.notifications.title}</PageTitle>
      {me === null ? <LoginRequired path="/notifications" testid="notifications" /> : (
        <>
          <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <span data-testid="notifications-unread">{t.unreadCount} <strong data-testid="notifications-unread-count" className="num">{unread}</strong></span>
            <Button testid="notifications-read-all" variant="secondary" onClick={() => markRead()} disabled={unread === 0}>{t.readAll}</Button>
          </div>
          {error && <Alert kind="error" testid="notifications-error">{error}</Alert>}
          {items === null ? <p className="muted">{f5.loading}</p> : items.length === 0 ? (
            <Empty testid="notifications-empty">{t.empty}</Empty>
          ) : (
            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }} data-testid="notifications-list">
              {items.map((n) => (
                <li key={n.id}>
                  <Card testid={`notifications-item-${n.id}`}>
                    <div className="card-body stack" style={{ borderLeft: n.read ? undefined : '6px solid var(--brand, #a8461f)' }}>
                      <div className="row" style={{ alignItems: 'center' }}>
                        <Badge tone="info" testid={`notifications-channel-${n.id}`}>{t.channelLine}</Badge>
                        <Badge tone={n.read ? '' : 'warn'} testid={`notifications-state-${n.id}`}>{n.read ? t.readState : t.newState}</Badge>
                        <span className="muted">{fmtThai(n.createdAt)}</span>
                      </div>
                      <strong data-testid={`notifications-title-${n.id}`}>{n.title}</strong>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }} data-testid={`notifications-body-${n.id}`}>{n.body}</p>
                      <div className="row">
                        {n.projectId && <LinkButton href={`/projects/${n.projectId}`} variant="ghost" testid={`notifications-project-${n.id}`}>{t.toProject}</LinkButton>}
                        {!n.read && <Button testid={`notifications-read-${n.id}`} variant="secondary" onClick={() => markRead([n.id])} aria-label={`${t.readOne}: ${n.title}`}>{t.readOne}</Button>}
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
