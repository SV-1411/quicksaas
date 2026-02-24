# Gigzs Managed Execution Engine — Test Guide

## 1️⃣ Prerequisites

### Supabase Setup
- Go to your Supabase Dashboard → **SQL Editor**
- Run `supabase/schema.sql` (creates tables/enums)
- Run `supabase/policies.sql` (adds RLS policies)
- **Rotate keys** (since old ones were in git): Settings → API → Regenerate Service Role + Anon keys
- Update your local `.env` and `apps/web/.env.local` with the new keys

### Local Dev
```bash
npm run dev:web
```
- Open http://localhost:3000

---

## 2️⃣ Test Flow (Step-by-Step)

### Step A: Freelancer Onboarding
1. Go to `/login`
2. Login as **frontend@gigzs.local** / `Password123!`
3. You will be redirected to the Freelancer Dashboard
4. **Expected:** You should see the onboarding form (specialties + shift selection)
5. **Fill form:**
   - Select at least 1 specialty (e.g. "frontend")
   - Select at least 1 shift (e.g. "Shift A (09:00–18:00 IST)")
   - Add skills text
   - Click "Complete Onboarding"
6. **Expected:** Green toast, page refreshes, you now see the "Assigned modules" section (likely empty)

### Step B: Client Project Creation
1. Go to `/login`
2. Login as **client@gigzs.local** / `Password123!`
3. You will be redirected to the Client Dashboard
4. Click "Create Project" → Modal opens
5. **Fill intake:**
   - Title: e.g. "B2B Customer Portal"
   - Product Type: Web App
   - Urgency: High
   - Features: Select at least 3 (e.g. User Auth, Payments, Dashboard)
   - Integrations: Select at least 1 (e.g. Stripe)
   - Notes: "Need user roles, invoice generation, and admin panel."
6. Click "Launch Execution"
7. **Expected:** Green toast, redirect to `/projects/[id]`

### Step C: Verify Project Detail Page
1. You should see:
   - Project title + status
   - "Live execution pipeline" with 4 modules (Frontend, Backend, Integrations, Deployment)
   - "Execution Timeline" (currently empty)
   - "Deployment preview" placeholder
2. **Real-time test:** Open the same project in a second tab/browser and refresh — should stay in sync

### Step D: Freelancer Assignment & Shift Start
1. Log back in as the freelancer
2. Go to Freelancer Dashboard
3. **Expected:** You should now see 1 assigned module with shift window
4. Click the module card → goes to `/modules/[id]`
5. You should see:
   - Module name + project ID
   - "Start Shift" button
   - Definition of Done checklist
   - Shift History (empty)
   - Shift Context panel
6. Click "Start Shift"
7. **Expected:** Green toast, button changes to "Check-out / Handoff"

### Step E: AiroBuilder Workspace
1. After starting shift, you should see:
   - AiroBuilder Workspace card with "Provision Workspace" button
2. Click "Provision Workspace"
3. **Expected:** Green toast, iframe appears showing GoDaddy AiroBuilder (if API keys are valid)
4. If iframe fails, you’ll see an error toast — this is OK for local testing

### Step F: Shift Handoff
1. Click "Check-out / Handoff"
2. Fill form:
   - Progress Made: 25
   - Public Summary: "Implemented login UI and auth flow"
   - Internal Notes: "Used NextAuth, need to add role-based redirects"
   - Deployment URL: (optional)
3. Click "Complete Shift"
4. **Expected:** Green toast, page refreshes, you now see your entry in "Shift History"

### Step G: Client Visibility
1. Log back in as the client
2. Go to the project detail page
3. **Expected:** You should now see a new entry in the "Execution Timeline" with your public summary and "+25% progress" badge

---

## 3️⃣ What to Do When Things Don’t Work

### ❌ Login 401/403 Errors
- **Cause:** Supabase RLS policies not applied or user profile missing
- **Fix:** Run `supabase/policies.sql` in SQL Editor
- **If still failing:** Check Supabase Auth → Users table for your seed users

### ❌ Project Creation 500/400 Errors
- **Cause:** Missing `project_intake` table or RLS
- **Fix:** Run `supabase/schema.sql` (creates `project_intake` and `gml_spec` columns)
- **Check:** Ensure `users` table has your client row

### ❌ Freelancer Onboarding Not Showing
- **Cause:** `freelancer_profiles` table missing or RLS blocking
- **Fix:** Run `supabase/schema.sql` (creates `freelancer_profiles`)
- **Check:** Verify `users.role = 'freelancer'` for your test user

### ❌ No Modules Assigned After Project Creation
- **Cause:** Assignment engine couldn’t find a matching freelancer
- **Fix:** Ensure freelancer profile exists and matches at least one module’s specialty
- **Check:** In Supabase, `project_module_assignments` should have rows after project creation

### ❌ AiroBuilder Workspace Fails
- **Cause:** Missing or invalid `AIROBUILDER_API_URL` / `AIROBUILDER_API_KEY`
- **Fix:** Add placeholder values to `.env` files or skip for local testing
- **OK to ignore:** The rest of the flow works without AiroBuilder

### ❌ Real-time Updates Not Working
- **Cause:** Supabase Realtime not enabled or RLS blocking
- **Fix:** In Supabase Dashboard → Replication → Enable for `project_modules`, `progress_logs`, `work_snapshots`, `airobuilder_sessions`
- **Check:** Browser console for Realtime errors

### ❌ Project List Not Loading
- **Cause:** Missing `/api/projects` route or RLS
- **Fix:** Ensure `apps/web/app/api/projects/route.ts` exists and RLS policies allow client read

---

## 4️⃣ Debugging Checklist

- ✅ Supabase schema applied
- ✅ Supabase RLS policies applied
- ✅ Supabase Realtime enabled
- ✅ Environment variables updated
- ✅ Seed users exist in Auth + `users` table
- ✅ Freelancer profile exists
- ✅ Project creates modules + assignments
- ✅ Check-in creates `work_snapshots`
- ✅ Check-out creates `progress_logs`
- ✅ Client sees progress in timeline

---

## 5️⃣ Optional: Full End-to-End Test

If you want to simulate a full shift relay:
1. Create a second freelancer (`backend@gigzs.local`) and onboard them
2. After frontend freelancer checks out, the backend freelancer should see the next module assigned
3. Repeat the shift cycle to see the relay in action

---

## 6️⃣ Notes

- The system works end-to-end even if AiroBuilder is not configured
- All data is isolated by user via RLS
- Realtime updates require Supabase Replication enabled
- Freelancers are anonymized to clients by design

---

**If you hit any error not listed here, check the browser console and the Next.js dev server terminal for stack traces.**
