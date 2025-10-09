export enum ValueType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Async = 'async',
  KeyValue = 'keyValue',
  MultiSelect = 'multiselect',
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

export interface SearchCriterion {
  field: string;
  operator: Operator;
  value: string | number | Date | Record<string, string>[] | string[];

}