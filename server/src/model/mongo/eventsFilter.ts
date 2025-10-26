import { model, Types, Schema } from 'mongoose';
import { IBaseSchema, baseSchema } from './baseSchema';
import { SearchFieldKey, Operator } from '../searchCriterion';

export interface IEventsFilter extends IBaseSchema {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  criteria: ICriteriaItem[];
}

export interface ICriteriaItem {
  field: SearchFieldKey;
  operator: Operator;
  value: string | number | Date | Record<string, string>[] | string[];
}

const criteriaItemSchema = new Schema<ICriteriaItem>({
  field: { 
    type: String, 
    required: true, 
    enum: Object.values(SearchFieldKey) 
  },
  operator: { 
    type: String, 
    required: true, 
    enum: Object.values(Operator) 
  },
  value: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
});

export const eventsFilterSchema = baseSchema<IEventsFilter>({
  user: { 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  criteria: { 
    type: [criteriaItemSchema], 
    required: true,
    default: []
  },
});

eventsFilterSchema.index({ user: 1, name: 1 }, { unique: true });

export const EventsFilter = model<IEventsFilter>('EventsFilter', eventsFilterSchema);

