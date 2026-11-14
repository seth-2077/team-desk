import { useEffect, useRef } from 'react';
import type { FieldPath, FieldValues, UseFormSetFocus } from 'react-hook-form';

// 服务端失败回填发生在提交回调内；此时 fieldset 仍 disabled。
// 记录首个错误，等 RHF 完成提交并解除禁用后再聚焦。
export function useSubmitErrorFocus<T extends FieldValues>(
  busy: boolean,
  setFocus: UseFormSetFocus<T>,
) {
  const pending = useRef<FieldPath<T> | undefined>(undefined);
  useEffect(() => {
    if (!busy && pending.current) {
      setFocus(pending.current);
      pending.current = undefined;
    }
  }, [busy, setFocus]);
  return (field: FieldPath<T>) => {
    pending.current ??= field;
  };
}
