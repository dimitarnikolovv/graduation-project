import type { EventAttributeDataType } from './enums';

export type EventAttribute = {
	name: string;
	value: string;
	dataType: EventAttributeDataType;
	displayOrder: number;
};
