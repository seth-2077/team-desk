import { Link, useRevalidator, useRouteError } from 'react-router';
import { memberQuerySchema } from '@/api/members/schemas';
import { Button } from '@/components/ui/button';
import { hrefWithSearch } from '@/lib/search-params';

const membersHref = hrefWithSearch('/members', memberQuerySchema.parse({}));

export function RootError() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  return (
    <div role="alert" className="p-12">
      <h1 className="text-xl">页面暂时无法显示</h1>
      <p>{error instanceof Error ? error.message : '未知异常'}</p>
      <Button
        onClick={() => {
          void revalidator.revalidate();
        }}
      >
        重试
      </Button>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="p-12">
      页面不存在。
      <Link to={membersHref}>返回成员管理</Link>
    </div>
  );
}
