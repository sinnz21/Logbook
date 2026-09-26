import { specialCaseCategory } from '../../lib/format';

/** PWD and Senior Citizen drive the priority queue; everything else is a medical flag. */
export const isPriorityType = (t) => specialCaseCategory(t.caseName) !== 'medical';
