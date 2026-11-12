import { FormDialog } from './form-dialog';

export function ConfirmDelete({
  name,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <FormDialog
      title="确认删除"
      submitLabel="确认删除"
      description="删除操作无法撤销。有关联数据时会由服务端拒绝。"
      busy={busy}
      onClose={onClose}
      onSubmit={onConfirm}
      error={error}
    >
      <p className="text-sm">确定删除「{name}」吗？</p>
    </FormDialog>
  );
}
