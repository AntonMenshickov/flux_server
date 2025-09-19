import type { User } from '../user';
import type { Bundle } from './bundle';

export interface Application {
  id: string;
  name: string;
  bundles: Bundle[];
  token: string;
  maintainers: User[];
}