import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
    pgPolicy,
    date,
    unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sections } from "./Sections";
import { terms } from "./Terms";
import { students } from "./Students";
import { customers } from "./Customers";

export const sectionEnrollments = pgTable(
    "section_enrollments",
    {
        sectionEnrollmentId: uuid("section_enrollment_id")
            .primaryKey()
            .defaultRandom(),
        sectionId: uuid("section_id").references(() => sections.sectionId, {
            onDelete: "cascade",
        }),
        studentId: uuid("student_id").references(() => students.studentId, {
            onDelete: "cascade",
        }),
        termId: uuid("term_id").references(() => terms.termId, {
            onDelete: "cascade",
        }),

        startDate: date("start_date"),
        endDate: date("end_date"),
        absences: integer("absences").notNull().default(0),
        tardies: integer("tardies").notNull().default(0),
        transactionDate: date("transaction_date"),

        externalSource: text('external_source').notNull().default('Powerschool'),
        externalName: text('external_name'),
        externalId: text('external_id').notNull(),
        externalKey: text('external_key').notNull().unique(),
        externalKeyHash: text('external_key_hash').notNull().unique(),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
        customerId: uuid('customer_id').references(() => customers.customerId, { onDelete: 'cascade', onUpdate: 'cascade' }),

    },
    (table) => ({
    unique: unique().on(table.studentId, table.sectionId, table.termId),
    rls: pgPolicy('Allow Reading of Section Enrollments', {
        for: 'select',
        to: 'authenticated',
        using: sql`
        EXISTS (
            SELECT 1
            FROM sections s
            JOIN courses c ON s.course_id = c.course_id
            JOIN user_school_memberships usm ON usm.school_id = c.school_id
            CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
            WHERE s.section_id = ${table.sectionId}
            AND usm.user_id = auth.uid()
            AND (
                app_context.current_school_id IS NULL OR
                c.school_id = app_context.current_school_id
            )
        )
        `,
    })
}));

export type SectionEnrollments = typeof sectionEnrollments.$inferSelect;
