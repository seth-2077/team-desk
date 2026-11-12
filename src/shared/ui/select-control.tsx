import type { ComponentProps, Ref } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { cn } from '../utils';

type SelectControlProps = Omit<
  ComponentProps<typeof SelectTrigger>,
  'value' | 'onChange' | 'children' | 'ref'
> & {
  value: string | number;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  name?: string;
  ref?: Ref<HTMLButtonElement>;
};

export function SelectControl({
  value,
  onValueChange,
  options,
  name,
  disabled,
  className,
  ref,
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
