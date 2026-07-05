import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const Route = createFileRoute('/company-structure/production-lines/')({
  component: ProductionLinesPage,
});

function ProductionLinesPage() {
  return <PlaceholderPage title="生产线" description="生产线主数据管理（开发中）" />;
}
