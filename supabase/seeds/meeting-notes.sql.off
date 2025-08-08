DO $$
DECLARE
    user_id_val uuid;
    student_id_val uuid;
BEGIN
    -- Get the user and student IDs
    SELECT user_id INTO user_id_val FROM users WHERE email = 'test@email.com' LIMIT 1;
    SELECT student_id INTO student_id_val FROM students WHERE email = 'emma.johnson@student.edu' LIMIT 1;

    -- Insert meeting notes only if both user and student IDs are found
    IF user_id_val IS NOT NULL AND student_id_val IS NOT NULL THEN
        -- Meeting 1: Getting to know you
        INSERT INTO meeting_notes (user_id, student_id, private, transcript, notes, summary, created_by, created_at, updated_at)
        VALUES (
            user_id_val,
            student_id_val,
            false,
            'Transcript of the first meeting...',
            '- Discussed interests, hobbies, and post-graduation plans.
- Strong interest in music (piano) and computer science.
- Enjoys current programming class.
- Next step: Explore aligning interests with college majors and careers.',
            'Initial getting-to-know-you meeting to discuss Emma''s interests in music and computer science.',
            'agent',
            '2024-09-15 10:00:00',
            '2024-09-15 10:00:00'
        );

        -- Meeting 2: Academic Planning
        INSERT INTO meeting_notes (user_id, student_id, private, transcript, notes, summary, created_by, created_at, updated_at)
        VALUES (
            user_id_val,
            student_id_val,
            false,
                        '
            # Counseling Session Transcript
    **Participants:**  
    - **John Taylor** (Counselor)  
    - **Emma Rodriguez** (Student)

---

**[00:00] John:**  
Good morning, Emma! Great to see you again. How have things been going?

**[00:04] Emma:**  
Hi Mr. Taylor! Things are good. I''ve been thinking a lot about college lately, and I wanted to talk through some ideas with you.

**[00:12] John:**  
Absolutely, I''m glad you came in. Last time we met, you were leaning toward something in STEM. Has that narrowed down at all?

**[00:19] Emma:**  
Yeah, I''m pretty set on computer science. I''ve been doing some online coding stuff and really enjoy it. I''m hoping to apply to Purdue for their CS program.

**[00:28] John:**  
Purdue—great choice. That''s a strong program and very competitive. Are you thinking about the West Lafayette campus?

**[00:34] Emma:**  
Yeah, that''s the one. I''ve done a virtual tour and joined a webinar they hosted for prospective CS students. I''m excited.

**[00:42] John:**  
That''s great initiative. So let''s work backward from that goal. Purdue CS will expect a strong background in math, programming, and problem-solving. Let''s talk course selection. You''re going into junior year, right?

**[00:54] Emma:**  
Yes, junior year this fall.

**[00:56] John:**  
Perfect. So, you''ll definitely want to take Pre-Calc or AP Calc if it fits in your schedule. Have you taken any programming classes here yet?

**[01:04] Emma:**  
I took Intro to Computer Science last year, which used Python. I think the next class is AP Computer Science Principles?

**[01:10] John:**  
Yep, that''s right. And after that, AP Computer Science A focuses on Java and object-oriented programming, which is closer to what you''ll see in college. I''d recommend taking both if you can fit them in.

**[01:21] Emma:**  
I think I can fit AP CSP this year and AP CSA senior year. Does that sound okay?

**[01:26] John:**  
That''s a solid plan. It''ll show rigor and give you exposure to key concepts. You should also prioritize science electives like Physics if you haven''t taken that yet—CS programs often like to see it.

**[01:36] Emma:**  
I haven''t taken Physics yet. I can add it for junior year.

**[01:39] John:**  
Good. How about extracurriculars? Purdue and other schools look for well-rounded students who engage outside the classroom—especially in STEM-related clubs.

**[01:47] Emma:**  
We have a Computer Science Club, right? I''ve never been to a meeting, but I''m interested.

**[01:51] John:**  
Yes, we do. They meet on Wednesdays after school in Room 208. They do coding challenges, hackathons, and sometimes work on projects together. It would look great on your application—and you might even find some scholarship opportunities through competitions.

**[02:06] Emma:**  
I''ll check it out once school starts. That sounds fun.

**[02:09] John:**  
Awesome. Also, keep building your resume—anything like Girls Who Code, summer programs, or independent projects you can show off in your application portfolio.

**[02:18] Emma:**  
I actually built a small budgeting app for my family. It''s pretty basic but it was fun to make.

**[02:24] John:**  
That''s *exactly* the kind of thing you should mention. Write about it in your personal statement if it meant something to you. Admissions teams love to see initiative and creativity.

**[02:33] Emma:**  
Okay, I''ll start writing stuff down so I don''t forget.

**[02:36] John:**  
Good idea. I''ll send you a college planning checklist and timeline. Let''s plan to meet again in a couple months to check on how the schedule is working and start planning your application strategy.

**[02:45] Emma:**  
Sounds good. Thanks so much for your help!

**[02:48] John:**  
You got it, Emma. Keep pushing yourself and enjoy the journey—you''re on the right track.
            ',
            '
- Emma met with John to discuss college planning.
- Emma stated she is "pretty set on computer science" and is "hoping to apply to Purdue for their CS program," specifically at the West Lafayette campus.
- They discussed course planning for junior and senior years:
  - John recommended taking Pre-Calc or AP Calc.
  - Emma said she has taken Intro to Computer Science using Python.
  - Emma plans to take AP Computer Science Principles in junior year and AP Computer Science A in senior year.
  - John recommended taking Physics; Emma confirmed she has not taken it and will add it for junior year.
- Emma asked about the Computer Science Club and said she is interested in joining.
  - John said the club meets on Wednesdays after school in Room 208 and includes coding challenges, hackathons, and group projects.
- Emma mentioned she built a small budgeting app for her family.
  - John suggested she include it in her personal statement.
- John said he will send her a college planning checklist and timeline.
- Emma agreed to meet again in a couple of months.
            ',
            'Reviewed Emma''s academics and planned future coursework to support her goals.',
            'agent',
            '2024-11-10 14:30:00',
            '2024-11-10 14:30:00'
        );

        -- Meeting 3: College List & Application Strategy
        INSERT INTO meeting_notes (user_id, student_id, private, transcript, notes, summary, created_by, created_at, updated_at)
        VALUES (
            user_id_val,
            student_id_val,
            false,
            'Transcript of the third meeting...',
            '- Built a preliminary list of colleges with strong CS and music programs.
- Categorized schools into "reach," "target," and "safety."
- Emma to research specific application requirements.
- Discussed application timelines (EA/ED vs. Regular).
- Emphasized starting the personal statement early.',
            'Developed a preliminary college list and discussed application strategy and timelines.',
            'agent',
            '2025-01-20 11:00:00',
            '2025-01-20 11:00:00'
        );

        -- Meeting 4: Personal Statement Brainstorming
        INSERT INTO meeting_notes (user_id, student_id, private, transcript, notes, summary, created_by, created_at, updated_at)
        VALUES (
            user_id_val,
            student_id_val,
            false,
            'Transcript of the fourth meeting...',
            '- Brainstormed personal statement topics.
- Focused on combining her interests in music and technology.
- Strong idea: an essay about coding an app for music composition.
- Emma to write a first draft for the next meeting.',
            'Brainstormed personal statement ideas connecting her passions for music and technology.',
            'agent',
            '2025-03-05 09:00:00',
            '2025-03-05 09:00:00'
        );
    END IF;
END $$;
