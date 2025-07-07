import { relations } from "drizzle-orm/relations";
import { customers, schools, courses, users, reports, sections, sectionEnrollments, students, terms, years, studentGrades, userSchoolMemberships, schoolStudentLink } from "./schema";

export const schoolsRelations = relations(schools, ({one, many}) => ({
	customer: one(customers, {
		fields: [schools.customerId],
		references: [customers.customerId]
	}),
	courses: many(courses),
	terms: many(terms),
	userSchoolMemberships: many(userSchoolMemberships),
	schoolStudentLinks: many(schoolStudentLink),
}));

export const customersRelations = relations(customers, ({many}) => ({
	schools: many(schools),
	courses: many(courses),
	sections: many(sections),
	sectionEnrollments: many(sectionEnrollments),
	students: many(students),
	terms: many(terms),
	studentGrades: many(studentGrades),
}));

export const coursesRelations = relations(courses, ({one, many}) => ({
	school: one(schools, {
		fields: [courses.schoolId],
		references: [schools.schoolId]
	}),
	customer: one(customers, {
		fields: [courses.customerId],
		references: [customers.customerId]
	}),
	sections: many(sections),
	studentGrades: many(studentGrades),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.userId],
		references: [users.userId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	reports: many(reports),
	userSchoolMemberships: many(userSchoolMemberships),
}));

export const sectionsRelations = relations(sections, ({one, many}) => ({
	course: one(courses, {
		fields: [sections.courseId],
		references: [courses.courseId]
	}),
	customer: one(customers, {
		fields: [sections.customerId],
		references: [customers.customerId]
	}),
	sectionEnrollments: many(sectionEnrollments),
	studentGrades: many(studentGrades),
}));

export const sectionEnrollmentsRelations = relations(sectionEnrollments, ({one}) => ({
	section: one(sections, {
		fields: [sectionEnrollments.sectionId],
		references: [sections.sectionId]
	}),
	student: one(students, {
		fields: [sectionEnrollments.studentId],
		references: [students.studentId]
	}),
	term: one(terms, {
		fields: [sectionEnrollments.termId],
		references: [terms.termId]
	}),
	customer: one(customers, {
		fields: [sectionEnrollments.customerId],
		references: [customers.customerId]
	}),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	sectionEnrollments: many(sectionEnrollments),
	customer: one(customers, {
		fields: [students.customerId],
		references: [customers.customerId]
	}),
	studentGrades: many(studentGrades),
	schoolStudentLinks: many(schoolStudentLink),
}));

export const termsRelations = relations(terms, ({one, many}) => ({
	sectionEnrollments: many(sectionEnrollments),
	school: one(schools, {
		fields: [terms.schoolId],
		references: [schools.schoolId]
	}),
	year: one(years, {
		fields: [terms.yearId],
		references: [years.yearId]
	}),
	customer: one(customers, {
		fields: [terms.customerId],
		references: [customers.customerId]
	}),
	studentGrades: many(studentGrades),
}));

export const yearsRelations = relations(years, ({many}) => ({
	terms: many(terms),
}));

export const studentGradesRelations = relations(studentGrades, ({one}) => ({
	student: one(students, {
		fields: [studentGrades.studentId],
		references: [students.studentId]
	}),
	section: one(sections, {
		fields: [studentGrades.sectionId],
		references: [sections.sectionId]
	}),
	term: one(terms, {
		fields: [studentGrades.termId],
		references: [terms.termId]
	}),
	course: one(courses, {
		fields: [studentGrades.courseId],
		references: [courses.courseId]
	}),
	customer: one(customers, {
		fields: [studentGrades.customerId],
		references: [customers.customerId]
	}),
}));

export const userSchoolMembershipsRelations = relations(userSchoolMemberships, ({one}) => ({
	user: one(users, {
		fields: [userSchoolMemberships.userId],
		references: [users.userId]
	}),
	school: one(schools, {
		fields: [userSchoolMemberships.schoolId],
		references: [schools.schoolId]
	}),
}));

export const schoolStudentLinkRelations = relations(schoolStudentLink, ({one}) => ({
	student: one(students, {
		fields: [schoolStudentLink.studentId],
		references: [students.studentId]
	}),
	school: one(schools, {
		fields: [schoolStudentLink.schoolId],
		references: [schools.schoolId]
	}),
}));