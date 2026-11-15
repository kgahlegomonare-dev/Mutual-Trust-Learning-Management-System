-- ============================================================
-- 000_baseline.sql
-- Purpose: Recreate the team's shared Supabase schema on a LOCAL
--          Postgres database, so feature migrations (attendance,
--          feedback) can be built and tested locally.
-- Run this ONCE on your local `ksms` database, before 003_attendance.sql
-- ============================================================
-- NOTE: The three enum types below are confirmed against the
-- live Supabase schema (type names and labels match exactly).
-- ============================================================

-- ---------- ENUM TYPES (confirmed against Supabase) ----------
CREATE TYPE public.roles AS ENUM (
    'Admin', 'Center Manager', 'Teacher', 'Learner'
);

CREATE TYPE public.days AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
);

CREATE TYPE public.target_type AS ENUM (
    'System', 'Center', 'Grade', 'Class', 'Subject'
);

-- ---------- CORE TABLES (ordered so FKs resolve) ----------

CREATE TABLE public.centers (
  center_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  center_name character varying NOT NULL,
  center_address character varying NOT NULL,
  center_capacity integer NOT NULL,
  center_province character varying,
  is_active boolean NOT NULL DEFAULT true,
  reason_for_deactivation text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT centers_pkey PRIMARY KEY (center_id)
);

CREATE TABLE public.users (
  user_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  first_name character varying,
  last_name character varying,
  email character varying NOT NULL,
  password_hash text NOT NULL,
  user_role public.roles NOT NULL,
  center_id integer,
  is_profile_claimed boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  reason_for_deactivation text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_user_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id)
);

CREATE TABLE public.admin (
  user_id integer NOT NULL,
  admin_number character varying NOT NULL,
  CONSTRAINT admin_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

CREATE TABLE public.center_managers (
  user_id integer NOT NULL,
  manager_number character varying NOT NULL,
  center_id integer NOT NULL,
  CONSTRAINT center_managers_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_manager_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id),
  CONSTRAINT fk_manager_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

CREATE TABLE public.teachers (
  user_id integer NOT NULL,
  teacher_number character varying NOT NULL,
  center_id integer NOT NULL,
  CONSTRAINT teachers_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_teacher_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id),
  CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

CREATE TABLE public.subjects (
  subject_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  subject_name character varying NOT NULL,
  subject_code character varying NOT NULL,
  grade integer NOT NULL,
  CONSTRAINT subjects_pkey PRIMARY KEY (subject_id)
);

CREATE TABLE public.classes (
  class_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  class_name character varying NOT NULL,
  class_capacity integer,
  is_active boolean DEFAULT true,
  reason_for_deactivation text,
  center_id integer,
  number_of_learners integer NOT NULL,
  CONSTRAINT classes_pkey PRIMARY KEY (class_id),
  CONSTRAINT fk_class_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id)
);

CREATE TABLE public.teacher_assignments (
  assignment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  teacher_id integer NOT NULL,
  subject_id integer NOT NULL,
  class_id integer NOT NULL,
  CONSTRAINT teacher_assignments_pkey PRIMARY KEY (assignment_id),
  CONSTRAINT fk_assignment_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(user_id),
  CONSTRAINT fk_assignment_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id),
  CONSTRAINT fk_assignment_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id)
);

CREATE TABLE public.timetables (
  timetable_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  assignment_id integer NOT NULL,
  timetable_day public.days NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  CONSTRAINT timetables_pkey PRIMARY KEY (timetable_id),
  CONSTRAINT fk_assignment_timetable FOREIGN KEY (assignment_id) REFERENCES public.teacher_assignments(assignment_id)
);

CREATE TABLE public.learners (
  user_id integer NOT NULL,
  learner_number integer NOT NULL UNIQUE,
  center_id integer NOT NULL,
  class_id integer NOT NULL,
  grade integer NOT NULL,
  highschool character varying NOT NULL,
  CONSTRAINT learners_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_learner_center FOREIGN KEY (center_id) REFERENCES public.centers(center_id),
  CONSTRAINT fk_learner_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT fk_learner_user FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

CREATE TABLE public.learner_enrollments (
  enrollment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  learner_id integer NOT NULL,
  class_id integer NOT NULL,
  subject_id integer NOT NULL,
  enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT learner_enrollments_pkey PRIMARY KEY (enrollment_id),
  CONSTRAINT fk_learner FOREIGN KEY (learner_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT fk_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id)
);

CREATE TABLE public.announcement (
  announcement_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  title character varying NOT NULL,
  announcement_message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  sender_id integer,
  CONSTRAINT announcement_pkey PRIMARY KEY (announcement_id),
  CONSTRAINT fk_announcement_sender FOREIGN KEY (sender_id) REFERENCES public.users(user_id)
);

CREATE TABLE public.announcementrecipient (
  announcement_recipient_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  announcement_id integer NOT NULL,
  recipient_id integer NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  CONSTRAINT announcementrecipient_pkey PRIMARY KEY (announcement_recipient_id),
  CONSTRAINT fk_recipient_user FOREIGN KEY (recipient_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_announcement_recipient FOREIGN KEY (announcement_id) REFERENCES public.announcement(announcement_id)
);

CREATE TABLE public.announcementtarget (
  target_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  announcement_id integer NOT NULL,
  target_type public.target_type NOT NULL,
  target_value integer,
  CONSTRAINT announcementtarget_pkey PRIMARY KEY (target_id),
  CONSTRAINT fk_announcement_target FOREIGN KEY (announcement_id) REFERENCES public.announcement(announcement_id)
);

CREATE TABLE public.announcementattachment (
  attachment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  announcement_id integer NOT NULL,
  file_name character varying NOT NULL,
  file_path character varying NOT NULL,
  file_type character varying NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcementattachment_pkey PRIMARY KEY (attachment_id),
  CONSTRAINT fk_announcement_attachment FOREIGN KEY (announcement_id) REFERENCES public.announcement(announcement_id)
);
