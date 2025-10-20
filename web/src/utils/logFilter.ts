import { Operator, SearchCriterion, SearchFieldKey } from '@/components/base/smartSearch/types';
import { type EventMessage } from '@/model/event/eventMessage';

/**
 * Фильтрует массив логов по заданным критериям поиска
 * @param logs - массив логов для фильтрации
 * @param criteria - критерии поиска
 * @returns отфильтрованный массив логов
 */
export function filterLogs(logs: EventMessage[], criteria: SearchCriterion[]): EventMessage[] {
  if (!criteria.length) {
    return logs;
  }

  return logs.filter(log => {
    // Все критерии должны совпадать (AND логика)
    return criteria.every(criterion => matchesCriterion(log, criterion));
  });
}

/**
 * Проверяет, соответствует ли лог одному критерию
 */
function matchesCriterion(log: EventMessage, criterion: SearchCriterion): boolean {
  const { field, operator, value } = criterion;

  // Если критерий неполный, пропускаем его
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
    
    case SearchFieldKey.DateFrom:
      return log.timestamp / 1000 >= new Date(value as string).getTime();
    
    case SearchFieldKey.DateTo:
      return log.timestamp / 1000 <= new Date(value as string).getTime();
    
    default:
      return true;
  }
}

/**
 * Сравнивает строковое поле с критерием
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
 * Сравнивает массив с критерием
 */
function matchArray(fieldValue: string[], operator: Operator, criterionValue: string[] | string): boolean {
  // Нормализуем criterionValue к массиву
  let criterionArray: string[];
  
  if (Array.isArray(criterionValue)) {
    criterionArray = criterionValue;
  } else if (typeof criterionValue === 'string') {
    // Если это строка, разбиваем по запятым (для поддержки tags)
    criterionArray = criterionValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
  } else {
    return true; // Если тип неизвестен, пропускаем
  }
  
  switch (operator) {
    case Operator.Equals:
      // Проверяем, что массивы содержат одинаковые элементы
      if (fieldValue.length !== criterionArray.length) {
        return false;
      }
      const sortedField = [...fieldValue].sort();
      const sortedCriterion = [...criterionArray].sort();
      return sortedField.every((val, idx) => val === sortedCriterion[idx]);
    
    case Operator.In:
      // Хотя бы один элемент из criterionArray присутствует в fieldValue
      return criterionArray.some(val => fieldValue.includes(val));
    
    case Operator.NotIn:
      // Ни один элемент из criterionArray не присутствует в fieldValue
      return !criterionArray.some(val => fieldValue.includes(val));
    
    default:
      return true;
  }
}

/**
 * Сравнивает meta объект с критерием
 */
function matchMeta(
  fieldValue: Map<string, string> | undefined, 
  operator: Operator, 
  criterionValue: Record<string, string>[]
): boolean {
  const metaObj = fieldValue ? Object.fromEntries(fieldValue) : {};
  
  switch (operator) {
    case Operator.Equals: {
      // Все пары ключ-значение из критерия должны точно совпадать
      return criterionValue.every(kv => {
        const key = Object.keys(kv)[0];
        const val = Object.values(kv)[0];
        return metaObj[key] === val;
      });
    }
    
    case Operator.NotEquals: {
      // Все пары ключ-значение из критерия должны НЕ совпадать
      return criterionValue.every(kv => {
        const key = Object.keys(kv)[0];
        const val = Object.values(kv)[0];
        return metaObj[key] !== val;
      });
    }
    
    case Operator.Similar: {
      // Все значения из критерия должны содержаться в соответствующих ключах (case-insensitive)
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
