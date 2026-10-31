import raw from '../data/reference.json' with {type:'json'};
import {correctedReference} from './reference-corrections.ts';
import type {ReferenceData} from './reference-types.ts';
export const reference=correctedReference(raw as unknown as ReferenceData);
