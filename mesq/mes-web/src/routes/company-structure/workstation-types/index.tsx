import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export const Route = createFileRoute('/company-structure/workstation-types/')({
  component: WorkstationTypesPage,
});

function WorkstationTypesPage() {
  return <PlaceholderPage title="工作站类型" description="工作站类型主数据管理（开发中）" />;
}
