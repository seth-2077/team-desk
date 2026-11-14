import type { ComponentProps, Ref } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { cn } from '@/lib/cn';

type SelectControlProps = Omit<
  ComponentProps<typeof SelectTrigger>,
  'value' | 'onChange' | 'children' | 'ref'
> & {
  value: string | number;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  name?: string;
  ref?: Ref<HTMLButtonElement>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SelectControl({
  value,
  onValueChange,
  options,
  name,
  disabled,
  className,
  ref,
  open,
  onOpenChange,
  ...props
}: SelectControlProps) {
  return (
    <Select
      items={options}
      value={String(value)}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
      name={name}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
    >
      <SelectTrigger
        ref={ref}
        className={cn('w-full min-w-0', className)}
        disabled={disabled}
        {...props}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
