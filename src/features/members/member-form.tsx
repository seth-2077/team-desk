import { useSubmitErrorFocus } from '../../shared/use-submit-error-focus';
import { Input } from '../../shared/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberInputSchema, type Member, type MemberInput } from './schema';
import { ApiError, errorMessage } from '../../shared/api';
import { Field } from '../../shared/ui/field';
import { FormDialog } from '../../shared/ui/form-dialog';

export function toMemberInput(member?: Member): MemberInput {
  return member
    ? {
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
      }
    : { name: '', email: '', role: 'agent', status: 'active' };
}
export function MemberForm({
  member,
  onSave,
  onClose,
}: {
  member?: Member;
  onSave: (input: MemberInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberInputSchema),
    defaultValues: toMemberInput(member),
  });
  const focusError = useSubmitErrorFocus(isSubmitting, setFocus);
  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of ['name', 'email', 'role', 'status'] as const) {
          const message = error.body.fields?.[field];
          if (message) {
            setError(field, { message });
            focusError(field);
          }
        }
      }
      setError('root', { message: errorMessage(error) });
    }
  });
  return (
    <FormDialog
      title={member ? '编辑成员' : '新增成员'}
      busy={isSubmitting}
      onClose={onClose}
      onSubmit={() => {
        void submit();
      }}
      error={errors.root?.message}
    >
      <Field id="name" label="姓名" error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
        />
      </Field>
      <Field id="email" label="邮箱" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id="role" label="角色" error={errors.role?.message}>
          <select id="role" {...register('role')}>
            <option value="admin">管理员</option>
            <option value="agent">协作成员</option>
            <option value="viewer">观察者</option>
          </select>
        </Field>
        <Field id="status" label="状态" error={errors.status?.message}>
          <select id="status" {...register('status')}>
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </Field>
      </div>
    </FormDialog>
  );
}
