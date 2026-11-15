--
-- Stripped-down PostgreSQL dump: PUBLIC SCHEMA ONLY
-- Safe for plain postgres Docker images (no Supabase roles/extensions/schemas required)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Types
--

CREATE TYPE public.assessment_question_type AS ENUM (
    'multiple_choice',
    'true_false',
    'short_answer',
    'essay'
);

CREATE TYPE public.assessment_status AS ENUM (
    'draft',
    'published',
    'closed'
);

CREATE TYPE public.assessment_type AS ENUM (
    'quiz',
    'exam',
    'assignment'
);

CREATE TYPE public.days AS ENUM (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday'
);

CREATE TYPE public.roles AS ENUM (
    'Admin',
    'Center Manager',
    'Teacher',
    'Learner'
);

CREATE TYPE public.submission_status AS ENUM (
    'not_submitted',
    'submitted',
    'graded'
);

CREATE TYPE public.target_type AS ENUM (
    'System',
    'Center',
    'Grade',
    'Class',
    'Subject',
    'CenterTeachers',
    'CenterLearners',
    'TeacherAssignment'
);

--
-- Tables
--

CREATE TABLE public.admin (
    user_id integer NOT NULL,
    admin_number character varying(11) NOT NULL
);

CREATE TABLE public.announcement (
    announcement_id integer NOT NULL,
    title character varying(100) NOT NULL,
    announcement_message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    sender_id integer
);

