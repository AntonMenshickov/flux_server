export interface FieldOption {
  key: string;
  operators: Operator[];
  valueType?: 'string' | 'number' | 'date' | 'async' | 'keyValue';
  fetchValues?: (filter: string) => Promise<string[]>;
}

export enum Operator {
  Equals = '=',
  NotEquals = '!=',
  Similar = '~',
  GreaterThan = '>',
  LessThan = '<',
  
}

export class SearchCriterion {
  constructor(
    public field: string | null = null,
    public operator: Operator | null = null,
    public value: string | null = null
  ) {}
}