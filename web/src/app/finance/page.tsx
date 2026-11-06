import { PageTitle } from '@/components/ui';
import { FinanceView } from '@/components/f8/FinanceView';
import { f8 } from '@/messages/f8';

export const metadata = { title: 'ฝ่ายการเงิน · ร่วมกันทำไม' };

export default function FinancePage() {
  return (
    <div className="container page">
      <PageTitle sub={f8.finance.sub} testid="finance-title">{f8.finance.title}</PageTitle>
      <FinanceView />
    </div>
  );
}
