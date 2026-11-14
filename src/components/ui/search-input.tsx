import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from './input';

/**
 * 搜索框：草稿值本地维护，输入法合成期间不回传。
 *
 * 直接把 URL 里的查询值绑到 Input 上、每次按键都导航，会在输入法合成期间
 * 被异步回写打断，最终拼出“chen陈陈”这类脏值，接口返回空列表。
 *
 * 默认按百度/谷歌的习惯：输入完按回车、点搜索图标或失焦才查询；
 * `live` 模式用于下拉筛选（边打边过滤），只做防抖，不额外要求确认。
 */
export function SearchInput({
  value,
  onValueChange,
  live = false,
  delay = 300,
  className,
  onBlur,
  onKeyDown,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'defaultValue'> & {
  value: string;
  onValueChange: (value: string) => void;
  live?: boolean;
  delay?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [composing, setComposing] = useState(false);
  const committed = useRef(value);
  const callback = useRef(onValueChange);

  useEffect(() => {
    callback.current = onValueChange;
  }, [onValueChange]);

  // 外部值（URL 前进/后退、重置筛选）变化时同步草稿。
  useEffect(() => {
    if (committed.current === value) return;
    committed.current = value;
    setDraft(value);
  }, [value]);

  // live 模式：草稿稳定且不在合成中才提交，避免合成中断与逐字请求。
  useEffect(() => {
    if (!live || composing || draft === committed.current) return;
    const timer = setTimeout(() => {
      committed.current = draft;
      callback.current(draft);
    }, delay);
    return () => clearTimeout(timer);
  }, [composing, delay, draft, live]);

  function commit(next: string) {
    if (next === committed.current) return;
    committed.current = next;
    callback.current(next);
  }

  function clear() {
    setDraft('');
    commit('');
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        {...props}
        className={cn(
          draft && (live ? 'pr-8' : 'pr-14'),
          !draft && !live && 'pr-8',
        )}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key !== 'Enter' || composing) return;
          event.preventDefault();
          commit(draft);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!live) commit(draft);
        }}
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {draft && (
          <button
            type="button"
            aria-label="清除搜索"
            className="text-slate-400 transition-colors hover:text-slate-600"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
          >
            <X className="size-4" />
          </button>
        )}
        {!live && (
          <button
            type="button"
            aria-label="执行搜索"
            className="text-slate-400 transition-colors hover:text-slate-600"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => commit(draft)}
          >
            <Search className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
