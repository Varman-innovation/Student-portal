import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const webinarRegistrations = sqliteTable(
  'webinar_registrations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    upstreamStudentId: text('upstream_student_id').notNull(),
    source: text('source'),
    campaign: text('campaign'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_webinar_registrations_email').on(table.email),
    uniqueIndex('idx_webinar_registrations_phone').on(table.phone),
  ],
);
