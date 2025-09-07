import { Types } from 'mongoose';
import z, { ZodNumber } from 'zod';

export const objectIdSchema = z
  .string()
  .refine((val: string) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });