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
            'Transcript of the second meeting...',
            '- Reviewed transcript and grades; excellent in STEM.
- Taking AP Calculus next semester.
- Recommended enrolling in AP Computer Science A.
- Discussed music-related extracurriculars (orchestra, music club).
- Created a preliminary 2-year course plan for college applications.',
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
