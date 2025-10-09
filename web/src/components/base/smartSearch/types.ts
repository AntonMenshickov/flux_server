export enum ValueType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Async = 'async',
  KeyValue = 'keyValue',
  MultiSelect = 'multiselect',
}

export interface FieldOption {
  key: string;
  operators: Operator[];
  valueType: ValueType;
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
  NotIn = '!in',
}

export class SearchCriterion {
  constructor(
    public field: string | null = null,
    public operator: Operator | null = null,
    public value: string | number | Date | Record<string, string>[] | string[] | null = null
  ) { }
}