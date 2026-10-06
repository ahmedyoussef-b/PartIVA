'use client';

import { ReverseEngineeringContent } from '@/app/admin/reverse-engineering/reverse-engineering-content';

export default async function ReverseEngineeringDemandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReverseEngineeringContent requestId={id} />;
}
