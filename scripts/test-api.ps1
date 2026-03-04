#!/usr/bin/env pwsh
# ══════════════════════════════════════════════════════════════
#  Gigzs Backend — Full API Test Script (PowerShell)
#  Run this AFTER: supabase start  AND  npm run dev
# ══════════════════════════════════════════════════════════════

$BASE    = "http://localhost:3000"
$SB_URL  = "http://127.0.0.1:54321"
$ANON    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
$SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

function Api($method, $path, $body = $null, $token = $null) {
    $hdrs = @{ "Content-Type" = "application/json" }
    if ($token) { $hdrs["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$BASE$path"; Method = $method; Headers = $hdrs; UseBasicParsing = $true }
    if ($body) { $params["Body"] = ($body | ConvertTo-Json -Depth 10) }
    try {
        $r = Invoke-WebRequest @params
        Write-Host "  ✅ $method $path → $($r.StatusCode)" -ForegroundColor Green
        return ($r.Content | ConvertFrom-Json)
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "  ❌ $method $path → $code" -ForegroundColor Red
        Write-Host "     $($_.Exception.Message)" -ForegroundColor DarkRed
        return $null
    }
}

function Separator($title) {
    Write-Host ""
    Write-Host "══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════" -ForegroundColor Cyan
}

# ── 0. HEALTH CHECK ──────────────────────────────────────────
Separator "0. Health — Supabase + Next.js"
try {
    $h = Invoke-WebRequest -Uri "$SB_URL/health" -UseBasicParsing
    Write-Host "  ✅ Supabase running: $($h.Content)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Supabase NOT running. Start it: npx supabase start" -ForegroundColor Red
    exit 1
}

# ── 1. SIGN UP — CLIENT ──────────────────────────────────────
Separator "1. Sign Up — Client"
$clientEmail = "client_test_$(Get-Date -Format 'HHmmss')@gigzs.test"
$clientPw    = "Test1234!"

$signupRes = Api POST "/api/auth/signup" @{
    email    = $clientEmail
    password = $clientPw
    fullName = "Test Client"
    role     = "client"
}
$CLIENT_TOKEN = $signupRes?.session?.access_token
Write-Host "  Client email: $clientEmail"
Write-Host "  Token obtained: $(-not [string]::IsNullOrEmpty($CLIENT_TOKEN))"

# ── 2. SIGN UP — FREELANCER ──────────────────────────────────
Separator "2. Sign Up — Freelancer"
$flEmail = "freelancer_test_$(Get-Date -Format 'HHmmss')@gigzs.test"
$signupFl = Api POST "/api/auth/signup" @{
    email       = $flEmail
    password    = $clientPw
    fullName    = "Test Freelancer"
    role        = "freelancer"
    specialties = @("frontend","react","typescript")
}
$FL_TOKEN = $signupFl?.session?.access_token
Write-Host "  Freelancer email: $flEmail"

# ── 3. CREATE PROJECT ────────────────────────────────────────
Separator "3. Create Project (as Client)"
if (-not $CLIENT_TOKEN) { Write-Host "  Skipping — no client token" -ForegroundColor Yellow }
else {
    $projectRes = Api POST "/api/projects/create" @{
        title = "Test Dashboard App"
        rawRequirement = "Build a responsive dashboard with auth, charts, and dark mode"
        intake = @{
            projectType = "dashboard"
            features    = @("authentication","data-visualization","dark-mode")
            urgency     = "medium"
            techStack   = @("react","supabase")
            notes       = "Responsive, mobile-first"
            integrations = @()
        }
    } -token $CLIENT_TOKEN

    $global:PROJECT_ID = $projectRes?.project?.id
    Write-Host "  Project ID: $PROJECT_ID"
    Write-Host "  Modules created: $($projectRes?.modules?.Count)"
    Write-Host "  Total price: ₹$($projectRes?.project?.total_price)"
}

# ── 4. LIST CLIENT PROJECTS ──────────────────────────────────
Separator "4. GET /api/projects (Client Project List)"
$projects = Api GET "/api/projects" -token $CLIENT_TOKEN
Write-Host "  Projects returned: $($projects?.projects?.Count)"

# ── 5. GET PROJECT FEED (empty at this point) ────────────────
Separator "5. GET /api/projects/[id]/feed (Client Feed)"
if ($global:PROJECT_ID) {
    $feed = Api GET "/api/projects/$($global:PROJECT_ID)/feed" -token $CLIENT_TOKEN
    Write-Host "  Feed entries: $($feed?.feed?.Count)"
    Write-Host "  Modules: $($feed?.modules?.Count)"
}

# ── 6. GET FREELANCER'S MODULES ──────────────────────────────
Separator "6. GET /api/freelancer/modules"
if ($FL_TOKEN) {
    $flModules = Api GET "/api/freelancer/modules" -token $FL_TOKEN
    Write-Host "  Assigned modules: $($flModules?.modules?.Count)"
    $global:FL_MODULE_ID = $flModules?.modules?[0]?.id
    Write-Host "  First module ID: $($global:FL_MODULE_ID)"
}

# ── 7. FREELANCER CHECK-IN ───────────────────────────────────
Separator "7. POST /api/freelancer/checkin"
if ($FL_TOKEN -and $global:FL_MODULE_ID) {
    $checkin = Api POST "/api/freelancer/checkin" @{
        moduleId      = $global:FL_MODULE_ID
        dailyWageInr  = 1500
    } -token $FL_TOKEN
    Write-Host "  Checked in: $($checkin?.ok)"
    Write-Host "  Shift date: $($checkin?.shiftDate)"
} else {
    Write-Host "  Skipping — no module assigned yet (seed a freelancer first)" -ForegroundColor Yellow
}

# ── 8. FREELANCER HANDOFF ────────────────────────────────────
Separator "8. POST /api/freelancer/handoff"
if ($FL_TOKEN -and $global:FL_MODULE_ID) {
    $handoff = Api POST "/api/freelancer/handoff" @{
        moduleId      = $global:FL_MODULE_ID
        handoffNotes  = "Completed auth module setup. JWT tokens working. Next: wire up the dashboard charts."
        publicSummary = "Authentication module — 40% complete. Session handling implemented."
    } -token $FL_TOKEN
    Write-Host "  Handoff status: $($handoff?.status)"
}

# ── 9. GET FEED AFTER HANDOFF ────────────────────────────────
Separator "9. GET Feed — should have updates now"
if ($global:PROJECT_ID) {
    $feed2 = Api GET "/api/projects/$($global:PROJECT_ID)/feed" -token $CLIENT_TOKEN
    Write-Host "  Feed entries: $($feed2?.feed?.Count)"
    $feed2?.feed | ForEach-Object { Write-Host "  → $($_.update_type): $($_.headline)" }
}

# ── 10. VERIFY ANONYMITY ─────────────────────────────────────
Separator "10. Anonymity Check — feed must not contain freelancer data"
if ($global:PROJECT_ID) {
    $rawFeed = Invoke-WebRequest -Uri "$BASE/api/projects/$($global:PROJECT_ID)/feed" `
        -Headers @{ Authorization = "Bearer $CLIENT_TOKEN" } -UseBasicParsing
    $hasFreelancer = $rawFeed.Content -match '"freelancer_id"'
    if ($hasFreelancer) {
        Write-Host "  ❌ FAIL — freelancer_id found in client feed!" -ForegroundColor Red
    } else {
        Write-Host "  ✅ PASS — No freelancer identity in client feed" -ForegroundColor Green
    }
}

# ── DONE ─────────────────────────────────────────────────────
Separator "Test Run Complete"
Write-Host ""
