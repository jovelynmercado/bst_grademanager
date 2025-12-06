interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" data-testid="text-page-title">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground" data-testid="text-page-description">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
