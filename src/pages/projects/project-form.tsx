import { SelectControl } from '@/components/ui/select-control';
import { Input } from '@/components/ui/input';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  projectInputSchema,
  type Project,
  type ProjectInput,
} from '@/api/projects/schemas';
import { AssigneeSelect } from '@/components/assignee-select';
import { ApiError, errorMessage } from '@/api/client';
import { Field } from '@/components/ui/field';
import { FormDialog } from '@/components/ui/form-dialog';
import { useSubmitErrorFocus } from '@/hooks/use-submit-error-focus';

const statuses = { in_progress: '进行中', archived: '已归档' };

export function toProjectInput(project?: Project): ProjectInput {
  return project
    ? {
        name: project.name,
        code: project.code,
        status: project.status,
        ownerId: project.ownerId,
      }
    : { name: '', code: '', status: 'in_progress', ownerId: '' };
}
export function ProjectForm({
  project,
  onSave,
  onClose,
}: {
  project?: Project;
  onSave: (input: ProjectInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const archived = project?.status === 'archived';
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: toProjectInput(project),
  });
  const focusError = useSubmitErrorFocus(isSubmitting, setFocus);
  const submit = handleSubmit(async (values) => {
    try {
      await onSave(values);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of ['name', 'code', 'status', 'ownerId'] as const) {
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
      title={project ? '编辑项目' : '新增项目'}
      description="编号唯一；负责人只能从启用成员中选择。"
      busy={isSubmitting}
      onClose={onClose}
      onSubmit={() => {
        void submit();
      }}
      error={errors.root?.message}
    >
      <Field id="name" label="项目名称" error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field
          id="code"
          label="项目编号"
          error={errors.code?.message}
          description="格式如 TD-01，保存时统一大写。"
        >
          <Input
            id="code"
            placeholder="TD-01"
            {...register('code')}
            aria-invalid={!!errors.code}
            aria-describedby={
              errors.code ? 'code-description code-error' : 'code-description'
            }
          />
        </Field>
        <Field id="project-status" label="状态" error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SelectControl
                id="project-status"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.status}
                aria-describedby={
                  errors.status ? 'project-status-error' : undefined
                }
                options={[
                  { value: 'in_progress', label: statuses.in_progress },
                  { value: 'archived', label: statuses.archived },
                ]}
              />
            )}
          />
        </Field>
      </div>
      <Field
        id="ownerId"
        label="负责人"
        error={errors.ownerId?.message}
        description={
          archived ? '项目已归档，负责人不可修改。' : '只能从启用成员中选择。'
        }
      >
        <Controller
          control={control}
          name="ownerId"
          render={({ field }) => (
            <AssigneeSelect
              id="ownerId"
              selectRef={field.ref}
              disabled={isSubmitting || archived}
              onBlur={field.onBlur}
              value={field.value}
              onChange={field.onChange}
              historicalId={project?.ownerId}
              error={errors.ownerId?.message}
            />
          )}
        />
      </Field>
    </FormDialog>
  );
}
