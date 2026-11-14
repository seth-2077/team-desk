import { type Member } from '@/api/members/schemas';
import { type Project } from '@/api/projects/schemas';
import { type Ticket } from '@/api/tickets/schemas';

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
const initialProjects: Project[] = [
  {
    id: 'p1',
    name: '支付链路重构',
    code: 'TD-01',
    status: 'in_progress',
    ownerId: 'm2',
  },
  {
    id: 'p2',
    name: '团队手册改版',
    code: 'TD-02',
    status: 'archived',
    ownerId: 'm1',
  },
];
export const store = {
  members: structuredClone(initialMembers),
  projects: structuredClone(initialProjects),
  tickets: structuredClone(initialTickets),
  sequence: 10,
  scenario: 'none' as 'none' | 'failure' | 'conflict',
};
export function resetStore() {
  store.members = structuredClone(initialMembers);
  store.projects = structuredClone(initialProjects);
  store.tickets = structuredClone(initialTickets);
  store.sequence = 10;
  store.scenario = 'none';
}
