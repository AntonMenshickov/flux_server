import { Types } from 'mongoose';
import z, { nullable, ZodNumber } from 'zod';
import { LogLevel } from '../model/eventMessageDto';

export const objectIdSchema = z
  .string()
  .refine((val: string) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }).transform((val: string) => new Types.ObjectId(val));

  export const numberFromStringSchema = z
  .string()
  .transform((val: string) => Number(val)).refine((val) => !isNaN(val), { message: 'Invalid number', });

export const eventMessageDtoSchema = z.object({
  message: z.string().trim(),
  logLevel: z.enum(LogLevel),
  tags: z.array(z.string().trim().nonempty()).optional(),
  meta: z.record(z.string(), z.string()).optional(),
  timestamp: z.number(),
  stackTrace: z.string().optional()
});