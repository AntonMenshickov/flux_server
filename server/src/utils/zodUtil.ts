import { Types } from 'mongoose';
import z, { nullable, ZodNumber } from 'zod';
import { LogLevel } from '../model/eventMessageDto';
import { SearchFieldKey, Operator } from '../model/searchCriterion';

export const objectIdSchema = z
  .string()
  .refine((val: string) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }).transform((val: string) => new Types.ObjectId(val));

  export const numberFromStringSchema = z
  .string()
  .transform((val: string) => Number(val)).refine((val) => !isNaN(val), { message: 'Invalid number', });

/**
 * Схема валидации для одного критерия поиска
 * Используется для валидации критериев в фильтрах событий
 */
export const criterionItemSchema = z.object({
  field: z.enum(Object.values(SearchFieldKey) as [SearchFieldKey, ...SearchFieldKey[]]),
  operator: z.enum(Object.values(Operator) as [Operator, ...Operator[]]),
  value: z.union([
    z.string().trim(),
    z.number(),
    z.coerce.date(),
    z.array(z.string()),
    z.array(z.record(z.string(), z.string())),
  ]),
});

/**
 * Схема валидации для массива критериев поиска
 */
export const criteriaArraySchema = z.array(criterionItemSchema);

export const eventMessageDtoSchema = z.object({
  message: z.string().trim(),
  logLevel: z.enum(LogLevel),
  tags: z.array(z.string().trim().nonempty()).optional(),
  meta: z.record(z.string(), z.string()).optional(),
  timestamp: z.number(),
  stackTrace: z.string().optional()
});