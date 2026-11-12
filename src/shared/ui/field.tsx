import type { ReactNode } from 'react';

export function Field({
  id,
  label,
  error,
  description,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div data-invalid={!!error} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {description && (
        <p id={id + '-description'} className="text-xs text-slate-500">
          {description}
        </p>
      )}
      {error && (
        <p id={id + '-error'} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return (
    <div data-slot="field-group" className="flex flex-col gap-4">
      {children}
    </div>
  );
}
