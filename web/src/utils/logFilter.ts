import { Operator, SearchCriterion, SearchFieldKey } from '@/components/base/smartSearch/types';
import { type EventMessage } from '@/model/event/eventMessage';

/**
 * Filters log array by search criteria
 * @param logs - array of logs to filter
 * @param criteria - search criteria
 * @returns filtered log array
 */
export function filterLogs(logs: EventMessage[], criteria: SearchCriterion[]): EventMessage[] {
  if (!criteria.length) {
    return logs;
  }

  return logs.filter(log => {
    // All criteria must match (AND logic)
    return criteria.every(criterion => matchesCriterion(log, criterion));
  });
}

/**
 * Checks if a log matches a single criterion
 */
function matchesCriterion(log: EventMessage, criterion: SearchCriterion): boolean {
  const { field, operator, value } = criterion;

  // Skip incomplete criteria
  if (!field || !operator || value === null) {
    return true;
  }

  switch (field) {
    case SearchFieldKey.Message:
      return matchString(log.message, operator, value as string);

    case SearchFieldKey.LogLevel:
      return matchArray([log.logLevel], operator, value as string[] | string);

    case SearchFieldKey.Meta:
      return matchMeta(log.meta, operator, value as Record<string, string>[]);

    case SearchFieldKey.Tags:
      return matchArray(log.tags ?? [], operator, value as string[] | string);

    case SearchFieldKey.Platform:
      return matchString(log.platform, operator, value as string);

    case SearchFieldKey.BundleId:
      return matchString(log.bundleId, operator, value as string);

    case SearchFieldKey.DeviceId:
      return matchString(log.deviceId, operator, value as string);

    case SearchFieldKey.DeviceName:
      return matchString(log.deviceName ?? '', operator, value as string);

    case SearchFieldKey.OsName:
      return matchString(log.osName ?? '', operator, value as string);

    case SearchFieldKey.Timestamp:
      return matchDate(new Date(log.timestamp), operator, value as Date);

    default:
      return true;
  }
}

/**
 * Compares string field with criterion
 */
function matchString(fieldValue: string, operator: Operator, criterionValue: string): boolean {
  const normalizedField = fieldValue.toLowerCase();
  const normalizedCriterion = criterionValue.toLowerCase();

  switch (operator) {
    case Operator.Equals:
      return fieldValue === criterionValue;

    case Operator.NotEquals:
      return fieldValue !== criterionValue;

    case Operator.Similar:
      return normalizedField.includes(normalizedCriterion);

    default:
      return true;
  }
}

/**
 * Compares date with criterion
 */
function matchDate(fieldValue: Date, operator: Operator, criterionValue: Date): boolean {

  switch (operator) {
    case Operator.GreaterThan:
      return fieldValue > criterionValue;
    case Operator.LessThan:
      return fieldValue < criterionValue;
    default:
      return true;
  }
}

/**
 * Compares array with criterion
 */
function matchArray(fieldValue: string[], operator: Operator, criterionValue: string[] | string): boolean {
  // Normalize criterionValue to array
  let criterionArray: string[];

  if (Array.isArray(criterionValue)) {
    criterionArray = criterionValue;
  } else if (typeof criterionValue === 'string') {
    // Split by commas if string (for tags support)
    criterionArray = criterionValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
  } else {
    return true; // Skip if type is unknown
  }

  switch (operator) {
    case Operator.Equals:
      // Check that arrays contain identical elements
      if (fieldValue.length !== criterionArray.length) {
        return false;
      }
      const sortedField = [...fieldValue].sort();
      const sortedCriterion = [...criterionArray].sort();
      return sortedField.every((val, idx) => val === sortedCriterion[idx]);

    case Operator.In:
      // At least one element from criterionArray is present in fieldValue
      return criterionArray.some(val => fieldValue.includes(val));

    case Operator.NotIn:
      // No elements from criterionArray are present in fieldValue
      return !criterionArray.some(val => fieldValue.includes(val));

    default:
      return true;
  }
}

/**
 * Compares meta object with criterion
 */
function matchMeta(
  fieldValue: Map<string, string> | undefined,
  operator: Operator,
  criterionValue: Record<string, string>[]
): boolean {
  const metaObj = fieldValue ? Object.fromEntries(fieldValue) : {};

  switch (operator) {
    case Operator.Equals: {
      // All key-value pairs from criterion must match exactly
      return criterionValue.every(kv => {
        const key = Object.keys(kv)[0];
        const val = Object.values(kv)[0];
        return metaObj[key] === val;
      });
    }

    case Operator.NotEquals: {
      // All key-value pairs from criterion must NOT match
      return criterionValue.every(kv => {
        const key = Object.keys(kv)[0];
        const val = Object.values(kv)[0];
        return metaObj[key] !== val;
      });
    }

    case Operator.Similar: {
      // All values from criterion must be contained in corresponding keys (case-insensitive)
      return criterionValue.every(kv => {
        const key = Object.keys(kv)[0];
        const val = Object.values(kv)[0];
        const metaVal = metaObj[key];
        if (!metaVal) {
          return false;
        }
        return metaVal.toLowerCase().includes(val.toLowerCase());
      });
    }

    default:
      return true;
  }
}
