import ReceiptClient from '@/components/f4/ReceiptClient';

export const dynamic = 'force-dynamic';

export default function ReceiptPage({ params }: { params: { donationId: string } }) {
  return <ReceiptClient donationId={params.donationId} />;
}
