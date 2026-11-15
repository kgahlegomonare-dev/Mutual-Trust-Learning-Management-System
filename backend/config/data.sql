select * from users;
select * from centers;




-- CENTER------------------------------------------------------------
create table centers(
center_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
center_name varchar(50) not null,
center_address varchar(300) not null,
center_capacity int not null,
center_province varchar(20),
is_active boolean not null default true,
reason_for_deactivation text null,
created_at timestamptz default NOW()

);

ALTER TABLE centers ADD CONSTRAINT unique_center_per_province UNIQUE (center_name, center_province);
------------------------------------------------------------


-- USERS ------------------------------------------------------------
CREATE TYPE roles AS ENUM ('Admin', 'Center Manager', 'Teacher', 'Learner');

create table users(
user_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
first_name varchar(50) null, 
last_name varchar(50) null,
email varchar(100) not null,
password_hash text not null,
user_role roles not null,
center_id int,
is_profile_claimed boolean not null default false,
is_active boolean not null default true,
reason_for_deactivation text null,
created_at timestamptz default NOW(),

CONSTRAINT fk_user_center
        FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE
);
------------------------------------------------------------


-- ADMIN ------------------------------------------------------------
create table admin(
user_id int PRIMARY KEY,
admin_number int not null,


CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
------------------------------------------------------------



-- CENTER MANAGER------------------------------------------------------------
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
------------------------------------------------------------



-- TEACHER------------------------------------------------------------
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
------------------------------------------------------------



-- LEARNER------------------------------------------------------------
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

------------------------------------------------------------



-- SUBJECTS------------------------------------------------------------
create table subjects(

subject_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
subject_name varchar(50) not null,
subject_code varchar(10) not null,
grade int not null
);
------------------------------------------------------------

-- CLASSES ------------------------------------------------------------
CREATE TABLE classes(
    class_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    class_capacity INT NOT NULL,
    center_id INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    reason_for_deactivation TEXT,
	number_of_learners int,
    CONSTRAINT fk_class_center
        FOREIGN KEY (center_id)
        REFERENCES centers(center_id)
        ON DELETE CASCADE
);
------------------------------------------------------------


--teacherAssignments------------------------------------------------------------

CREATE TABLE teacher_assignments(
    assignment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
	grade int not null,

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
------------------------------------------------------------


--learnerAssignments------------------------------------------------------------

CREATE TABLE learner_enrollments (
    enrollment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    learner_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a learner cannot be accidentally registered to the exact same class/subject combo twice
    CONSTRAINT unique_learner_class_subject UNIQUE (learner_id, class_id, subject_id),
    
    -- Foreign Key constraints link back to your master tables
    CONSTRAINT fk_learner FOREIGN KEY (learner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    CONSTRAINT fk_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);

------------------------------------------------------------



-- TIMETABLE------------------------------------------------------------
CREATE TYPE days AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
CREATE TABLE timetables(
    timetable_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    assignment_id INT NOT NULL,
	
    timetable_day days NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    CONSTRAINT fk_assignment_timetable
        FOREIGN KEY (assignment_id)
        REFERENCES teacher_assignments(assignment_id)
        ON DELETE CASCADE
);


------------------------------------------------------------

-- SEEDING ------------------------------------------------------------
insert into centers(center_name,center_address,center_capacity,center_province,is_active,reason_for_deactivation)
values('center A', '44 Brixton', 50, 'Gauteng',true,null);

insert into users(first_name,last_name,email,password_hash,user_role,center_id,is_profile_claimed,is_active,reason_for_deactivation)
values('John','Doe','admin@gmail.com','1234','Admin',1,false,true,null);
-------------------------------------------------------------




-- SEEDING TIMETABLE------------------------------------------------------------
-- 1. Insert Mathematics (Subject ID: 5) for Class 11B (Class ID: 4) on Monday morning (08:00 - 09:00)
INSERT INTO timetables (assignment_id, timetable_day, start_time, end_time)
VALUES (
    (SELECT assignment_id FROM teacher_assignments WHERE teacher_id = 10 AND class_id = 4 AND subject_id = 5 LIMIT 1),
    'monday',
    '08:00:00',
    '09:00:00'
);

-- 2. Insert Mathematics (Subject ID: 5) for Class 11B (Class ID: 4) on Wednesday morning (08:00 - 09:00)
INSERT INTO timetables (assignment_id, timetable_day, start_time, end_time)
VALUES (
    (SELECT assignment_id FROM teacher_assignments WHERE teacher_id = 10 AND class_id = 4 AND subject_id = 5 LIMIT 1),
    'wednesday',
    '08:00:00',
    '09:00:00'
);

-- 3. Insert Physics (Subject ID: 2) for Class 11B (Class ID: 4) on Tuesday afternoon (11:30 - 12:30)
INSERT INTO timetables (assignment_id, timetable_day, start_time, end_time)
VALUES (
    (SELECT assignment_id FROM teacher_assignments WHERE teacher_id = 10 AND class_id = 4 AND subject_id = 2 LIMIT 1),
    'tuesday',
    '11:30:00',
    '12:30:00'
);

-- 4. Insert Physics (Subject ID: 2) for Class 11B (Class ID: 4) on Thursday afternoon (11:30 - 12:30)
INSERT INTO timetables (assignment_id, timetable_day, start_time, end_time)
VALUES (
    (SELECT assignment_id FROM teacher_assignments WHERE teacher_id = 10 AND class_id = 4 AND subject_id = 2 LIMIT 1),
    'thursday',
    '11:30:00',
    '12:30:00'
);
-------------------------------------------------------------