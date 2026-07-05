import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const Route = createFileRoute('/company-structure/workstations/')({
  component: WorkstationsPage,
});

function WorkstationsPage() {
  return <PlaceholderPage title="工作站" description="工作站主数据管理（开发中）" />;
}
