CREATE TABLE centers(
    center_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    center_name VARCHAR(50) NOT NULL,
    center_address VARCHAR(300) NOT NULL,
    center_capacity INT NOT NULL,
    center_province VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reason_for_deactivation TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE roles AS ENUM ('Admin', 'Center Manager', 'Teacher', 'Learner');

create table users(
user_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
first_name varchar(50) not null, 
last_name varchar(50) not null,
email varchar(100) not null,
password_hash text not null,
user_role roles not null,
center_id int,
is_profile_claimed boolean not null default true,
is_active boolean not null default true,
reason_for_deactivation text null,
created_at timestamptz default NOW(),

CONSTRAINT fk_user_center
        FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE
);

create table admin(
user_id int PRIMARY KEY,
admin_number int not null,


CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

create table center_managers(
user_id int PRIMARY KEY,
manager_number int not null,
center_id int not null,


CONSTRAINT fk_manager_center        
		FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE,

CONSTRAINT fk_manager_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE classes(
    class_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    class_capacity INT NOT NULL,
    center_id INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    reason_for_deactivation TEXT;
    CONSTRAINT fk_class_center
        FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE
);

CREATE TABLE teachers(
    user_id INT PRIMARY KEY,
    teacher_number INT NOT NULL UNIQUE,
    center_id INT NOT NULL,

    CONSTRAINT fk_teacher_center
        FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_teacher_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE learners(
    user_id INT PRIMARY KEY,
    learner_number INT NOT NULL UNIQUE,
    center_id INT NOT NULL,
    class_id INT NOT NULL,
    grade INT NOT NULL,
    highschool VARCHAR(50) NOT NULL,

    CONSTRAINT fk_learner_center
        FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_learner_class
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_learner_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE subjects(
    subject_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_name VARCHAR(50) NOT NULL,
    subject_code VARCHAR(10) NOT NULL UNIQUE,
    grade INT NOT NULL
);

CREATE TABLE teacherAssignments(
    assignment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,

    CONSTRAINT fk_assignment_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_class
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id)
        ON DELETE CASCADE,

    -- prevents duplicate assignment
    CONSTRAINT unique_assignment
        UNIQUE (teacher_id, subject_id, class_id)
);

CREATE TYPE days AS ENUM (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday'
);

CREATE TABLE timetables(
    timetable_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    assignment_id INT NOT NULL,
    timetable_day days NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    CONSTRAINT fk_assignment_timetable
        FOREIGN KEY (assignment_id)
        REFERENCES teacherAssignments(assignment_id)
        ON DELETE CASCADE
);






