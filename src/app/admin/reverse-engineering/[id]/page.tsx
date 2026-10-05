'use client';

import ReverseEngineeringPage from '@/app/admin/reverse-engineering/page';

export default function ReverseEngineeringDemandePage({ params }: { params: { id: string } }) {
  return <ReverseEngineeringPage params={params} />;
}
