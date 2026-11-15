# Assessment Platform — merged into the main backend

Everything below was **added**; nothing in your existing code was changed
except two new lines in `index.js` (see "The only edit" at the bottom).

## What I added

```
backend/
  assessments/                          NEW — self-contained module
    routes.js                           router, mounted at /api/assessments
    controller.js                       all route handlers
    gradingService.js                   autograding + score recompute
    serialize.js                        nested JSON assembly helpers
  config/
    assessment_platform_schema.sql      NEW — additive DB migration
```

Nothing here imports or modifies `controllers/controller.js`,
`routes/routes.js`, `config/db.js`, `middleware/authMiddleware.js`, or any
existing table. It reuses your `pool` from `config/db.js` and your
`protect`/`authorize` middleware as-is.

## 1. Run the migration

New tables only — `assessments`, `assessment_questions`,
`assessment_question_options`, `assessment_submissions`,
`assessment_answers`, `assessment_memoranda`. Foreign keys point at your
real tables: `teachers(user_id)`, `learners(user_id)`,
`subjects(subject_id)`, `classes(class_id)`.

```bash
psql "$DATABASE_URL" -f config/assessment_platform_schema.sql
```

(or with your existing `DB_HOST`/`DB_USER`/... env vars via whatever
client you normally use against Supabase). No new env vars needed — it
reuses `JWT_SECRET` and your existing DB connection.

## 2. How identity flows through (no separate login)

Every route under `/api/assessments` goes through your existing `protect`
middleware first, so it's driven entirely by the same JWT your app already
issues (`{ user_id, email, role, center_id }`). There's no assessment-platform
login — a teacher's `user_id` and a learner's `user_id` are used directly to
scope everything:

- **Teacher subjects/classes** come from `teacher_assignments` — whatever a
  teacher is already assigned to teach, no separate setup needed.
- **Learner subjects/assessments** come from `learner_enrollments` — a
  learner only ever sees assessments published for the exact
  `(subject_id, class_id)` pair they're enrolled in. Since your schema lets
  a learner's class differ per subject, this is resolved per-subject rather
  than assuming one fixed class.
- **Ownership is enforced server-side on every write** — a teacher can only
  touch assessments where `teacher_id === req.user.user_id`, and only for
  subject/class combinations that actually exist in `teacher_assignments`
  (verified at creation time). A learner can only touch their own
  submissions. I load-tested this with a second, unrelated teacher token
  and confirmed a 403.

## 3. API surface (all under `/api/assessments`, all require the JWT)

**Identity**
- `GET /me`

**Teacher**
- `GET /teacher/subjects`, `GET /teacher/classes?subjectId=`
- `GET /teacher/list?subjectId=&classId=&status=`
- `POST /teacher` — create (validated against `teacher_assignments`)
- `GET /:id`, `PATCH /:id`, `DELETE /:id`
- `POST /:id/publish`, `POST /:id/close`
- `POST /:id/questions`, `DELETE /questions/:id`
- `GET /:id/roster?status=` — completion tracking, learners drawn from
  `learner_enrollments` for that assessment's subject+class
- `GET /:id/gradebook` — ranked marks
- `GET/POST /:id/memorandum` — release blocked server-side until every
  enrolled learner has a `submitted`/`graded` row
- `PUT /answers/:id/grade`, `POST /submissions/:id/finalize`

**Learner**
- `GET /student/subjects`
- `GET /student/list?subjectId=`
- `POST /:id/attempts` — start/resume
- `PUT /submissions/:id/answers`
- `POST /submissions/:id/submit` — **autogrades** multiple-choice/true-false
  instantly; finalizes on the spot if nothing needs a human

**Shared** (ownership checked per-role inside the handler)
- `GET /submissions/:id`, `GET /submissions/:id/result`

## 4. Verification

I built a local replica of real table shapes (`users`, `teachers`,
`learners`, `subjects`, `classes`, `teacher_assignments`,
`learner_enrollments`) — matching what `config/db.js` actually queries,
which differs slightly from `config/data.sql` (that file creates
`teacherAssignments`/no underscore and defines `learners` before `classes`,
which would fail to run in that order; your live DB clearly already has the
corrected shape, since your existing manager routes query
`teacher_assignments` and `getAssignmentsByTeacher` successfully). I then
booted the actual merged `index.js`, signed real JWTs shaped exactly like
`authController.js` produces, and ran the full flow through your real
`protect`/`authorize` middleware end-to-end: teacher creates → adds
questions → publishes → learner attempts → answers → submits → objective
questions auto-grade instantly → teacher manually grades the short answer →
submission flips to `graded` and score/rank appear → memorandum correctly
blocked until the whole class is done, then succeeds → gradebook ranks
correctly → a second, unrelated teacher token gets a 403 trying to grade
someone else's answer. Everything above reflects that verified run, not
just a syntax check.

## The only edit

Two lines added to `index.js`, nothing else touched:

```diff
 import authRoutes from './routes/authRoutes.js';
 import generalRoutes from './routes/routes.js';
+import assessmentRoutes from './assessments/routes.js'; // NEW: Assessment Platform module
```

```diff
 app.use('/api', generalRoutes);
+app.use('/api/assessments', assessmentRoutes); // NEW: Assessment Platform module
```

## Still open: the frontend
He Mihla check the frontend, i Did not touch it.
This turn was backend-only. 