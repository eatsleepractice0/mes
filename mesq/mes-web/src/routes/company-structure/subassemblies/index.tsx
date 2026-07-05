import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const Route = createFileRoute('/company-structure/subassemblies/')({
  component: SubassembliesPage,
});

function SubassembliesPage() {
  return <PlaceholderPage title="部件信息" description="部件主数据管理（开发中）" />;
}
