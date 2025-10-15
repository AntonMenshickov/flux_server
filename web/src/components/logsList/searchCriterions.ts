import { LogLevel } from '@/model/event/logLevel';
import { Operator, SearchFieldKey, ValueType, type FieldOption } from '../base/smartSearch/types';

export const fieldOptions: FieldOption[] = [
  {
    key: SearchFieldKey.Message,
    operators: [Operator.Similar, Operator.Equals, Operator.NotEquals],
    valueType: ValueType.String,
    placeholder: 'Log message',
  },
  {
    key: SearchFieldKey.LogLevel,
    operators: [Operator.In, Operator.NotIn],
    valueType: ValueType.MultiSelect,
    fetchValues: async (filter = '') => {
      return Object.values(LogLevel).filter(l => l.toString().toLowerCase().includes(filter.toLowerCase())).map(l => l.toString());
    },
    placeholder: 'Select log levels',
  },
  {
    key: SearchFieldKey.Meta,
    operators: [Operator.Equals, Operator.NotEquals, Operator.Similar],
    valueType: ValueType.KeyValue,
    placeholder: 'Meta key-value',
  },
  {
    key: SearchFieldKey.Tags,
    operators: [Operator.Equals, Operator.In, Operator.NotIn],
    valueType: ValueType.String,
    placeholder: 'Comma separated tags',
  },
  {
    key: SearchFieldKey.DateFrom,
    operators: [Operator.Equals],
    valueType: ValueType.Date,
    placeholder: 'From date',
  },
  {
    key: SearchFieldKey.DateTo,
    operators: [Operator.Equals],
    valueType: ValueType.Date,
    placeholder: 'To date',
  },
  {
    key: SearchFieldKey.Platform,
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Platform name',
  },
  {
    key: SearchFieldKey.BundleId,
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Bundle ID',
  },
  {
    key: SearchFieldKey.DeviceId,
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Device ID',
  },
  {
    key: SearchFieldKey.DeviceName,
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Device Name',
  },
  {
    key: SearchFieldKey.OsName,
    operators: [Operator.Equals, Operator.Similar],
    valueType: ValueType.String,
    placeholder: 'Operating System Name',
  },
];