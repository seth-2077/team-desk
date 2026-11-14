import { useState, type Ref } from 'react';
import { SearchInput } from './search-input';
import { SelectControl } from './select-control';

export type SearchSelectOption = { value: string; label: string };

/**
 * 搜索选择器：搜索框 + 下拉选择 + 固定高度状态行。
 * 只负责展示和交互，数据查询与选项组装由业务模块完成。
 */
export function SearchSelect({
  id,
  value,
  onChange,
  options,
  search,
  onSearchChange,
  searchLabel,
  searchPlaceholder,
  loading,
  errorText,
  error,
  selectRef,
  onBlur,
  disabled,
  loadingText = '搜索中…',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder?: string;
  loading?: boolean;
  errorText?: string;
  error?: string;
  selectRef?: Ref<HTMLButtonElement>;
  onBlur?: () => void;
  disabled?: boolean;
  loadingText?: string;
}) {
  const [open, setOpen] = useState(false);
  const statusText = errorText ?? (loading ? loadingText : '');

  // 搜索结果要立刻看得见：有查询词就展开下拉，清空则收起。
  function handleSearchChange(next: string) {
    onSearchChange(next);
    setOpen(!!next);
  }
  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        aria-label={searchLabel}
        placeholder={searchPlaceholder}
        value={search}
        onValueChange={handleSearchChange}
        disabled={disabled}
        live
      />
      <SelectControl
        id={id}
        ref={selectRef}
        onBlur={onBlur}
        disabled={disabled}
        value={value}
        onValueChange={(next) => {
          setOpen(false);
          onChange(next);
        }}
        open={open}
        onOpenChange={setOpen}
        options={options}
        aria-invalid={!!error}
        aria-describedby={
          error ? id + '-description ' + id + '-error' : id + '-description'
        }
      />
      <p
        role={errorText ? 'alert' : 'status'}
        className={
          'min-h-4 text-xs ' + (errorText ? 'text-red-600' : 'text-slate-500')
        }
      >
        {statusText}
      </p>
    </div>
  );
}
