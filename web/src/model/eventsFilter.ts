import type { Criterion } from '@/components/base/smartSearch/types';

export interface EventsFilter {
  id: string;
  name: string;
  criteria: Criterion[];
  createdAt: Date;
  updatedAt?: Date;
}


