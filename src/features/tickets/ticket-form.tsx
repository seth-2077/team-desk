import { SelectControl } from '../../shared/ui/select-control';
import { useSubmitErrorFocus } from '../../shared/use-submit-error-focus';
import { Textarea } from '../../shared/ui/textarea';
import { Input } from '../../shared/ui/input';
import { z } from 'zod';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  ticketInputSchema,
  ticketStatusSchema,
  prioritySchema,
  transitions,
  type Ticket,
  type TicketInput,
} from './schema';
import { AssigneeSelect } from '../members';
import { ApiError, errorMessage } from '../../shared/api';
import { Button } from '../../shared/ui/button';
import { Field } from '../../shared/ui/field';
import { FormDialog } from '../../shared/ui/form-dialog';

const formSchema = z
  .object({
    title: z.string().trim().min(1, '请输入标题').max(120),
    description: z.string().max(2000),
    type: z.enum(['normal', 'incident']),
    impact: z.string().max(500),
    status: ticketStatusSchema,
    priority: prioritySchema,
    assigneeId: z.string().min(1, '请选择负责人'),
    startsAt: z.iso.datetime({
      local: true,
      precision: -1,
      error: '请选择有效的计划开始时间',
    }),
    dueAt: z.iso.datetime({
      local: true,
      precision: -1,
      error: '请选择有效的截止时间',
    }),
    checklist: z
      .array(
        z.object({
          text: z.string().trim().min(1, '请输入检查项'),
          done: z.boolean(),
        }),
      )
      .max(20, '最多 20 个检查项'),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'incident' && !value.impact.trim())
      ctx.addIssue({
        code: 'custom',
        path: ['impact'],
        message: '故障工单必须填写影响范围',
      });
    if (value.dueAt < value.startsAt)
      ctx.addIssue({
        code: 'custom',
        path: ['dueAt'],
        message: '截止时间不能早于计划开始时间',
      });
  });
