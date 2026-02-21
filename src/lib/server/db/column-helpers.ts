import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date', precision: 3 })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date', precision: 3 })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
	deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date', precision: 3 })
};
