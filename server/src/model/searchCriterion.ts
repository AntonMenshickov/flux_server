export enum ValueType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Async = 'async',
  KeyValue = 'keyValue',
  MultiSelect = 'multiselect',
}

export enum SearchFieldKey {
  DateFrom = 'dateFrom',
  DateTo = 'dateTo',
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
  field: SearchFieldKey;
  operator: Operator;
  value: string | number | Date | Record<string, string>[] | string[];

}