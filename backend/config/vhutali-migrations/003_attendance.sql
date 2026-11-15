-- ============================================================
-- 003_attendance.sql
-- Feature: Attendance (owner: Vhutali)
-- Tables:  attendance, attendance_record
-- Verified against the live shared Supabase schema.
-- Additive only: creates two NEW tables, touches nothing existing.
-- ============================================================

-- ------------------------------------------------------------
-- attendance
-- One row per session a teacher opens. Tied to a teacher_assignment
-- (which pins down teacher + subject + class) and optionally to the
-- timetable slot it belongs to.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    attendance_id   integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    assignment_id   integer NOT NULL,
    timetable_id    integer,

    attendance_code character varying NOT NULL,

    status          character varying NOT NULL DEFAULT 'open',

    created_at      timestamp with time zone NOT NULL DEFAULT now(),
    expires_at      timestamp with time zone NOT NULL,

    CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id),
    CONSTRAINT fk_attendance_assignment FOREIGN KEY (assignment_id)
        REFERENCES public.teacher_assignments(assignment_id),
    CONSTRAINT fk_attendance_timetable FOREIGN KEY (timetable_id)
        REFERENCES public.timetables(timetable_id),
    CONSTRAINT chk_attendance_status CHECK (status IN ('open', 'closed')),
    CONSTRAINT chk_expiry_after_creation CHECK (expires_at > created_at)
);

-- Only one OPEN session may hold a given code at a time. Lets a code
-- string be reused once its old session closes, while preventing two
-- live codes from colliding.
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_open_code
    ON public.attendance (attendance_code)
    WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_attendance_assignment
    ON public.attendance (assignment_id);


-- ------------------------------------------------------------
-- attendance_record
-- One row per learner per session. This is the data the risk score
-- reads, so status is explicit (present/late). A learner with no row
-- for a session is treated as absent by the reader.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_record (
    record_id       integer GENERATED ALWAYS AS IDENTITY NOT NULL,

    attendance_id   integer NOT NULL,
    learner_id      integer NOT NULL,

    status          character varying NOT NULL DEFAULT 'present',
    submitted_at    timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT attendance_record_pkey PRIMARY KEY (record_id),
    CONSTRAINT fk_record_attendance FOREIGN KEY (attendance_id)
        REFERENCES public.attendance(attendance_id) ON DELETE CASCADE,
    CONSTRAINT fk_record_learner FOREIGN KEY (learner_id)
        REFERENCES public.learners(user_id),
    CONSTRAINT chk_record_status CHECK (status IN ('present', 'late')),
    CONSTRAINT uq_record_per_session UNIQUE (attendance_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_record_learner
    ON public.attendance_record (learner_id);

CREATE INDEX IF NOT EXISTS idx_record_attendance
    ON public.attendance_record (attendance_id);
