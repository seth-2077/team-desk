import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { FieldGroup } from './field';
import { Button } from './button';

export function FormDialog({
  title,
  description = '填写以下信息，保存后立即生效。',
  children,
  busy,
  onClose,
  onSubmit,
  error,
  submitLabel = '保存',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  error?: string;
  submitLabel?: string;
}) {
  const returnFocus = useRef(document.activeElement);
  const content = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px]" />
        <Dialog.Content
          ref={content}
          onOpenAutoFocus={(event) => {
            const first = content.current?.querySelector<HTMLElement>(
              'form input:not([type="hidden"]), form textarea, form select, form button[type="button"]',
            );
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current instanceof HTMLElement)
              returnFocus.current.focus();
          }}
          onInteractOutside={(e) => {
            if (busy) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        >
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            {description}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              aria-label="关闭"
              className="absolute right-3 top-3 px-2"
            >
              <X size={18} />
            </Button>
          </Dialog.Close>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="mt-6 flex flex-col gap-4"
          >
            <fieldset disabled={busy} className="min-w-0">
              <FieldGroup>{children}</FieldGroup>
            </fieldset>
            {error && (
              <p
                role="alert"
                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onClose}
              >
                取消
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? submitLabel + '中…' : submitLabel}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
