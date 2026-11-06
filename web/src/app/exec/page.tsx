import { PageTitle } from '@/components/ui';
import { ExecView } from '@/components/f8/ExecView';
import { f8 } from '@/messages/f8';

export const metadata = { title: 'แดชบอร์ดผู้บริหาร · ร่วมกันทำไม' };

export default function ExecPage() {
  return (
    <div className="container page">
      <PageTitle sub={f8.exec.sub} testid="exec-title">{f8.exec.title}</PageTitle>
      <ExecView />
    </div>
  );
}
