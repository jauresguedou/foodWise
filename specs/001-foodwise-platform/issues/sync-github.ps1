<#
.SYNOPSIS
  Syncs the FoodWise issue drafts in this folder to GitHub.

.DESCRIPTION
  1. Creates or updates labels.
  2. Merges the duplicate "Week04" and "Week4" milestones into one "Week 04" milestone.
  3. Fixes the title of story #8 and labels stories #1-#8.
  4. Creates one issue per NN-*.md file. Titles that already exist are skipped,
     or, with -UpdateExisting, get their body, labels, and milestone refreshed from the file.
  5. Adds every story and task issue to the GitHub Project.

  Safe to re-run. Use -DryRun first to see what it would do.
  -UpdateExisting overwrites issue bodies, so any edits made on GitHub to those
  issues are lost. Check them first.

  Requirements:
    winget install GitHub.cli
    gh auth login
    gh auth refresh -s project      # Projects v2 needs the "project" scope

.EXAMPLE
  ./sync-github.ps1 -DryRun
  ./sync-github.ps1 -Week04DueOn 2026-10-03
  ./sync-github.ps1 -UpdateExisting -DryRun
#>
param(
  [string]$Repo = "jauresguedou/foodWise",
  [string]$ProjectOwner = "jauresguedou",
  [int]$ProjectNumber = 2,
  [string]$Week04DueOn = "",
  [switch]$UpdateExisting,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Milestone = "Week 04"

function Invoke-Gh {
  param([string[]]$GhArgs)
  if ($DryRun) {
    Write-Host "[dry-run] gh $($GhArgs -join ' ')" -ForegroundColor DarkGray
    return ""
  }
  $output = & gh @GhArgs
  if ($LASTEXITCODE -ne 0) { throw "gh $($GhArgs -join ' ') failed" }
  return $output
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI not found. Install with: winget install GitHub.cli"
}

# ---------- 1. Labels ----------
$labels = @(
  @("priority:P1", "B91C1C", "Must have for MVP"),
  @("priority:P2", "B45309", "Should have"),
  @("priority:P3", "57534E", "Nice to have"),
  @("type:frontend", "1D4ED8", "UI, pages, components"),
  @("type:backend", "1F7A4D", "Queries, actions, database"),
  @("type:devops", "6B7280", "CI, tooling, deployment"),
  @("type:docs", "0E7490", "Documentation"),
  @("scope:mvp", "15803D", "In the MVP"),
  @("scope:stretch", "CA8A04", "Only if the MVP ships early"),
  @("scope:post-mvp", "9CA3AF", "After the course MVP"),
  @("feature:identity", "7C3AED", "Accounts and eligibility"),
  @("feature:marketplace", "C2410C", "Stores and meal discovery"),
  @("feature:orders", "DB2777", "Cart and orders"),
  @("feature:payments", "BE123C", "Payments"),
  @("feature:vendor", "0369A1", "Vendor tools"),
  @("feature:support", "4D7C0F", "Meal support and loans"),
  @("feature:sponsorships", "A16207", "Meal-plan sponsorships"),
  @("feature:tracker", "047857", "Food tracker"),
  @("feature:ops", "475569", "Operations and admin"),
  @("security", "991B1B", "Security-sensitive"),
  @("privacy", "7E22CE", "Handles sensitive personal data"),
  @("compliance", "92400E", "Needs legal or compliance review"),
  @("design", "DB2777", "Design system and visuals")
)
foreach ($l in $labels) {
  Invoke-Gh @("label", "create", $l[0], "--repo", $Repo, "--color", $l[1], "--description", $l[2], "--force") | Out-Null
}
Write-Host "Labels ready."

# ---------- 2. Milestone ----------
$milestones = @((& gh api "repos/$Repo/milestones?state=all&per_page=100") | ConvertFrom-Json)
$target = $milestones | Where-Object { $_.title -eq $Milestone } | Select-Object -First 1
$legacy = @($milestones | Where-Object { $_.title -in @("Week04", "Week4") })

if (-not $target -and $legacy.Count -gt 0) {
  # Rename the first legacy milestone instead of creating a new one.
  $target = $legacy[0]
  Invoke-Gh @("api", "-X", "PATCH", "repos/$Repo/milestones/$($target.number)", "-f", "title=$Milestone") | Out-Null
  $legacy = @($legacy | Select-Object -Skip 1)
  Write-Host "Renamed milestone '$($target.title)' to '$Milestone'."
}
if (-not $target) {
  Invoke-Gh @("api", "-X", "POST", "repos/$Repo/milestones", "-f", "title=$Milestone") | Out-Null
  Write-Host "Created milestone '$Milestone'."
  if (-not $DryRun) {
    # Re-read to get the new milestone's number.
    $target = ((& gh api "repos/$Repo/milestones?state=all&per_page=100") | ConvertFrom-Json) |
      Where-Object { $_.title -eq $Milestone } | Select-Object -First 1
  }
}
if ($Week04DueOn -and $target) {
  Invoke-Gh @("api", "-X", "PATCH", "repos/$Repo/milestones/$($target.number)", "-f", "due_on=$($Week04DueOn)T23:59:59Z") | Out-Null
}

# Move issues off any remaining duplicate milestone, then delete it.
foreach ($m in $legacy) {
  $issuesOnLegacy = (& gh issue list --repo $Repo --state all --milestone $m.title --json number) | ConvertFrom-Json
  foreach ($i in $issuesOnLegacy) {
    Invoke-Gh @("issue", "edit", "$($i.number)", "--repo", $Repo, "--milestone", $Milestone) | Out-Null
  }
  Invoke-Gh @("api", "-X", "DELETE", "repos/$Repo/milestones/$($m.number)") | Out-Null
  Write-Host "Merged duplicate milestone '$($m.title)' into '$Milestone'."
}

# ---------- 3. Existing story issues ----------
Invoke-Gh @("issue", "edit", "8", "--repo", $Repo, "--title", "Operational Integrity and Support Review") | Out-Null

$storyLabels = @{
  1 = "priority:P1,feature:identity,security,scope:mvp"
  2 = "priority:P1,feature:marketplace,accessibility,scope:mvp"
  3 = "priority:P1,feature:orders,feature:payments,security,scope:mvp"
  4 = "priority:P1,feature:vendor,security,scope:mvp"
  5 = "priority:P2,feature:support,security,compliance,scope:post-mvp"
  6 = "priority:P2,feature:sponsorships,privacy,scope:post-mvp"
  7 = "priority:P2,feature:tracker,accessibility,scope:stretch"
  8 = "priority:P3,feature:ops,security,scope:post-mvp"
}
foreach ($n in $storyLabels.Keys) {
  Invoke-Gh @("issue", "edit", "$n", "--repo", $Repo, "--add-label", $storyLabels[$n]) | Out-Null
}
Write-Host "Stories #1-#8 labeled."

# ---------- 4. Task issues from NN-*.md files ----------
$existingByTitle = @{}
foreach ($i in ((& gh issue list --repo $Repo --state all --limit 500 --json number,title) | ConvertFrom-Json)) {
  $existingByTitle[$i.title] = $i.number
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$files = Get-ChildItem -Path $PSScriptRoot -Filter "*.md" | Where-Object { $_.Name -match '^\d{2}-' } | Sort-Object Name
$createdUrls = @()

foreach ($file in $files) {
  $raw = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  $match = [regex]::Match($raw, '(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$')
  if (-not $match.Success) { throw "No front matter in $($file.Name)" }

  $meta = @{}
  foreach ($line in ($match.Groups[1].Value -split '\r?\n')) {
    if ($line -match '^(\w+):\s*(.*)$') { $meta[$Matches[1]] = $Matches[2].Trim().Trim('"') }
  }
  $title = $meta["title"]
  $exists = $existingByTitle.ContainsKey($title)

  if ($exists -and -not $UpdateExisting) {
    Write-Host "Exists, skipping: $title" -ForegroundColor Yellow
    continue
  }

  $body = $match.Groups[2].Value
  if ($meta["parent"]) { $body = "Part of #$($meta["parent"])`n`n$body" }
  $bodyFile = Join-Path ([IO.Path]::GetTempPath()) "foodwise-issue-$($file.BaseName).md"
  [IO.File]::WriteAllText($bodyFile, $body, $utf8NoBom)

  $labelList = ($meta["labels"] -split ',\s*') -join ','

  if ($exists) {
    $number = $existingByTitle[$title]
    $editArgs = @("issue", "edit", "$number", "--repo", $Repo, "--body-file", $bodyFile, "--add-label", $labelList)
    if ($meta["milestone"]) { $editArgs += @("--milestone", $meta["milestone"]) }
    Invoke-Gh $editArgs | Out-Null
    Remove-Item $bodyFile -ErrorAction SilentlyContinue
    Write-Host "Updated #${number}: $title"
    continue
  }
  $createArgs = @("issue", "create", "--repo", $Repo, "--title", $title, "--body-file", $bodyFile, "--label", $labelList)
  if ($meta["milestone"]) { $createArgs += @("--milestone", $meta["milestone"]) }

  $url = Invoke-Gh $createArgs
  Remove-Item $bodyFile -ErrorAction SilentlyContinue
  if ($url) { $createdUrls += ($url | Select-Object -Last 1) }
  Write-Host "Created: $title"
}

# ---------- 5. Add everything to the project board ----------
$allUrls = @()
foreach ($n in 1..8) { $allUrls += "https://github.com/$Repo/issues/$n" }
$allUrls += $createdUrls
foreach ($u in $allUrls) {
  Invoke-Gh @("project", "item-add", "$ProjectNumber", "--owner", $ProjectOwner, "--url", $u) | Out-Null
}
Write-Host "Added $($allUrls.Count) issues to project $ProjectOwner/$ProjectNumber."
Write-Host "Done."