ALTER TABLE public.announcement ALTER COLUMN announcement_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.announcement_announcement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.announcementattachment (
    attachment_id integer NOT NULL,
    announcement_id integer NOT NULL,
    file_name character varying(250) NOT NULL,
    file_path character varying NOT NULL,
    file_type character varying NOT NULL,
    file_size bigint NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.announcementattachment ALTER COLUMN attachment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.announcementattachment_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.announcementrecipient (
    announcement_recipient_id integer NOT NULL,
    announcement_id integer NOT NULL,
    recipient_id integer NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone
);

ALTER TABLE public.announcementrecipient ALTER COLUMN announcement_recipient_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.announcementrecipient_announcement_recipient_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.announcementtarget (
    target_id integer NOT NULL,
    announcement_id integer NOT NULL,
    target_type public.target_type NOT NULL,
    target_value integer
);

ALTER TABLE public.announcementtarget ALTER COLUMN target_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.announcementtarget_target_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.assessment_answers (
    id integer NOT NULL,
    submission_id integer NOT NULL,
    question_id integer NOT NULL,
    answer_text text,
    selected_option_id integer,
    is_correct boolean,
    points_awarded numeric(8,2),
    feedback text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.assessment_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.assessment_answers_id_seq OWNED BY public.assessment_answers.id;

CREATE TABLE public.assessment_memoranda (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    teacher_id integer NOT NULL,
    content text NOT NULL,
    released_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.assessment_memoranda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.assessment_memoranda_id_seq OWNED BY public.assessment_memoranda.id;

CREATE TABLE public.assessment_question_options (
    id integer NOT NULL,
    question_id integer NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.assessment_question_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.assessment_question_options_id_seq OWNED BY public.assessment_question_options.id;

CREATE TABLE public.assessment_questions (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    question_text text NOT NULL,
    question_type public.assessment_question_type NOT NULL,
    points numeric(8,2) DEFAULT 1 NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.assessment_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.assessment_questions_id_seq OWNED BY public.assessment_questions.id;

CREATE TABLE public.assessment_submissions (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    student_id integer NOT NULL,
    status public.submission_status DEFAULT 'not_submitted'::public.submission_status NOT NULL,
    score numeric(8,2),
    attempts integer DEFAULT 1 NOT NULL,
    started_at timestamp without time zone,
    submitted_at timestamp without time zone,
    max_score numeric(8,2),
    graded_at timestamp without time zone,
    grader_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.assessment_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.assessment_submissions_id_seq OWNED BY public.assessment_submissions.id;

CREATE TABLE public.assessments (
    id integer NOT NULL,
    teacher_id integer NOT NULL,
    subject_id integer NOT NULL,
    class_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type public.assessment_type NOT NULL,
    status public.assessment_status DEFAULT 'draft'::public.assessment_status NOT NULL,
    time_limit_minutes integer,
    max_attempts integer DEFAULT 1 NOT NULL,
    shuffle_questions boolean DEFAULT false NOT NULL,
    available_from timestamp without time zone,
    available_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.assessments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.assessments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.attendance (
    attendance_id integer NOT NULL,
    assignment_id integer NOT NULL,
    timetable_id integer,
    attendance_code character varying NOT NULL,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT chk_attendance_status CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT chk_expiry_after_creation CHECK ((expires_at > created_at))
);

ALTER TABLE public.attendance ALTER COLUMN attendance_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attendance_attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.attendance_record (
    record_id integer NOT NULL,
    attendance_id integer NOT NULL,
    learner_id integer NOT NULL,
    status character varying DEFAULT 'present'::character varying NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_record_status CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'late'::character varying])::text[])))
);

ALTER TABLE public.attendance_record ALTER COLUMN record_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attendance_record_record_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.center_managers (
    user_id integer NOT NULL,
    manager_number character varying(10) NOT NULL,
    center_id integer NOT NULL
);

CREATE TABLE public.centers (
    center_id integer NOT NULL,
    center_name character varying(50) NOT NULL,
    center_address character varying(300) NOT NULL,
    center_capacity integer NOT NULL,
    center_province character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    reason_for_deactivation text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.centers ALTER COLUMN center_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.centers_center_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.classes (
    class_id integer NOT NULL,
    class_name character varying(50) NOT NULL,
    class_capacity integer,
    is_active boolean DEFAULT true,
    reason_for_deactivation text,
    center_id integer,
    number_of_learners integer NOT NULL
);

ALTER TABLE public.classes ALTER COLUMN class_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.classes_class_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.feedback_answers (
    answer_id integer NOT NULL,
    response_id integer NOT NULL,
    question_id integer NOT NULL,
    rating_value smallint,
    text_value text,
    CONSTRAINT chk_one_answer_type CHECK ((((rating_value IS NOT NULL) AND (text_value IS NULL)) OR ((rating_value IS NULL) AND (text_value IS NOT NULL)))),
    CONSTRAINT chk_rating_range CHECK (((rating_value IS NULL) OR ((rating_value >= 1) AND (rating_value <= 5))))
);

ALTER TABLE public.feedback_answers ALTER COLUMN answer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_answers_answer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.feedback_completions (
    completion_id integer NOT NULL,
    form_id integer NOT NULL,
    learner_id integer NOT NULL,
    target_key integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.feedback_completions ALTER COLUMN completion_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_completions_completion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.feedback_forms (
    form_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    center_id integer NOT NULL,
    created_by integer NOT NULL,
    target_type character varying NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    closes_at timestamp with time zone,
    CONSTRAINT chk_form_target_type CHECK (((target_type)::text = ANY ((ARRAY['teacher'::character varying, 'subject'::character varying, 'centre'::character varying])::text[])))
);

ALTER TABLE public.feedback_forms ALTER COLUMN form_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_forms_form_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.feedback_questions (
    question_id integer NOT NULL,
    form_id integer NOT NULL,
    question_text text NOT NULL,
    question_type character varying NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    CONSTRAINT chk_question_type CHECK (((question_type)::text = ANY ((ARRAY['rating'::character varying, 'text'::character varying])::text[])))
);

ALTER TABLE public.feedback_questions ALTER COLUMN question_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_questions_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.feedback_responses (
    response_id integer NOT NULL,
    form_id integer NOT NULL,
    about_teacher_id integer,
    about_subject_id integer,
    about_center_id integer,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_one_target CHECK ((((((about_teacher_id IS NOT NULL))::integer + ((about_subject_id IS NOT NULL))::integer) + ((about_center_id IS NOT NULL))::integer) = 1))
);

ALTER TABLE public.feedback_responses ALTER COLUMN response_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_responses_response_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.learner_enrollments (
    enrollment_id integer NOT NULL,
    learner_id integer NOT NULL,
    class_id integer NOT NULL,
    subject_id integer NOT NULL,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.learner_enrollments ALTER COLUMN enrollment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.learner_enrollments_enrollment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.learners (
    user_id integer NOT NULL,
    learner_number integer NOT NULL,
    center_id integer NOT NULL,
    class_id integer NOT NULL,
    grade integer NOT NULL,
    highschool character varying(50) NOT NULL,
    id_number character varying(20) DEFAULT NULL::character varying,
    contact_number character varying(20) DEFAULT NULL::character varying,
    gender character varying(20) DEFAULT NULL::character varying
);

CREATE TABLE public.learningmaterial (
    material_id integer NOT NULL,
    title character varying(200) NOT NULL,
    subject_id integer NOT NULL,
    grade integer NOT NULL,
    class_id integer NOT NULL,
    teacher_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_type character varying(100) NOT NULL,
    file_size bigint NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.learningmaterial_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.learningmaterial_material_id_seq OWNED BY public.learningmaterial.material_id;

CREATE TABLE public.lessonplanner (
    planner_id integer NOT NULL,
    teacher_id integer NOT NULL,
    subject_id integer NOT NULL,
    class_id integer NOT NULL,
    week integer NOT NULL,
    lesson_date date NOT NULL,
    planner_type character varying(20) NOT NULL,
    topic character varying(255),
    assessment_type character varying(100),
    weighting numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.lessonplanner_planner_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.lessonplanner_planner_id_seq OWNED BY public.lessonplanner.planner_id;

CREATE TABLE public.material_opens (
    open_id integer NOT NULL,
    learner_id integer NOT NULL,
    material_id integer NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.material_opens ALTER COLUMN open_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.material_opens_open_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.subjects (
    subject_id integer NOT NULL,
    subject_name character varying(50) NOT NULL,
    subject_code character varying(10) NOT NULL,
    grade integer NOT NULL
);

ALTER TABLE public.subjects ALTER COLUMN subject_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subjects_subject_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.teacher_assignments (
    assignment_id integer NOT NULL,
    teacher_id integer NOT NULL,
    subject_id integer NOT NULL,
    class_id integer NOT NULL,
    grade integer NOT NULL
);

ALTER TABLE public.teacher_assignments ALTER COLUMN assignment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.teacherassignments_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.teachers (
    user_id integer NOT NULL,
    teacher_number character varying(9) NOT NULL,
    center_id integer NOT NULL
);

CREATE TABLE public.timetables (
    timetable_id integer NOT NULL,
    assignment_id integer NOT NULL,
    timetable_day public.days NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL
);

ALTER TABLE public.timetables ALTER COLUMN timetable_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.timetables_timetable_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    user_role public.roles NOT NULL,
    center_id integer,
    is_profile_claimed boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    reason_for_deactivation text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Defaults for separately-sequenced columns
--

ALTER TABLE ONLY public.assessment_answers ALTER COLUMN id SET DEFAULT nextval('public.assessment_answers_id_seq'::regclass);
ALTER TABLE ONLY public.assessment_memoranda ALTER COLUMN id SET DEFAULT nextval('public.assessment_memoranda_id_seq'::regclass);
ALTER TABLE ONLY public.assessment_question_options ALTER COLUMN id SET DEFAULT nextval('public.assessment_question_options_id_seq'::regclass);
ALTER TABLE ONLY public.assessment_questions ALTER COLUMN id SET DEFAULT nextval('public.assessment_questions_id_seq'::regclass);
ALTER TABLE ONLY public.assessment_submissions ALTER COLUMN id SET DEFAULT nextval('public.assessment_submissions_id_seq'::regclass);
ALTER TABLE ONLY public.learningmaterial ALTER COLUMN material_id SET DEFAULT nextval('public.learningmaterial_material_id_seq'::regclass);
ALTER TABLE ONLY public.lessonplanner ALTER COLUMN planner_id SET DEFAULT nextval('public.lessonplanner_planner_id_seq'::regclass);

--
-- Data
--

COPY public.admin (user_id, admin_number) FROM stdin;
2	12345678901
\.

COPY public.announcement (announcement_id, title, announcement_message, created_at, expires_at, sender_id) FROM stdin;
60	CHECK 2	131244	2026-07-28 21:30:38.646337+00	2026-07-29 00:00:00+00	3
61	LEARNERS UPDATED	2134124	2026-07-28 21:31:42.521265+00	2026-07-29 00:00:00+00	3
62	TEACHERS-UPDATED	Q	2026-07-28 21:32:22.180672+00	2026-07-29 00:00:00+00	3
63	zlkjonb	aeck	2026-07-30 10:41:20.003591+00	2026-07-31 00:00:00+00	10
64	zlkjonb	aeck	2026-07-30 10:41:22.381883+00	2026-07-31 00:00:00+00	10
65	classes at 17 jan	classes will start on the date	2026-07-30 11:48:49.394979+00	2026-07-16 00:00:00+00	3
66	END OF TERM	`3224124	2026-08-10 09:44:42.907232+00	2026-08-12 00:00:00+00	10
68	Quiz will Be available on Friday at 15:30	The First quiz of the term will be available on the 28th This Friday, it will be on Acids and Bases, please do not leave immediately after class	2026-08-26 18:11:53.540566+00	2026-08-29 00:00:00+00	10
\.

COPY public.announcementattachment (attachment_id, announcement_id, file_name, file_path, file_type, file_size, uploaded_at) FROM stdin;
42	60	Question01 (2).pdf	Uploads/Announcements/be7223e7-09df-433e-a447-96da60986811.pdf	application/pdf	141128	2026-07-28 21:30:38.646337+00
43	61	ACSSE_CSC02B2_2023_Practical02.pdf	Uploads/Announcements/e5eaaa57-5d9c-4da4-9793-06f4f59dbf3d.pdf	application/pdf	657847	2026-07-28 21:31:42.521265+00
44	62	Question01 (2).pdf	Uploads/Announcements/f66b200a-e2ef-4180-91b8-75d7ffd6c0b4.pdf	application/pdf	141128	2026-07-28 21:32:22.180672+00
45	66	20260802_135024.jpg	Uploads/Announcements/86679e8e-92d9-4e1b-a128-f9261e27a2d1.jpg	image/jpeg	2240691	2026-08-10 09:44:42.907232+00
\.

COPY public.announcementrecipient (announcement_recipient_id, announcement_id, recipient_id, is_read, read_at) FROM stdin;
254	60	3	f	\N
255	60	4	f	\N
256	60	11	f	\N
257	60	10	f	\N
259	61	11	f	\N
262	62	4	f	\N
263	62	10	f	\N
264	63	11	f	\N
265	63	12	f	\N
266	63	14	f	\N
267	64	11	f	\N
268	64	12	f	\N
269	64	14	f	\N
270	65	3	f	\N
271	65	4	f	\N
272	65	11	f	\N
273	65	10	f	\N
274	65	13	f	\N
275	65	12	f	\N
276	65	14	f	\N
277	66	11	f	\N
278	66	12	f	\N
279	66	14	f	\N
283	68	11	f	\N
284	68	12	f	\N
285	68	14	f	\N
\.

COPY public.announcementtarget (target_id, announcement_id, target_type, target_value) FROM stdin;
76	60	Center	1
78	61	CenterLearners	1
80	62	CenterTeachers	1
81	63	TeacherAssignment	1
82	64	TeacherAssignment	1
83	65	Center	1
84	66	TeacherAssignment	1
86	68	TeacherAssignment	2
\.

COPY public.assessment_answers (id, submission_id, question_id, answer_text, selected_option_id, is_correct, points_awarded, feedback, created_at, updated_at) FROM stdin;
52	4	12	\N	16	f	0.00	\N	2026-08-11 14:12:19.979289	2026-08-11 14:22:55.145199
56	5	13	\N	17	t	5.00	\N	2026-08-13 10:53:46.65655	2026-08-13 10:53:55.555339
59	5	14	\N	22	f	0.00	\N	2026-08-13 10:53:53.581028	2026-08-13 10:53:55.555339
63	6	16	mhygyulhiojio;uoij	\N	\N	\N	\N	2026-08-14 21:02:17.627696	2026-08-14 21:02:20.348088
1	1	4	\N	6	f	0.00	answer is true	2026-07-30 04:47:07.441122	2026-07-30 06:09:38.981239
61	6	15	\N	24	f	0.00	\N	2026-08-14 21:02:12.496769	2026-08-14 21:02:35.507087
28	1	7	\N	10	t	1.00	good job	2026-07-30 04:47:38.567575	2026-07-30 06:10:16.000938
34	2	8	\N	11	t	1.00	\N	2026-07-30 09:20:06.342798	2026-07-30 09:20:08.165233
3	1	5	it is a flawed equation	\N	f	0.00	elaborate more nxt time	2026-07-30 04:47:18.614284	2026-07-30 11:59:32.981665
38	3	10	sipho mazibuko	\N	\N	\N	\N	2026-08-11 13:29:27.070548	2026-08-11 13:29:29.670022
36	3	9	\N	13	t	1.00	\N	2026-08-11 13:29:22.118105	2026-08-11 13:29:31.860494
\.

COPY public.assessment_memoranda (id, assessment_id, teacher_id, content, released_at, created_at, updated_at) FROM stdin;
1	2	10	question 1: true	2026-07-30 05:48:46.722049	2026-07-30 05:48:46.722049	2026-07-30 05:48:46.722049
\.

COPY public.assessment_question_options (id, question_id, option_text, is_correct, order_index, created_at, updated_at) FROM stdin;
1	2	True	f	1	2026-07-29 19:38:07.646915	2026-07-29 19:38:07.646915
2	2	False	t	2	2026-07-29 19:38:07.646915	2026-07-29 19:38:07.646915
5	4	True	t	1	2026-07-29 19:43:15.535426	2026-07-29 19:43:15.535426
6	4	False	f	2	2026-07-29 19:43:15.535426	2026-07-29 19:43:15.535426
9	7	3	f	1	2026-07-29 20:00:24.013036	2026-07-29 20:00:24.013036
10	7	2	t	2	2026-07-29 20:00:24.013036	2026-07-29 20:00:24.013036
11	8	True	t	1	2026-07-30 06:50:43.237349	2026-07-30 06:50:43.237349
12	8	False	f	2	2026-07-30 06:50:43.237349	2026-07-30 06:50:43.237349
13	9	yes	t	1	2026-07-30 11:55:33.718525	2026-07-30 11:55:33.718525
14	9	false answer	f	2	2026-07-30 11:55:33.718525	2026-07-30 11:55:33.718525
15	12	yes	t	1	2026-08-11 14:06:11.129272	2026-08-11 14:06:11.129272
16	12	no	f	2	2026-08-11 14:06:11.129272	2026-08-11 14:06:11.129272
17	13	Blue	t	1	2026-08-13 10:47:09.032665	2026-08-13 10:47:09.032665
18	13	Pink	f	2	2026-08-13 10:47:09.032665	2026-08-13 10:47:09.032665
19	13	Red	f	3	2026-08-13 10:47:09.032665	2026-08-13 10:47:09.032665
20	13	Black	f	4	2026-08-13 10:47:09.032665	2026-08-13 10:47:09.032665
21	14	True	t	1	2026-08-13 10:47:48.360332	2026-08-13 10:47:48.360332
22	14	False	f	2	2026-08-13 10:47:48.360332	2026-08-13 10:47:48.360332
23	15	Yes	t	1	2026-08-14 20:59:16.33337	2026-08-14 20:59:16.33337
24	15	No	f	2	2026-08-14 20:59:16.33337	2026-08-14 20:59:16.33337
\.

COPY public.assessment_questions (id, assessment_id, question_text, question_type, points, order_index, created_at, updated_at) FROM stdin;
1	1	what is 1 plus 11	short_answer	2.00	1	2026-07-29 19:37:45.150591	2026-07-29 19:37:45.150591
2	1	is 1 plus 1 2?	true_false	1.00	2	2026-07-29 19:38:07.646915	2026-07-29 19:38:07.646915
4	2	1 plus 1 is 2	true_false	2.00	1	2026-07-29 19:43:15.535426	2026-07-29 19:43:15.535426
5	2	what is your opinion on 1 plus 1?	short_answer	2.00	2	2026-07-29 19:59:14.169989	2026-07-29 19:59:14.169989
7	2	what is 1 plus 1	multiple_choice	1.00	3	2026-07-29 20:00:24.013036	2026-07-29 20:00:24.013036
8	4	23213	true_false	1.00	1	2026-07-30 06:50:43.237349	2026-07-30 06:50:43.237349
9	7	id you run	multiple_choice	1.00	1	2026-07-30 11:55:33.718525	2026-07-30 11:55:33.718525
10	7	what is your name	short_answer	1.00	2	2026-07-30 11:56:06.662513	2026-07-30 11:56:06.662513
12	8	is the ui styled	multiple_choice	1.00	1	2026-08-11 14:06:11.129272	2026-08-11 14:06:11.129272
13	10	what color is the sky	multiple_choice	5.00	1	2026-08-13 10:47:09.032665	2026-08-13 10:47:09.032665
14	10	The earth is flat	true_false	5.00	2	2026-08-13 10:47:48.360332	2026-08-13 10:47:48.360332
15	11	Is the sky blue?	multiple_choice	1.00	1	2026-08-14 20:59:16.33337	2026-08-14 20:59:16.33337
16	11	vdghcvhjsb	short_answer	1.00	2	2026-08-14 21:00:07.036143	2026-08-14 21:00:07.036143
\.

COPY public.assessment_submissions (id, assessment_id, student_id, status, score, attempts, started_at, submitted_at, max_score, graded_at, grader_id, created_at, updated_at) FROM stdin;
2	4	11	graded	1.00	1	2026-07-30 06:52:02.087703	2026-07-30 09:20:08.165233	1.00	2026-07-30 09:20:08.165233	\N	2026-07-30 06:52:02.087703	2026-07-30 09:20:08.165233
1	2	11	graded	1.00	1	2026-07-30 04:47:01.706368	2026-07-30 04:50:24.815557	5.00	2026-07-30 11:59:43.588084	10	2026-07-30 04:47:01.706368	2026-07-30 11:59:43.588084
3	7	11	submitted	\N	1	2026-08-11 13:29:16.450906	2026-08-11 13:29:31.860494	2.00	\N	\N	2026-08-11 13:29:16.450906	2026-08-11 13:29:31.860494
4	8	11	graded	0.00	1	2026-08-11 14:10:11.147529	2026-08-11 14:22:55.145199	1.00	2026-08-11 14:22:55.145199	\N	2026-08-11 14:10:11.147529	2026-08-11 14:22:55.145199
5	10	11	graded	5.00	1	2026-08-13 10:53:40.752176	2026-08-13 10:53:55.555339	10.00	2026-08-13 10:53:55.555339	\N	2026-08-13 10:53:40.752176	2026-08-13 10:53:55.555339
6	11	11	submitted	\N	1	2026-08-14 21:02:06.293871	2026-08-14 21:02:35.507087	2.00	\N	\N	2026-08-14 21:02:06.293871	2026-08-14 21:02:35.507087
\.

COPY public.assessments (id, teacher_id, subject_id, class_id, title, description, type, status, time_limit_minutes, max_attempts, shuffle_questions, available_from, available_until, created_at, updated_at) FROM stdin;
1	10	5	4	Untitled assessment		quiz	draft	\N	1	f	\N	\N	2026-07-29 19:31:06.067878	2026-07-29 19:31:06.067878
2	10	5	4	Quiz 1	First Maths Quiz	quiz	published	2	1	t	\N	\N	2026-07-29 19:41:29.088972	2026-07-29 20:11:33.129895
3	10	5	4	Untitled assessment		quiz	draft	\N	1	f	\N	\N	2026-07-30 04:38:46.259952	2026-07-30 04:38:46.259952
4	10	2	4	Untitled assessment		quiz	published	\N	1	f	\N	\N	2026-07-30 06:14:41.887124	2026-07-30 06:50:56.146957
5	10	5	4	Untitled assessment		quiz	draft	\N	1	f	\N	\N	2026-07-30 07:22:48.923384	2026-07-30 07:22:48.923384
6	10	5	4	Untitled assessment		quiz	draft	\N	1	f	\N	\N	2026-07-30 10:57:51.073337	2026-07-30 10:57:51.073337
7	10	5	4	run	run desc 	quiz	published	15	2	t	\N	\N	2026-07-30 11:53:42.290639	2026-07-30 11:56:13.331508
8	10	5	4	Styled Assessment	Adjusting the styling of the Quiz Builder	quiz	published	30	1	t	\N	\N	2026-08-10 19:27:53.375696	2026-08-11 14:09:21.066203
9	10	2	4	Untitled assessment		quiz	draft	\N	1	f	\N	\N	2026-08-11 14:46:43.005858	2026-08-11 14:46:43.005858
10	10	5	4	meeting 3	testing if the feature works	quiz	published	1	1	t	\N	\N	2026-08-13 10:43:56.136873	2026-08-13 10:53:14.304486
11	10	5	4	Koketso	Testing	quiz	published	1	1	f	\N	\N	2026-08-14 20:54:41.317093	2026-08-14 21:00:14.79511
\.

COPY public.attendance (attendance_id, assignment_id, timetable_id, attendance_code, status, created_at, expires_at) FROM stdin;
1	1	\N	2P5TYC	open	2026-07-09 18:59:57.074154+00	2026-07-09 19:09:57.074154+00
2	1	\N	A35XY7	open	2026-07-09 19:28:27.008127+00	2026-07-09 19:38:27.008127+00
3	2	\N	ENS3MH	open	2026-07-09 19:31:25.735078+00	2026-07-09 19:41:25.735078+00
4	1	\N	KQWXUD	open	2026-07-09 19:31:32.545524+00	2026-07-09 19:41:32.545524+00
5	1	\N	BVUJDF	open	2026-07-09 19:32:24.32704+00	2026-07-09 19:42:24.32704+00
6	1	\N	G2FB9T	open	2026-07-12 19:03:43.276934+00	2026-07-12 19:13:43.276934+00
7	2	\N	XQVCEE	open	2026-07-12 19:21:19.350128+00	2026-07-12 19:31:19.350128+00
8	1	\N	SCTFGE	open	2026-07-12 20:10:15.521736+00	2026-07-12 20:20:15.521736+00
9	1	\N	XYQFFW	open	2026-07-16 11:38:59.2331+00	2026-07-16 11:48:59.2331+00
10	1	\N	4E63WG	open	2026-07-21 21:28:37.074407+00	2026-07-21 21:38:37.074407+00
11	2	\N	UXNK23	open	2026-07-21 21:42:57.973538+00	2026-07-21 21:52:57.973538+00
12	2	\N	7CFBPJ	open	2026-07-22 14:30:31.222321+00	2026-07-22 14:40:31.222321+00
13	2	\N	U9F3SG	open	2026-07-22 23:43:00.954116+00	2026-07-22 23:53:00.954116+00
14	1	\N	E62P5J	open	2026-07-23 00:10:44.882296+00	2026-07-23 00:20:44.882296+00
15	1	\N	FDCQNQ	open	2026-07-23 10:32:08.612086+00	2026-07-23 10:42:08.612086+00
16	1	\N	NJT2KX	open	2026-07-28 19:47:58.569669+00	2026-07-28 19:57:58.569669+00
17	1	\N	P95XT9	open	2026-07-28 20:04:35.765778+00	2026-07-28 20:14:35.765778+00
18	1	\N	YDNNQJ	open	2026-07-29 16:13:28.188357+00	2026-07-29 16:23:28.188357+00
19	1	\N	TPQ25S	open	2026-07-30 07:46:19.109424+00	2026-07-30 07:56:19.109424+00
20	1	\N	VCJAMR	open	2026-07-30 10:53:42.683968+00	2026-07-30 11:03:42.683968+00
21	1	\N	Q4A3AM	open	2026-07-30 11:52:05.739767+00	2026-07-30 12:02:05.739767+00
22	2	\N	HGBYSC	open	2026-08-09 17:49:16.878841+00	2026-08-09 17:59:16.878841+00
23	1	\N	WJSVFZ	open	2026-08-14 21:08:03.893093+00	2026-08-14 21:18:03.893093+00
24	1	\N	MNJ2G7	open	2026-08-24 09:32:13.724894+00	2026-08-24 09:42:13.724894+00
25	2	\N	CSYT3K	open	2026-08-24 09:50:33.619293+00	2026-08-24 10:00:33.619293+00
\.

COPY public.attendance_record (record_id, attendance_id, learner_id, status, submitted_at) FROM stdin;
1	6	11	present	2026-07-12 19:09:17.570695+00
3	7	11	present	2026-07-12 19:24:02.938127+00
5	8	11	present	2026-07-12 20:10:47.423177+00
6	9	11	present	2026-07-16 11:41:13.798267+00
9	10	11	present	2026-07-21 21:36:07.412437+00
10	11	11	present	2026-07-21 21:43:18.214346+00
11	12	11	present	2026-07-22 14:33:02.333497+00
12	13	11	present	2026-07-22 23:43:58.7757+00
13	14	11	present	2026-07-23 00:10:57.720508+00
14	15	11	present	2026-07-23 10:32:56.892546+00
15	17	11	present	2026-07-28 20:04:44.785866+00
16	19	11	present	2026-07-30 07:47:16.978404+00
17	21	11	present	2026-07-30 11:52:44.197465+00
18	25	11	present	2026-08-24 09:50:50.579464+00
\.

COPY public.center_managers (user_id, manager_number, center_id) FROM stdin;
3	2694275586	1
\.

COPY public.centers (center_id, center_name, center_address, center_capacity, center_province, is_active, reason_for_deactivation, created_at) FROM stdin;
3	Center C	13 Badplass	40	Mpumalanga	t	\N	2026-06-29 13:14:00.685388+00
2	Soweto	15 Edenvale	100	Gauteng	t	\N	2026-06-29 13:13:18.460312+00
1	Lejwalaputswa	44 Brixton	60	Gauteng	t	\N	2026-06-23 22:00:46.198161+00
\.

COPY public.classes (class_id, class_name, class_capacity, is_active, reason_for_deactivation, center_id, number_of_learners) FROM stdin;
1	class 10A	10	t	\N	1	0
2	class 10B	10	t	\N	1	0
3	class 11A	10	t	\N	1	0
4	class 11B	10	t	\N	1	0
5	class 12A	10	t	\N	1	0
6	class 12B	10	t	\N	1	0
\.

COPY public.feedback_answers (answer_id, response_id, question_id, rating_value, text_value) FROM stdin;
1	1	1	4	\N
2	1	2	5	\N
3	1	3	\N	Could go a bit slower when introducing new topics.
4	2	4	4	\N
5	2	5	\N	good
6	3	4	5	\N
7	3	5	\N	great
8	4	6	5	\N
9	4	7	\N	because
10	4	8	4	\N
11	4	9	5	\N
12	5	10	4	\N
13	6	11	3	\N
14	7	13	4	\N
15	8	12	4	\N
16	8	13	5	\N
17	9	10	4	\N
\.

COPY public.feedback_completions (completion_id, form_id, learner_id, target_key, completed_at) FROM stdin;
1	1	11	10	2026-07-19 23:50:20.009172+00
2	2	11	5	2026-07-20 00:27:33.077955+00
3	2	11	2	2026-07-20 00:27:47.795243+00
4	3	11	1	2026-07-21 21:50:50.534451+00
5	4	11	10	2026-07-23 10:34:42.367987+00
6	5	11	1	2026-07-28 20:06:31.216172+00
7	6	11	10	2026-07-28 20:13:31.713516+00
8	6	11	13	2026-07-30 10:58:23.366585+00
9	4	11	13	2026-07-30 11:31:32.545786+00
\.

COPY public.feedback_forms (form_id, title, description, center_id, created_by, target_type, is_open, created_at, closes_at) FROM stdin;
1	Term 2 Teacher Feedback	Tell us how your teachers are doing. Your answers are anonymous.	1	2	teacher	t	2026-07-14 21:04:40.707067+00	\N
2	Subject Feedback	\N	1	3	subject	t	2026-07-20 00:22:41.480199+00	\N
3	Centre Feedback	\N	1	3	centre	t	2026-07-21 21:50:23.686858+00	\N
4	form	\N	1	3	teacher	t	2026-07-23 10:34:13.408014+00	\N
5	Testing Feedback	\N	1	3	centre	t	2026-07-28 20:06:04.597137+00	\N
6	testing feedback2	\N	1	3	teacher	t	2026-07-28 20:13:02.084293+00	\N
\.

COPY public.feedback_questions (question_id, form_id, question_text, question_type, display_order, is_required) FROM stdin;
1	1	How clearly does this teacher explain new concepts?	rating	0	t
2	1	How approachable is this teacher when you need help?	rating	1	t
3	1	What is one thing this teacher could do better?	text	2	f
4	2	rate the subject	rating	0	t
5	2	why?	text	1	t
6	3	rating	rating	0	t
7	3	why	text	1	t
8	3	really?	rating	2	t
9	3	are you sure?	rating	3	t
10	4	yes?	rating	0	t
11	5	o youo like it here	rating	0	t
12	6	optional	rating	0	f
13	6	important	rating	1	t
\.

COPY public.feedback_responses (response_id, form_id, about_teacher_id, about_subject_id, about_center_id, submitted_at) FROM stdin;
1	1	10	\N	\N	2026-07-19 23:50:20.009172+00
2	2	\N	5	\N	2026-07-20 00:27:33.077955+00
3	2	\N	2	\N	2026-07-20 00:27:47.795243+00
4	3	\N	\N	1	2026-07-21 21:50:50.534451+00
5	4	10	\N	\N	2026-07-23 10:34:42.367987+00
6	5	\N	\N	1	2026-07-28 20:06:31.216172+00
7	6	10	\N	\N	2026-07-28 20:13:31.713516+00
8	6	13	\N	\N	2026-07-30 10:58:23.366585+00
9	4	13	\N	\N	2026-07-30 11:31:32.545786+00
\.

COPY public.learner_enrollments (enrollment_id, learner_id, class_id, subject_id, enrolled_at) FROM stdin;
3	11	4	5	2026-07-12 18:57:55.334367
4	11	4	2	2026-07-12 18:57:55.334367
5	12	4	5	2026-07-30 06:24:57.635845
6	12	4	2	2026-07-30 06:24:57.832604
7	14	4	5	2026-07-30 06:41:48.175846
8	14	4	2	2026-07-30 06:41:48.39989
\.

COPY public.learners (user_id, learner_number, center_id, class_id, grade, highschool, id_number, contact_number, gender) FROM stdin;
11	35032555	1	4	11	Pretoria Highschool	\N	\N	\N
12	52118526	1	5	11	saint Johns High	\N	\N	\N
14	61799058	1	4	11	saint Johns High	\N	\N	\N
\.

COPY public.learningmaterial (material_id, title, subject_id, grade, class_id, teacher_id, file_name, file_path, file_type, file_size, uploaded_at) FROM stdin;
9	Trigonometry part 2	5	11	4	10	ACCSE_CSC2B10-Chapter_1_1.pdf	Uploads/LearningMaterials/cae9cd85-2493-42da-8774-36d80e3b99a9.pdf	application/pdf	1879810	2026-07-25 09:24:16.765724
13	Acids and Bases	2	11	4	10	Question01 (3).pdf	Uploads/LearningMaterials/c7099074-a549-4ec1-8892-a4ed3bd19383.pdf	application/pdf	141128	2026-08-26 17:26:11.6398
14	Trigonometry Part 1	5	11	4	10	Practical 00.pdf	Uploads/LearningMaterials/739b207d-cc7b-4a02-bc0d-66691becbd94.pdf	application/pdf	855931	2026-08-26 18:08:28.094084
15	Projectiles in 2 Dimensions - Revised	2	11	4	10	Question01 (2).pdf	Uploads/LearningMaterials/5185c4c4-4710-40eb-99e5-2ebfe1db131b.pdf	application/pdf	141128	2026-08-26 18:09:31.194914
\.

COPY public.lessonplanner (planner_id, teacher_id, subject_id, class_id, week, lesson_date, planner_type, topic, assessment_type, weighting, created_at) FROM stdin;
1	10	5	4	1	2026-08-15	lesson	Introduction to Algebra	\N	\N	2026-08-11 16:53:36.136886
2	10	2	4	2	2026-08-16	lesson	Acid and base	\N	\N	2026-08-11 17:10:35.733861
\.

COPY public.material_opens (open_id, learner_id, material_id, opened_at) FROM stdin;
6	11	9	2026-08-10 12:12:49.970913+00
41	11	14	2026-08-26 18:12:41.974416+00
\.

COPY public.subjects (subject_id, subject_name, subject_code, grade) FROM stdin;
1	Physical Science	PHY 10	10
2	Physical Science	PHY 11	11
3	Physical Science	PHY 12	12
4	Mathematics	MATH 10	10
5	Mathematics	MATH 11	11
6	Mathematics	MATH 12	12
\.

COPY public.teacher_assignments (assignment_id, teacher_id, subject_id, class_id, grade) FROM stdin;
1	10	5	4	11
2	10	2	4	11
3	13	5	4	11
4	13	2	4	11
\.

COPY public.teachers (user_id, teacher_number, center_id) FROM stdin;
4	603262135	1
10	658714018	1
13	171904847	1
\.

COPY public.timetables (timetable_id, assignment_id, timetable_day, start_time, end_time) FROM stdin;
2	1	wednesday	08:00:00	09:00:00
3	2	tuesday	11:30:00	12:30:00
4	2	thursday	11:30:00	12:30:00
5	1	monday	09:00:00	10:00:00
\.

COPY public.users (user_id, first_name, last_name, email, password_hash, user_role, center_id, is_profile_claimed, is_active, reason_for_deactivation, created_at) FROM stdin;
2	William	Brown	admin@gmail.com	$2b$10$3H0QHKA1c0lrstVQGvxk4eJrF1r3pAr1JToZ.OqkGPEUKXQJDkbQa	Admin	1	t	t	\N	2026-06-27 09:49:43.305498+00
3	John	Doe	223185575@student.uj.ac.za	$2b$10$56clm1UgY7/vbKDCIxV1y.wkp86yPIVahkM1ENbq7rcytfwUyKIKC	Center Manager	1	t	t	\N	2026-06-28 16:18:05.597471+00
4	Mary	Jane	mihlayokuphela3@gmail.com	$2b$10$IYrcdQXA5jTbnWOE/WhN/e2zEJGyctjvLETZtD/8CUHxNUVNZtcQW	Teacher	1	t	t	\N	2026-06-28 16:51:39.550517+00
11	Sipho	Mazibuko	mihlayokuphela@gmail.com	$2b$10$M2fO4vdCuGK3nwCU.vKVtuc0TssVHWWKPHnX3Z7zdglCi7IrZOi2y	Learner	1	t	t	graduated	2026-06-29 21:19:45.422399+00
10	Joseph	Nkuna	katlegomaseko485@gmail.com	$2b$10$.gsVP204U3afpashXZgtG.0FIvoGeWMJsSQCOejTxhsMN8Y30lanS	Teacher	1	t	t	\N	2026-06-29 21:13:08.246611+00
13	\N	\N	ankel@gmail.com	$2b$10$razrsLRDMfl/R/qgBPIr7Onsrr8x5MH3rgEOPu5y6uxHK3o/dmDZm	Teacher	1	f	t	\N	2026-07-30 06:38:32.786974+00
14	Emily	Brown	ankelskitchen@gmail.com	$2b$10$cCaz4sJFkZsftODVUaRKjewlcPWP5AAC99YcTCE5wu7DR1ValFpwK	Learner	1	t	t	\N	2026-07-30 06:41:47.17029+00
12	Larry	Jones	email@something	$2b$10$RA6KUac/4Elu5Z/2zMUnJeNSLVxNsgmtedWapZABeQKuEA.qvdCdS	Learner	1	t	f	\N	2026-07-30 06:24:56.623701+00
\.

--
-- Sequence values
--

SELECT pg_catalog.setval('public.announcement_announcement_id_seq', 68, true);
SELECT pg_catalog.setval('public.announcementattachment_attachment_id_seq', 46, true);
SELECT pg_catalog.setval('public.announcementrecipient_announcement_recipient_id_seq', 285, true);
SELECT pg_catalog.setval('public.announcementtarget_target_id_seq', 86, true);
SELECT pg_catalog.setval('public.assessment_answers_id_seq', 80, true);
SELECT pg_catalog.setval('public.assessment_memoranda_id_seq', 1, true);
SELECT pg_catalog.setval('public.assessment_question_options_id_seq', 24, true);
SELECT pg_catalog.setval('public.assessment_questions_id_seq', 16, true);
SELECT pg_catalog.setval('public.assessment_submissions_id_seq', 6, true);
SELECT pg_catalog.setval('public.assessments_id_seq', 11, true);
SELECT pg_catalog.setval('public.attendance_attendance_id_seq', 25, true);
SELECT pg_catalog.setval('public.attendance_record_record_id_seq', 18, true);
SELECT pg_catalog.setval('public.centers_center_id_seq', 3, true);
SELECT pg_catalog.setval('public.classes_class_id_seq', 6, true);
SELECT pg_catalog.setval('public.feedback_answers_answer_id_seq', 17, true);
SELECT pg_catalog.setval('public.feedback_completions_completion_id_seq', 9, true);
SELECT pg_catalog.setval('public.feedback_forms_form_id_seq', 6, true);
SELECT pg_catalog.setval('public.feedback_questions_question_id_seq', 13, true);
SELECT pg_catalog.setval('public.feedback_responses_response_id_seq', 9, true);
SELECT pg_catalog.setval('public.learner_enrollments_enrollment_id_seq', 8, true);
SELECT pg_catalog.setval('public.learningmaterial_material_id_seq', 15, true);
SELECT pg_catalog.setval('public.lessonplanner_planner_id_seq', 3, true);
SELECT pg_catalog.setval('public.material_opens_open_id_seq', 41, true);
SELECT pg_catalog.setval('public.subjects_subject_id_seq', 6, true);
SELECT pg_catalog.setval('public.teacherassignments_assignment_id_seq', 4, true);
SELECT pg_catalog.setval('public.timetables_timetable_id_seq', 5, true);
SELECT pg_catalog.setval('public.users_user_id_seq', 14, true);

--
-- Primary keys
--

ALTER TABLE ONLY public.admin ADD CONSTRAINT admin_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.announcement ADD CONSTRAINT announcement_pkey PRIMARY KEY (announcement_id);
ALTER TABLE ONLY public.announcementattachment ADD CONSTRAINT announcementattachment_pkey PRIMARY KEY (attachment_id);
ALTER TABLE ONLY public.announcementrecipient ADD CONSTRAINT announcementrecipient_pkey PRIMARY KEY (announcement_recipient_id);
ALTER TABLE ONLY public.announcementtarget ADD CONSTRAINT announcementtarget_pkey PRIMARY KEY (target_id);
ALTER TABLE ONLY public.assessment_answers ADD CONSTRAINT assessment_answers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assessment_answers ADD CONSTRAINT assessment_answers_submission_id_question_id_key UNIQUE (submission_id, question_id);
ALTER TABLE ONLY public.assessment_memoranda ADD CONSTRAINT assessment_memoranda_assessment_id_key UNIQUE (assessment_id);
ALTER TABLE ONLY public.assessment_memoranda ADD CONSTRAINT assessment_memoranda_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assessment_question_options ADD CONSTRAINT assessment_question_options_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assessment_questions ADD CONSTRAINT assessment_questions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assessment_submissions ADD CONSTRAINT assessment_submissions_assessment_id_student_id_attempts_key UNIQUE (assessment_id, student_id, attempts);
ALTER TABLE ONLY public.assessment_submissions ADD CONSTRAINT assessment_submissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assessments ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id);
ALTER TABLE ONLY public.attendance_record ADD CONSTRAINT attendance_record_pkey PRIMARY KEY (record_id);
ALTER TABLE ONLY public.center_managers ADD CONSTRAINT center_managers_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.centers ADD CONSTRAINT centers_pkey PRIMARY KEY (center_id);
ALTER TABLE ONLY public.classes ADD CONSTRAINT classes_pkey PRIMARY KEY (class_id);
ALTER TABLE ONLY public.feedback_answers ADD CONSTRAINT feedback_answers_pkey PRIMARY KEY (answer_id);
ALTER TABLE ONLY public.feedback_completions ADD CONSTRAINT feedback_completions_pkey PRIMARY KEY (completion_id);
ALTER TABLE ONLY public.feedback_forms ADD CONSTRAINT feedback_forms_pkey PRIMARY KEY (form_id);
ALTER TABLE ONLY public.feedback_questions ADD CONSTRAINT feedback_questions_pkey PRIMARY KEY (question_id);
ALTER TABLE ONLY public.feedback_responses ADD CONSTRAINT feedback_responses_pkey PRIMARY KEY (response_id);
ALTER TABLE ONLY public.learner_enrollments ADD CONSTRAINT learner_enrollments_pkey PRIMARY KEY (enrollment_id);
ALTER TABLE ONLY public.learners ADD CONSTRAINT learners_learner_number_key UNIQUE (learner_number);
ALTER TABLE ONLY public.learners ADD CONSTRAINT learners_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.learningmaterial ADD CONSTRAINT learningmaterial_pkey PRIMARY KEY (material_id);
ALTER TABLE ONLY public.lessonplanner ADD CONSTRAINT lessonplanner_class_id_lesson_date_key UNIQUE (class_id, lesson_date);
ALTER TABLE ONLY public.lessonplanner ADD CONSTRAINT lessonplanner_pkey PRIMARY KEY (planner_id);
ALTER TABLE ONLY public.material_opens ADD CONSTRAINT material_opens_pkey PRIMARY KEY (open_id);
ALTER TABLE ONLY public.subjects ADD CONSTRAINT subjects_pkey PRIMARY KEY (subject_id);
ALTER TABLE ONLY public.teacher_assignments ADD CONSTRAINT teacherassignments_pkey PRIMARY KEY (assignment_id);
ALTER TABLE ONLY public.teachers ADD CONSTRAINT teachers_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.timetables ADD CONSTRAINT timetables_pkey PRIMARY KEY (timetable_id);
ALTER TABLE ONLY public.teacher_assignments ADD CONSTRAINT unique_assignment UNIQUE (teacher_id, subject_id, class_id);
ALTER TABLE ONLY public.classes ADD CONSTRAINT unique_center_class_name UNIQUE (center_id, class_name);
ALTER TABLE ONLY public.centers ADD CONSTRAINT unique_center_per_province UNIQUE (center_name, center_province);
ALTER TABLE ONLY public.learner_enrollments ADD CONSTRAINT unique_learner_class_subject UNIQUE (learner_id, class_id, subject_id);
ALTER TABLE ONLY public.feedback_answers ADD CONSTRAINT uq_answer_per_question UNIQUE (response_id, question_id);
ALTER TABLE ONLY public.feedback_completions ADD CONSTRAINT uq_completion UNIQUE (form_id, learner_id, target_key);
ALTER TABLE ONLY public.material_opens ADD CONSTRAINT uq_material_open_learner_material UNIQUE (learner_id, material_id);
ALTER TABLE ONLY public.attendance_record ADD CONSTRAINT uq_record_per_session UNIQUE (attendance_id, learner_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);

--
-- Indexes
--

CREATE INDEX idx_answers_question ON public.feedback_answers USING btree (question_id);
CREATE INDEX idx_answers_response ON public.feedback_answers USING btree (response_id);
CREATE INDEX idx_assessment_answers_submission ON public.assessment_answers USING btree (submission_id);
CREATE INDEX idx_assessment_memoranda_assessment ON public.assessment_memoranda USING btree (assessment_id);
CREATE INDEX idx_assessment_question_options_question ON public.assessment_question_options USING btree (question_id);
CREATE INDEX idx_assessment_questions_assessment ON public.assessment_questions USING btree (assessment_id);
CREATE INDEX idx_assessment_submissions_assessment ON public.assessment_submissions USING btree (assessment_id);
CREATE INDEX idx_assessment_submissions_student ON public.assessment_submissions USING btree (student_id);
CREATE INDEX idx_assessments_class ON public.assessments USING btree (class_id);
CREATE INDEX idx_assessments_subject ON public.assessments USING btree (subject_id);
CREATE INDEX idx_assessments_teacher ON public.assessments USING btree (teacher_id);
CREATE INDEX idx_attendance_assignment ON public.attendance USING btree (assignment_id);
CREATE INDEX idx_completions_learner ON public.feedback_completions USING btree (learner_id);
CREATE INDEX idx_forms_center ON public.feedback_forms USING btree (center_id);
CREATE UNIQUE INDEX idx_learners_id_number ON public.learners USING btree (id_number) WHERE (id_number IS NOT NULL);
CREATE INDEX idx_opens_learner ON public.material_opens USING btree (learner_id);
CREATE INDEX idx_opens_material ON public.material_opens USING btree (material_id);
CREATE INDEX idx_questions_form ON public.feedback_questions USING btree (form_id);
CREATE INDEX idx_record_attendance ON public.attendance_record USING btree (attendance_id);
CREATE INDEX idx_record_learner ON public.attendance_record USING btree (learner_id);
CREATE INDEX idx_responses_form ON public.feedback_responses USING btree (form_id);
CREATE INDEX idx_responses_subject ON public.feedback_responses USING btree (about_subject_id);
CREATE INDEX idx_responses_teacher ON public.feedback_responses USING btree (about_teacher_id);
CREATE UNIQUE INDEX uq_attendance_open_code ON public.attendance USING btree (attendance_code) WHERE ((status)::text = 'open'::text);

--
-- Foreign keys
--

ALTER TABLE ONLY public.assessment_answers ADD CONSTRAINT assessment_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_answers ADD CONSTRAINT assessment_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.assessment_question_options(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.assessment_answers ADD CONSTRAINT assessment_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.assessment_submissions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_memoranda ADD CONSTRAINT assessment_memoranda_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_memoranda ADD CONSTRAINT assessment_memoranda_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_question_options ADD CONSTRAINT assessment_question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_questions ADD CONSTRAINT assessment_questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_submissions ADD CONSTRAINT assessment_submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessment_submissions ADD CONSTRAINT assessment_submissions_grader_id_fkey FOREIGN KEY (grader_id) REFERENCES public.teachers(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.assessment_submissions ADD CONSTRAINT assessment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.learners(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.admin ADD CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.announcementattachment ADD CONSTRAINT fk_announcement_attachment FOREIGN KEY (announcement_id) REFERENCES public.announcement(announcement_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.announcementrecipient ADD CONSTRAINT fk_announcement_recipient FOREIGN KEY (announcement_id) REFERENCES public.announcement(announcement_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.announcement ADD CONSTRAINT fk_announcement_sender FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.announcementtarget ADD CONSTRAINT fk_announcement_target FOREIGN KEY (announcement_id) REFERENCES public.announcement(announcement_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_answers ADD CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES public.feedback_questions(question_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_answers ADD CONSTRAINT fk_answer_response FOREIGN KEY (response_id) REFERENCES public.feedback_responses(response_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessments ADD CONSTRAINT fk_assessment_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessments ADD CONSTRAINT fk_assessment_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assessments ADD CONSTRAINT fk_assessment_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.teacher_assignments ADD CONSTRAINT fk_assignment_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.teacher_assignments ADD CONSTRAINT fk_assignment_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.teacher_assignments ADD CONSTRAINT fk_assignment_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timetables ADD CONSTRAINT fk_assignment_timetable FOREIGN KEY (assignment_id) REFERENCES public.teacher_assignments(assignment_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.attendance ADD CONSTRAINT fk_attendance_assignment FOREIGN KEY (assignment_id) REFERENCES public.teacher_assignments(assignment_id);
ALTER TABLE ONLY public.attendance ADD CONSTRAINT fk_attendance_timetable FOREIGN KEY (timetable_id) REFERENCES public.timetables(timetable_id);
ALTER TABLE ONLY public.learner_enrollments ADD CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.classes ADD CONSTRAINT fk_class_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_completions ADD CONSTRAINT fk_completion_form FOREIGN KEY (form_id) REFERENCES public.feedback_forms(form_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_completions ADD CONSTRAINT fk_completion_learner FOREIGN KEY (learner_id) REFERENCES public.learners(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_forms ADD CONSTRAINT fk_form_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_forms ADD CONSTRAINT fk_form_creator FOREIGN KEY (created_by) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.learner_enrollments ADD CONSTRAINT fk_learner FOREIGN KEY (learner_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.learners ADD CONSTRAINT fk_learner_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.learners ADD CONSTRAINT fk_learner_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.learners ADD CONSTRAINT fk_learner_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.center_managers ADD CONSTRAINT fk_manager_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.center_managers ADD CONSTRAINT fk_manager_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.material_opens ADD CONSTRAINT fk_open_learner FOREIGN KEY (learner_id) REFERENCES public.learners(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.material_opens ADD CONSTRAINT fk_open_material FOREIGN KEY (material_id) REFERENCES public.learningmaterial(material_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_questions ADD CONSTRAINT fk_question_form FOREIGN KEY (form_id) REFERENCES public.feedback_forms(form_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.announcementrecipient ADD CONSTRAINT fk_recipient_user FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.attendance_record ADD CONSTRAINT fk_record_attendance FOREIGN KEY (attendance_id) REFERENCES public.attendance(attendance_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.attendance_record ADD CONSTRAINT fk_record_learner FOREIGN KEY (learner_id) REFERENCES public.learners(user_id);
ALTER TABLE ONLY public.feedback_responses ADD CONSTRAINT fk_response_center FOREIGN KEY (about_center_id) REFERENCES public.centers(center_id);
ALTER TABLE ONLY public.feedback_responses ADD CONSTRAINT fk_response_form FOREIGN KEY (form_id) REFERENCES public.feedback_forms(form_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback_responses ADD CONSTRAINT fk_response_subject FOREIGN KEY (about_subject_id) REFERENCES public.subjects(subject_id);
ALTER TABLE ONLY public.feedback_responses ADD CONSTRAINT fk_response_teacher FOREIGN KEY (about_teacher_id) REFERENCES public.teachers(user_id);
ALTER TABLE ONLY public.learner_enrollments ADD CONSTRAINT fk_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.teachers ADD CONSTRAINT fk_teacher_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.teachers ADD CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_user_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.learningmaterial ADD CONSTRAINT learningmaterial_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id);
ALTER TABLE ONLY public.learningmaterial ADD CONSTRAINT learningmaterial_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id);
ALTER TABLE ONLY public.learningmaterial ADD CONSTRAINT learningmaterial_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id);
ALTER TABLE ONLY public.lessonplanner ADD CONSTRAINT lessonplanner_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id);
ALTER TABLE ONLY public.lessonplanner ADD CONSTRAINT lessonplanner_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id);
ALTER TABLE ONLY public.lessonplanner ADD CONSTRAINT lessonplanner_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id);

-- End of public-schema-only dump