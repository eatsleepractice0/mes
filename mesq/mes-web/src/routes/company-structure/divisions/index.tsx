import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const Route = createFileRoute('/company-structure/divisions/')({
  component: DivisionsPage,
});

function DivisionsPage() {
  return <PlaceholderPage title="生产部门" description="生产部门主数据管理（开发中）" />;
}
