import { Schema } from 'mongoose';

export interface IBaseSchema {
  createdAt: Date;
  updatedAt?: Date;
}
// Helper to extend a schema definition with createdAt/updatedAt and a pre-save hook
export function withTimestamps<T extends {}>(definition: Record<string, any>) {
  const base = {
    createdAt: { type: Date, required: false },
    updatedAt: { type: Date, required: false },
  };

  const schema = new Schema({ ...definition, ...base } as any);

  schema.pre('save', function (next) {
    // `this` is the document
    if ((this as any).isNew) {
      (this as any).createdAt = new Date();
    } else {
      (this as any).updatedAt = new Date();
    }
    next();
  });

  return schema;
}
