-- ============================================================
-- 004_feedback.sql
-- Feature: Feedback Forms (owner: Vhutali)
-- Additive only: five NEW tables, touches nothing existing.
--
-- WHAT THIS IS:
--   A centre manager builds a feedback form. Learners fill it in.
--   A form targets ONE of three things, chosen by the manager:
--       'teacher' — the learner picks which of their teachers
--       'subject' — the learner picks which of their subjects
--       'centre'  — feedback about the centre itself (no picking)
--
-- ANONYMITY MODEL (important):
--   feedback_responses has NO learner_id. Answers cannot be traced
--   back to a learner by anyone, including the manager.
--   feedback_completions separately records THAT a learner finished
--   a form, with no link to WHAT they said. That prevents duplicate
--   submissions while preserving genuine anonymity.
-- ============================================================

-- ------------------------------------------------------------
-- feedback_forms
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_forms (
    form_id       integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    title         character varying NOT NULL,
    description   text,

    center_id     integer NOT NULL,
    created_by    integer NOT NULL,   -- users.user_id of the manager

    -- what this form collects feedback ABOUT
    target_type   character varying NOT NULL,   -- 'teacher' | 'subject' | 'centre'

    is_open       boolean NOT NULL DEFAULT true,

    created_at    timestamp with time zone NOT NULL DEFAULT now(),
    closes_at     timestamp with time zone,     -- optional deadline

    CONSTRAINT feedback_forms_pkey PRIMARY KEY (form_id),
    CONSTRAINT fk_form_center FOREIGN KEY (center_id)
        REFERENCES public.centers(center_id) ON DELETE CASCADE,
    CONSTRAINT fk_form_creator FOREIGN KEY (created_by)
        REFERENCES public.users(user_id),
    CONSTRAINT chk_form_target_type
        CHECK (target_type IN ('teacher', 'subject', 'centre'))
);

CREATE INDEX IF NOT EXISTS idx_forms_center ON public.feedback_forms (center_id);


-- ------------------------------------------------------------
-- feedback_questions
-- question_type decides which answer column is filled on the way back.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_questions (
    question_id    integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    form_id        integer NOT NULL,
    question_text  text NOT NULL,
    question_type  character varying NOT NULL,   -- 'rating' | 'text'
    display_order  integer NOT NULL DEFAULT 0,
    is_required    boolean NOT NULL DEFAULT true,

    CONSTRAINT feedback_questions_pkey PRIMARY KEY (question_id),
    CONSTRAINT fk_question_form FOREIGN KEY (form_id)
        REFERENCES public.feedback_forms(form_id) ON DELETE CASCADE,
    CONSTRAINT chk_question_type CHECK (question_type IN ('rating', 'text'))
);

CREATE INDEX IF NOT EXISTS idx_questions_form ON public.feedback_questions (form_id);


-- ------------------------------------------------------------
-- feedback_responses
-- One row per submitted form. DELIBERATELY has no learner_id.
--
-- Exactly ONE of the three about_* columns is set, matching the
-- form's target_type. Real foreign keys on each, so the database
-- guarantees the target actually exists.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_responses (
    response_id      integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    form_id          integer NOT NULL,

    about_teacher_id integer,   -- set when target_type = 'teacher'
    about_subject_id integer,   -- set when target_type = 'subject'
    about_center_id  integer,   -- set when target_type = 'centre'

    submitted_at     timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT feedback_responses_pkey PRIMARY KEY (response_id),
    CONSTRAINT fk_response_form FOREIGN KEY (form_id)
        REFERENCES public.feedback_forms(form_id) ON DELETE CASCADE,
    CONSTRAINT fk_response_teacher FOREIGN KEY (about_teacher_id)
        REFERENCES public.teachers(user_id),
    CONSTRAINT fk_response_subject FOREIGN KEY (about_subject_id)
        REFERENCES public.subjects(subject_id),
    CONSTRAINT fk_response_center FOREIGN KEY (about_center_id)
        REFERENCES public.centers(center_id),

    -- exactly one target must be set
    CONSTRAINT chk_one_target CHECK (
        (about_teacher_id IS NOT NULL)::int +
        (about_subject_id IS NOT NULL)::int +
        (about_center_id  IS NOT NULL)::int = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_responses_form    ON public.feedback_responses (form_id);
CREATE INDEX IF NOT EXISTS idx_responses_teacher ON public.feedback_responses (about_teacher_id);
CREATE INDEX IF NOT EXISTS idx_responses_subject ON public.feedback_responses (about_subject_id);


-- ------------------------------------------------------------
-- feedback_answers
-- A rating question fills rating_value; a text question fills text_value.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_answers (
    answer_id     integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    response_id   integer NOT NULL,
    question_id   integer NOT NULL,

    rating_value  smallint,   -- 1..5
    text_value    text,

    CONSTRAINT feedback_answers_pkey PRIMARY KEY (answer_id),
    CONSTRAINT fk_answer_response FOREIGN KEY (response_id)
        REFERENCES public.feedback_responses(response_id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id)
        REFERENCES public.feedback_questions(question_id) ON DELETE CASCADE,
    CONSTRAINT uq_answer_per_question UNIQUE (response_id, question_id),
    CONSTRAINT chk_rating_range
        CHECK (rating_value IS NULL OR rating_value BETWEEN 1 AND 5),
    -- exactly one answer type
    CONSTRAINT chk_one_answer_type CHECK (
        (rating_value IS NOT NULL AND text_value IS NULL) OR
        (rating_value IS NULL AND text_value IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_answers_response ON public.feedback_answers (response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.feedback_answers (question_id);


-- ------------------------------------------------------------
-- feedback_completions
-- Records THAT a learner completed a form, with NO link to WHAT
-- they said. This is what allows duplicate-prevention without
-- breaking anonymity.
--
-- A learner may submit once per target. So they can review Joseph
-- AND David on the same teacher form, but not Joseph twice.
-- target_key holds the id of whatever was reviewed (teacher/subject/
-- centre), so one unique index covers all three cases.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_completions (
    completion_id  integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    form_id        integer NOT NULL,
    learner_id     integer NOT NULL,
    target_key     integer NOT NULL,   -- teacher_id / subject_id / center_id

    completed_at   timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT feedback_completions_pkey PRIMARY KEY (completion_id),
    CONSTRAINT fk_completion_form FOREIGN KEY (form_id)
        REFERENCES public.feedback_forms(form_id) ON DELETE CASCADE,
    CONSTRAINT fk_completion_learner FOREIGN KEY (learner_id)
        REFERENCES public.learners(user_id) ON DELETE CASCADE,

    -- one submission per learner, per form, per target
    CONSTRAINT uq_completion UNIQUE (form_id, learner_id, target_key)
);

CREATE INDEX IF NOT EXISTS idx_completions_learner ON public.feedback_completions (learner_id);
