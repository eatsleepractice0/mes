import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const Route = createFileRoute('/company-structure/factories/')({
  component: FactoriesPage,
});

function FactoriesPage() {
  return <PlaceholderPage title="工厂信息" description="工厂主数据管理（开发中）" />;
}
