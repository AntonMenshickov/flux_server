export enum ValueType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Async = 'async',
  KeyValue = 'keyValue',
  MultiSelect = 'multiselect',
}

export enum SearchFieldKey {
  Timestamp = 'timestamp',
  Meta = 'meta',
  Message = 'message',
  LogLevel = 'logLevel',
  Tags = 'tags',
  Platform = 'platform',
  BundleId = 'bundleId',
  DeviceId = 'deviceId',
  DeviceName = 'deviceName',
  OsName = 'osName',
}

export interface FieldOption {
  key: SearchFieldKey;
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
    public field: SearchFieldKey | null = null,
    public operator: Operator | null = null,
    public value: string | number | Date | Record<string, string>[] | string[] | null = null
  ) { }
}