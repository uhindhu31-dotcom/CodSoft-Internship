# CareerHub

CareerHub is a Next.js job portal using PostgreSQL, Prisma 6.19.3, and Better
Auth. Prisma Client uses the JavaScript engine with the PostgreSQL driver
adapter, avoiding the Windows native query-engine DLL lock during generation.

## Local setup

1. Install Node.js and PostgreSQL, create a database, and copy `.env.example` to
   `.env`. Replace the `DATABASE_URL` placeholder with your PostgreSQL URL.
2. Set `BETTER_AUTH_SECRET` to a generated secret:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
   Set `BETTER_AUTH_URL` to the app origin and `ADMIN_EMAILS` to a comma-separated
   list of administrator email addresses.
3. Install and prepare the app:

   ```powershell
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

   On PowerShell systems where script execution blocks `npm.ps1` or `npx.ps1`,
   use `npm.cmd` and `npx.cmd` for those commands.

For an existing or production database, use `npx prisma migrate deploy` instead
of `migrate dev`. Do not reset a database to apply migrations.

## Demo records

Run the additive, repeatable demo seed after applying migrations:

```powershell
npm run db:seed
```

In PowerShell environments with a restrictive execution policy, use
`npm.cmd run db:seed`. The seed uses Better Auth's signup flow to hash passwords,
does not reset the database, and does not change existing account passwords or
profiles. If a demo email already exists with a different name or role, the seed
stops rather than altering that account. Re-running it reuses matching accounts
and skips records that already exist.

The demo password for accounts created by the seed is
`CareerHubDemo2026!`. Set `DEMO_SEED_PASSWORD` before seeding to choose another
password; existing accounts are never reset by this setting. These are sample
credentials and must only be used in a local or disposable demo environment.

Demo accounts (all use the demo password above):

| Role | Email |
|---|---|
| Admin | `careerhub.demo.admin@example.com` |
| Recruiter | `careerhub.demo.arjun@example.com` |
| Recruiter | `careerhub.demo.meera@example.com` |
| Recruiter | `careerhub.demo.rohan@example.com` |
| Recruiter | `careerhub.demo.nisha@example.com` |
| Recruiter | `careerhub.demo.vikram@example.com` |
| Candidate | `careerhub.demo.aditi@example.com` |
| Candidate | `careerhub.demo.ishaan@example.com` |
| Candidate | `careerhub.demo.priya@example.com` |
| Candidate | `careerhub.demo.kabir@example.com` |
| Candidate | `careerhub.demo.sana@example.com` |
| Candidate | `careerhub.demo.devika@example.com` |
| Candidate | `careerhub.demo.rahul@example.com` |
| Candidate | `careerhub.demo.ananya@example.com` |
| Candidate | `careerhub.demo.karthik@example.com` |
| Candidate | `careerhub.demo.zoya@example.com` |

The sample dataset includes 5 fictional Indian companies, 15 job postings
(approved, pending, and rejected), 20 applications with status history, 3
upcoming interviews, candidate profiles and TXT resumes, saved jobs,
notifications, and moderation reports. Salaries are annual INR values. The
schema has a one-to-one recruiter/company relationship, so the seed creates 5
recruiter accounts to support all 5 companies.

To remove the sample data safely, first back up the database and inspect the
exact demo accounts and `careerhub_demo_*` IDs in a disposable development
database. The seed itself never deletes records. Because the current schema
does not store a "created by demo seed" marker, do not run broad deletes or
delete demo-email accounts that existed before seeding. Remove the known demo
application/report/interview/job/resume/notification IDs explicitly, then remove
the demo accounts only after confirming they were created for this dataset;
PostgreSQL foreign-key cascades will remove their dependent records. For a
production database, leave the demo fixtures in place or have an operator
review and delete each confirmed fixture ID.

On a backed-up, dedicated demo database, these namespaced deletes remove the
seeded content rows while leaving user accounts and candidate profiles for
manual review:

```sql
BEGIN;
DELETE FROM "job_report" WHERE id = 'careerhub_demo_job_report_01';
DELETE FROM "user_report" WHERE id = 'careerhub_demo_user_report_01';
DELETE FROM "interview" WHERE id LIKE 'careerhub_demo_interview_%';
DELETE FROM "application_status_event" WHERE id LIKE 'careerhub_demo_status_%';
DELETE FROM "job_application" WHERE id LIKE 'careerhub_demo_application_%';
DELETE FROM "notification" WHERE id LIKE 'careerhub_demo_notification_%';
DELETE FROM "saved_job" WHERE "jobId" LIKE 'careerhub_demo_job_%';
DELETE FROM "resume" WHERE id LIKE 'careerhub_demo_resume_%';
DELETE FROM "job" WHERE id LIKE 'careerhub_demo_job_%';
DELETE FROM "company" WHERE id LIKE 'careerhub_demo_company_%';
COMMIT;
```

Only after verifying a demo account was created by this seed (and did not exist
before it), optionally delete its exact email row; its dependent profile,
sessions, account, and notifications are removed by the declared foreign-key
cascades:

```sql
DELETE FROM "user" WHERE email IN (
  'careerhub.demo.admin@example.com',
  'careerhub.demo.arjun@example.com',
  'careerhub.demo.meera@example.com',
  'careerhub.demo.rohan@example.com',
  'careerhub.demo.nisha@example.com',
  'careerhub.demo.vikram@example.com',
  'careerhub.demo.aditi@example.com',
  'careerhub.demo.ishaan@example.com',
  'careerhub.demo.priya@example.com',
  'careerhub.demo.kabir@example.com',
  'careerhub.demo.sana@example.com',
  'careerhub.demo.devika@example.com',
  'careerhub.demo.rahul@example.com',
  'careerhub.demo.ananya@example.com',
  'careerhub.demo.karthik@example.com',
  'careerhub.demo.zoya@example.com'
);
```

## Optional integrations

- **OpenAI resume analysis:** Set `OPENAI_API_KEY`; `OPENAI_MODEL` is optional and
  defaults to `gpt-4o-mini`. Candidates must explicitly consent before their
  profile and latest resume text are sent to OpenAI. The analysis extracts
  evidence-based skills, education, experience, projects, suggestions, a resume
  quality score, and job matches. Without the key, AI analysis is reported as
  unavailable; recommendations remain clearly labeled as rule-based skill and
  location matching. Do not put credentials in client-side variables.
- **Resend email:** Set `RESEND_API_KEY` and `EMAIL_FROM` to a sender verified by
  Resend. The app attempts welcome, new-application, application-status, and
  interview emails. In-app notifications and database updates are preserved if
  email is unavailable or delivery fails; the UI reports that separately.
- **Resume formats:** Candidate uploads support TXT, PDF, and DOCX up to 5 MB.
  Files and extracted text are stored in PostgreSQL. PDFs must contain selectable
  text; scanned PDFs requiring OCR are rejected with an explanation. Recruiter
  resume access is restricted to applicants for that recruiter’s jobs.

## Implemented workflows

- Candidate and recruiter email/password registration and sign-in.
- Candidate profiles, resume upload and management, saved jobs, applications,
  application tracking, and in-app notifications.
- Public approved-job search with keyword, location, category, workplace, and
  minimum salary filters, plus personalized recommendations.
- Recruiter company profiles, job posting and management, applicant review,
  resume access, interview scheduling, and application status updates.
- Admin statistics, job moderation, company verification, user management, and
  report review.
- Resume analysis with explicit OpenAI consent when configured; without OpenAI,
  skill/location recommendations are explicitly labeled rule-based.

Job alerts and the homepage's clearly marked example listings are not database
features. Use live job search to browse approved postings.

## Verification commands

```powershell
npx prisma validate
npx prisma migrate status
npm run lint
npx tsc --noEmit
npm run build
```

In PowerShell environments with a restrictive execution policy, use `npx.cmd`
and `npm.cmd` for the same commands.
