# Project Context for AI Assistants

## Product Overview
This is a SaaS product called EntryPoint. It is a tool initially aimed at high school counselors and school administrators, to help them improve student outcomes by saving time. EntryPoint removes administrative burden by making it easier to access key data and reports from their SIS (Student Information System) that will help them monitor student progress — grades, attendance, etc.

## Main Features
1. Dashboard — highlighting key indicators and insights from the reports
2. Reports — preconfigured reports, with sorting and filtering capability
3. Student profiles — provides information about each student, such as their contact information, attendance, and grades
4. Meeting notes — allows counselors to use AI to record/attach summarized notes to a student profile
5. Conversational AI Agent/Assistant — summarizes report data, provides quick access to relevant reports, generates queries/data visualizations on demand by leveraging its understanding of the database schema and generative UI capabilities

## Data and Integrations
The data used for the reports, student profile, and dashboard is sourced from a third party system (PowerSchool). After processing (out of scope of this application), it is stored in Supabase.

The important capability of the AI Assistant is that the user can conceivably ask any question about their students of the AI assistant, and it will attempt to use its understanding of the data available in Supabase to dynamically generate an appropriate query/report/data visualization component to serve the user what they need.

