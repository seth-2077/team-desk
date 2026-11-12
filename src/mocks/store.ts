import { type Member } from '../features/members/schema';
import { type Ticket } from '../features/tickets/schema';

const initialMembers: Member[] = [
  {
    id: 'm1',
    name: '林晓',
    email: 'lin@teamdesk.dev',
    role: 'admin',
    status: 'active',
  },
  {
    id: 'm2',
    name: '陈宇',
    email: 'chen@teamdesk.dev',
    role: 'agent',
    status: 'active',
  },
  {
    id: 'm3',
    name: '周宁',
    email: 'zhou@teamdesk.dev',
    role: 'viewer',
    status: 'inactive',
  },
];
const initialTickets: Ticket[] = [
  {
    id: 't1',
    title: '排查支付回调延迟',
    description: '检查队列与回调日志，确认重试策略。',
    type: 'incident',
    impact: '支付服务',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'm2',
    startsAt: '2026-11-12T09:00:00',
    dueAt: '2026-11-13T18:00:00',
    checklist: [{ text: '检查告警日志', done: false }],
    version: 1,
  },
  {
    id: 't2',
    title: '更新团队使用手册',
    description: '整理新成员入职说明。',
    type: 'normal',
    status: 'open',
    priority: 'medium',
    assigneeId: 'm3',
    startsAt: '2026-11-12T09:00:00',
    dueAt: '2026-11-15T18:00:00',
    checklist: [],
    version: 1,
  },
];
export const store = {
  members: structuredClone(initialMembers),
  tickets: structuredClone(initialTickets),
  sequence: 10,
  scenario: 'none' as 'none' | 'failure' | 'conflict',
};
export function resetStore() {
  store.members = structuredClone(initialMembers);
  store.tickets = structuredClone(initialTickets);
  store.sequence = 10;
  store.scenario = 'none';
}
