import { Typography } from 'antd';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <Typography.Title level={3}>{title}</Typography.Title>
      {description && (
        <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      )}
    </div>
  );
}
