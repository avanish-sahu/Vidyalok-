# TutorHub

A website for tuition teachers to share notes, daily practice problems (DPPs) and lectures with their students, organized by subject.

## How it works

- `/` — landing page: choose "Student" or "Teacher"
- **Teachers** apply at `/signup` (name, email, password, subjects taught) and stay **pending** until the admin approves them at `/admin`. Only approved teachers can log in.
- Once approved, a teacher's dashboard has two tabs: **Resources** (upload notes/DPP/lectures into their assigned subjects) and **My Students** (add a student by name + email — no password needed from the teacher).
- **Students** never self-signup. A teacher adds them by name + email. The student goes to `/login`, enters that email, and — the first time only — is prompted to set their own password right there. Every login after that just asks for email then password as usual.
- **Admin** logs in at `/login` using the email/password set as `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env.local` — no signup needed. The admin dashboard approves/rejects/revokes teacher accounts.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a free MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas/register, then get its connection string (Database > Connect > Drivers).
3. Paste the connection string into `.env.local` as `MONGODB_URI`. `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` are already filled in — change `ADMIN_PASSWORD` if you want.
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000

Uploaded files are stored on disk in `public/uploads/<subject>/<type>/`.
