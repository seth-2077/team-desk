import { SelectControl } from '../../../shared/ui/select-control';
import { useSubmitErrorFocus } from '../../../shared/hooks/use-submit-error-focus';
import { Input } from '../../../shared/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberInputSchema, type Member, type MemberInput } from '../schema';
import { ApiError, errorMessage } from '../../../shared/api';
import { Field } from '../../../shared/ui/field';
import { FormDialog } from '../../../shared/ui/form-dialog';

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
    control,
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
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SelectControl
                id="role"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.role}
                aria-describedby="role-error"
                options={[
                  { value: 'admin', label: '管理员' },
                  { value: 'agent', label: '协作成员' },
                  { value: 'viewer', label: '观察者' },
                ]}
              />
            )}
          />
        </Field>
        <Field id="status" label="状态" error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SelectControl
                id="status"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.status}
                aria-describedby="status-error"
                options={[
                  { value: 'active', label: '启用' },
                  { value: 'inactive', label: '停用' },
                ]}
              />
            )}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
