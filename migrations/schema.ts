import { pgTable, foreignKey, unique, pgPolicy, uuid, text, integer, timestamp, varchar, date, numeric, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const schools = pgTable("schools", {
	schoolId: uuid("school_id").defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	schoolNumber: integer("school_number"),
	city: text(),
	state: text(),
	country: text(),
	address: text(),
	phone: text(),
	principalName: text("principal_name"),
	principalEmail: text("principal_email"),
	assistantPrincipalName: text("assistant_principal_name"),
	assistantPrincipalEmail: text("assistant_principal_email"),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "schools_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("schools_external_key_unique").on(table.externalKey),
	unique("schools_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Schools", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const courses = pgTable("courses", {
	courseId: uuid("course_id").defaultRandom().primaryKey().notNull(),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	schoolId: uuid("school_id").notNull(),
	name: text(),
	localCourseCode: text("local_course_code"),
	stateCourseCode: text("state_course_code"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.schoolId],
			name: "courses_school_id_schools_school_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "courses_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("courses_external_key_unique").on(table.externalKey),
	unique("courses_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Courses", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const customers = pgTable("customers", {
	customerId: uuid("customer_id").defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("customers_name_unique").on(table.name),
]);

export const users = pgTable("users", {
	userId: uuid("user_id").primaryKey().notNull(),
	authUserId: uuid("auth_user_id").notNull(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	email: varchar({ length: 256 }).notNull(),
	imageUrl: text("image_url"),
});

export const reports = pgTable("reports", {
	reportId: uuid("report_id").defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 256 }).notNull(),
	description: text(),
	pageName: varchar("page_name"),
	params: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "reports_user_id_users_user_id_fk"
		}),
]);

export const sections = pgTable("sections", {
	sectionId: uuid("section_id").defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	noOfStudents: integer("no_of_students").notNull(),
	sectionNumber: integer("section_number").notNull(),
	courseNumber: text("course_number").notNull(),
	gradeLevel: text("grade_level").notNull(),
	transactionDate: date("transaction_date"),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.courseId],
			name: "sections_course_id_courses_course_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "sections_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("sections_external_key_unique").on(table.externalKey),
	unique("sections_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Sections", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const sectionEnrollments = pgTable("section_enrollments", {
	sectionEnrollmentId: uuid("section_enrollment_id").defaultRandom().primaryKey().notNull(),
	sectionId: uuid("section_id"),
	studentId: uuid("student_id"),
	termId: uuid("term_id"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	absences: integer().default(0).notNull(),
	tardies: integer().default(0).notNull(),
	transactionDate: date("transaction_date"),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [sections.sectionId],
			name: "section_enrollments_section_id_sections_section_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.studentId],
			name: "section_enrollments_student_id_students_student_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.termId],
			name: "section_enrollments_term_id_terms_term_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "section_enrollments_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("section_enrollments_student_id_section_id_term_id_unique").on(table.sectionId, table.studentId, table.termId),
	unique("section_enrollments_external_key_unique").on(table.externalKey),
	unique("section_enrollments_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Section Enrollments", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const students = pgTable("students", {
	studentId: uuid("student_id").defaultRandom().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	middleName: text("middle_name"),
	lastName: text("last_name").notNull(),
	fullName: text("full_name").notNull(),
	email: varchar({ length: 256 }),
	phone: varchar({ length: 256 }),
	gradeLevel: integer("grade_level").notNull(),
	gender: varchar({ length: 256 }),
	dateOfBirth: date("date_of_birth"),
	graduationYear: integer("graduation_year"),
	enrollmentStatus: text("enrollment_status").notNull(),
	homeroomName: text("homeroom_name"),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "students_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("students_external_key_unique").on(table.externalKey),
	unique("students_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Students", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const terms = pgTable("terms", {
	termId: uuid("term_id").defaultRandom().primaryKey().notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date").notNull(),
	abbreviation: text().notNull(),
	schoolId: uuid("school_id").notNull(),
	yearId: uuid("year_id").notNull(),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.schoolId],
			name: "terms_school_id_schools_school_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.yearId],
			foreignColumns: [years.yearId],
			name: "terms_year_id_years_year_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "terms_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("terms_external_key_unique").on(table.externalKey),
	unique("terms_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Terms", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const studentGrades = pgTable("student_grades", {
	gradeId: uuid("grade_id").defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	sectionId: uuid("section_id").notNull(),
	termId: uuid("term_id").notNull(),
	courseId: uuid("course_id").notNull(),
	gradeLetter: text("grade_letter"),
	gradeCode: text("grade_code").notNull(),
	gradePercent: numeric("grade_percent"),
	gradePoints: numeric("grade_points"),
	creditHoursEarned: numeric("credit_hours_earned"),
	creditType: text("credit_type"),
	gradeStatus: text("grade_status").notNull(),
	comment: text(),
	gradeLevel: text("grade_level"),
	sourceApi: text("source_api"),
	sourceUpdatedDate: timestamp("source_updated_date", { mode: 'string' }).notNull(),
	externalSource: text("external_source").default('Powerschool').notNull(),
	externalName: text("external_name"),
	externalId: text("external_id").notNull(),
	externalKey: text("external_key").notNull(),
	externalKeyHash: text("external_key_hash").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	customerId: uuid("customer_id"),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.studentId],
			name: "student_grades_student_id_students_student_id_fk"
		}),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [sections.sectionId],
			name: "student_grades_section_id_sections_section_id_fk"
		}),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [terms.termId],
			name: "student_grades_term_id_terms_term_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.courseId],
			name: "student_grades_course_id_courses_course_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.customerId],
			name: "student_grades_customer_id_customers_customer_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("student_grades_external_key_unique").on(table.externalKey),
	unique("student_grades_external_key_hash_unique").on(table.externalKeyHash),
	pgPolicy("Allow Reading of Student Grades", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const years = pgTable("years", {
	yearId: uuid("year_id").defaultRandom().primaryKey().notNull(),
	yearStart: integer("year_start").notNull(),
	yearEnd: integer("year_end").notNull(),
	yearExternalId: text("year_external_id").notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const userSchoolMemberships = pgTable("user_school_memberships", {
	userId: uuid("user_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	role: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_school_memberships_user_id_users_user_id_fk"
		}),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.schoolId],
			name: "user_school_memberships_school_id_schools_school_id_fk"
		}),
	primaryKey({ columns: [table.userId, table.schoolId], name: "user_school_memberships_user_id_school_id_pk"}),
]);

export const schoolStudentLink = pgTable("school_student_link", {
	studentId: uuid("student_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.studentId],
			name: "school_student_link_student_id_students_student_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.schoolId],
			name: "school_student_link_school_id_schools_school_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.studentId, table.schoolId], name: "school_student_link_student_id_school_id_pk"}),
	pgPolicy("Allow Reading of Student School Links", { as: "permissive", for: "select", to: ["authenticated"] }),
]);