export type TicketFormValues = z.infer<typeof formSchema>;
export function toTicketForm(ticket?: Ticket): TicketFormValues {
  return ticket
    ? {
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        impact: ticket.impact ?? '',
        status: ticket.status,
        priority: ticket.priority,
        assigneeId: ticket.assigneeId,
        startsAt: ticket.startsAt.slice(0, 16),
        dueAt: ticket.dueAt.slice(0, 16),
        checklist: ticket.checklist.map((item) => ({ ...item })),
      }
    : {
        title: '',
        description: '',
        type: 'normal',
        impact: '',
        status: 'open',
        priority: 'medium',
        assigneeId: '',
        startsAt: '',
        dueAt: '',
        checklist: [],
      };
}
export function toTicketInput(values: TicketFormValues): TicketInput {
  const { impact, ...rest } = values;
  return ticketInputSchema.parse({
    ...rest,
    startsAt:
      values.startsAt.length === 16 ? values.startsAt + ':00' : values.startsAt,
    dueAt: values.dueAt.length === 16 ? values.dueAt + ':00' : values.dueAt,
    ...(values.type === 'incident' ? { impact } : {}),
  });
}
const statuses = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};
export function TicketForm({
  ticket,
  onSave,
  onClose,
}: {
  ticket?: Ticket;
  onSave: (input: TicketInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toTicketForm(ticket),
  });
  const type = useWatch({ control, name: 'type' });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'checklist',
  });
  const focusError = useSubmitErrorFocus(isSubmitting, setFocus);
  const submit = handleSubmit(async (values) => {
    try {
      await onSave(toTicketInput(values));
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        fields.forEach((_, index) => {
          const message = error.body.fields?.['checklist.' + index + '.text'];
          if (message) {
            setError(`checklist.${index}.text`, { message });
            focusError(`checklist.${index}.text`);
          }
        });
        for (const field of [
          'title',
          'description',
          'type',
          'impact',
          'status',
          'priority',
          'assigneeId',
          'startsAt',
          'dueAt',
          'checklist',
        ] as const) {
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
      title={ticket ? '编辑工单' : '新增工单'}
      description={
        ticket
          ? '更新工单详情。版本 ' + ticket.version + ' · 保存时检查并发修改。'
          : '定义工作内容、负责人和交付时间。'
      }
      busy={isSubmitting}
      onClose={onClose}
      onSubmit={() => {
        void submit();
      }}
      error={errors.root?.message}
    >
      <Field id="title" label="工单标题" error={errors.title?.message}>
        <Input
          id="title"
          {...register('title')}
          aria-invalid={!!errors.title}
          aria-describedby="title-error"
        />
      </Field>
      <Field id="description" label="描述" error={errors.description?.message}>
        <Textarea id="description" rows={2} {...register('description')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field id="type" label="工单类型">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectControl
                id="type"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.type}
                aria-describedby="type-error"
                options={[
                  { value: 'normal', label: '普通工单' },
                  { value: 'incident', label: '故障工单' },
                ]}
              />
            )}
          />
        </Field>
        <Field id="priority" label="优先级">
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <SelectControl
                id="priority"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
                aria-invalid={!!errors.priority}
                aria-describedby="priority-error"
                options={[
                  { value: 'low', label: '低' },
                  { value: 'medium', label: '中' },
                  { value: 'high', label: '高' },
                ]}
              />
            )}
          />
        </Field>
      </div>
      {type === 'incident' && (
        <Field id="impact" label="影响范围" error={errors.impact?.message}>
          <Input
            id="impact"
            {...register('impact')}
            aria-invalid={!!errors.impact}
            aria-describedby="impact-error"
          />
        </Field>
      )}
      <Field
        id="assigneeId"
        label="负责人"
        error={errors.assigneeId?.message}
        description="仅可新指派启用成员；保留历史停用负责人。"
      >
        <Controller
          control={control}
          name="assigneeId"
          render={({ field }) => (
            <AssigneeSelect
              selectRef={field.ref}
              disabled={isSubmitting}
              onBlur={field.onBlur}
              value={field.value}
              onChange={field.onChange}
              historicalId={ticket?.assigneeId}
              error={errors.assigneeId?.message}
            />
          )}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field
          id="startsAt"
          label="计划开始时间"
          error={errors.startsAt?.message}
        >
          <Input
            id="startsAt"
            type="datetime-local"
            {...register('startsAt')}
            aria-invalid={!!errors.startsAt}
            aria-describedby="startsAt-error"
          />
        </Field>
        <Field id="dueAt" label="截止时间" error={errors.dueAt?.message}>
          <Input
            id="dueAt"
            type="datetime-local"
            {...register('dueAt')}
            aria-invalid={!!errors.dueAt}
            aria-describedby="dueAt-error"
          />
        </Field>
      </div>
      <Field
        id="ticket-status"
        label="工单状态"
        error={errors.status?.message}
        description="待处理 → 处理中 → 已解决 → 已关闭；已关闭不可恢复。"
      >
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SelectControl
              id="ticket-status"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onValueChange={field.onChange}
              disabled={isSubmitting}
              aria-invalid={!!errors.status}
              aria-describedby="ticket-status-error"
              options={[
                ...(ticket
                  ? transitions[ticket.status]
                  : (['open'] as const)
                ).map((value) => ({ value, label: statuses[value] })),
              ]}
            />
          )}
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">检查项</legend>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={fields.length >= 20}
            onClick={() => append({ text: '', done: false })}
          >
            <Plus data-icon="inline-start" />
            添加检查项
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-auto"
                aria-label={'完成检查项 ' + (index + 1)}
                {...register(`checklist.${index}.done`)}
              />
              <Input
                aria-label={'检查项 ' + (index + 1)}
                {...register(`checklist.${index}.text`)}
              />
              <Button
                variant="ghost"
                type="button"
                aria-label={'删除检查项 ' + (index + 1)}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
            {errors.checklist?.[index]?.text?.message && (
              <p role="alert" className="text-xs text-red-600">
                {errors.checklist[index]?.text?.message}
              </p>
            )}
          </div>
        ))}
        {errors.checklist?.message && (
          <p role="alert">{errors.checklist.message}</p>
        )}
      </fieldset>
    </FormDialog>
  );
}
