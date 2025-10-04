export interface FieldOption {
  key: string;
  operators: Operator[];
  valueType?: 'string' | 'number' | 'date' | 'async' | 'keyValue' | 'multiselect';
  fetchValues?: (filter: string) => Promise<string[]>;
  placeholder?: string;
}

export enum Operator {
  Equals = '=',
  NotEquals = '!=',
  Similar = '~',
  GreaterThan = '>',
  LessThan = '<',
  In = 'in',
  NotIn = 'not in',
}

export class SearchCriterion {
  constructor(
    public field: string | null = null,
    public operator: Operator | null = null,
    public value: string | null = null
  ) {}
}