import DonateClient from '@/components/f4/DonateClient';

export const dynamic = 'force-dynamic';

export default function DonatePage({ params }: { params: { id: string } }) {
  return <DonateClient projectKey={params.id} />;
}
