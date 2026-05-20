param(
  [string]$Path = (Get-Location).Path
)

$lhDir = Join-Path $Path ".long-horizon"
$brainDir = Join-Path $lhDir "brain"

if (-not (Test-Path $lhDir)) {
  Write-Error "No .long-horizon directory found. Nothing to migrate."
  exit 1
}

# Check if already v2
$indexFile = Join-Path $brainDir "graph-index.json"
if (Test-Path $indexFile) {
  $index = Get-Content $indexFile -Raw | ConvertFrom-Json
  if ($index.version -eq "2.0") {
    Write-Host "Already v2. Nothing to migrate."
    exit 0
  }
}

Write-Host "Migrating v1 → v2..."

# Create new directories
$newDirs = @(
  (Join-Path $brainDir "tasks"),
  (Join-Path $brainDir "milestones")
)
foreach ($dir in $newDirs) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Generate root node
$hash = -join ((48..57) + (97..102) | Get-Random -Count 6 | ForEach-Object { [char]$_ })
$date = Get-Date -Format 'yyyyMMdd'
$rootId = "context-$date-$hash"
$now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
$projectName = Split-Path $Path -Leaf

# Build graph index from existing files
$nodes = @{}
$edges = @()

# Add root
$nodes[$rootId] = @{
  type = "context"; title = "$projectName — Root Node"
  file = "brain/context/$rootId.md"; edges_out = @(); edges_in = @()
  tags = @("root", "project"); weight = 1.0
}

# Migrate existing decisions
$decisionsDir = Join-Path $brainDir "decisions"
if (Test-Path $decisionsDir) {
  Get-ChildItem $decisionsDir -Filter "*.md" | ForEach-Object {
    $id = "decision-$date-$(-join ((48..57)+(97..102) | Get-Random -Count 6 | ForEach-Object {[char]$_}))"
    $nodes[$id] = @{
      type = "decision"; title = $_.BaseName; file = "brain/decisions/$($_.Name)"
      edges_out = @(); edges_in = @($rootId); tags = @("migrated"); weight = 0.6
    }
    $nodes[$rootId].edges_out += $id
    $edges += @{ source = $rootId; target = $id; relation = "leads_to" }
  }
}

# Migrate existing lessons
$lessonsDir = Join-Path $brainDir "lessons"
if (Test-Path $lessonsDir) {
  Get-ChildItem $lessonsDir -Filter "*.md" | ForEach-Object {
    $id = "lesson-$date-$(-join ((48..57)+(97..102) | Get-Random -Count 6 | ForEach-Object {[char]$_}))"
    $nodes[$id] = @{
      type = "lesson"; title = $_.BaseName; file = "brain/lessons/$($_.Name)"
      edges_out = @(); edges_in = @($rootId); tags = @("migrated"); weight = 0.5
    }
    $nodes[$rootId].edges_out += $id
    $edges += @{ source = $rootId; target = $id; relation = "leads_to" }
  }
}

# Write graph index
$graphIndex = @{
  version = "2.0"; root_node = $rootId; nodes = $nodes; edges = $edges
  stats = @{ total_nodes = $nodes.Count; total_edges = $edges.Count; last_updated = $now }
}
$graphIndex | ConvertTo-Json -Depth 10 | Set-Content $indexFile -Encoding UTF8

# Create loop-state.json
$loopState = @{ version = "2.0"; loop = @{ status = "idle"; task_id = $null; task_description = $null; started_at = $null; iteration = 0; max_iterations = 100; subtasks = @(); completed_subtasks = @(); blocked_subtasks = @(); completion_criteria = @(); completion_pct = 0; last_action = $null; last_action_at = $null; errors = @(); should_continue = $true }; memory_queue = @{ pending_nodes = @(); pending_edges = @() } }
$loopState | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $lhDir "loop-state.json") -Encoding UTF8

# Write root node file
$rootContent = @"
---
id: "$rootId"
type: "context"
created: "$now"
updated: "$now"
status: "active"
edges: []
tags: ["root", "project"]
weight: 1.0
---

# $projectName — Root Node (Migrated from v1)

## Content

Root node created during v1 → v2 migration. All existing knowledge has been linked here.

## Backlinks

"@
$contextDir = Join-Path $brainDir "context"
New-Item -ItemType Directory -Path $contextDir -Force | Out-Null
$rootContent | Set-Content -Path (Join-Path $contextDir "$rootId.md") -Encoding UTF8

Write-Host "Migration complete."
Write-Host "Root node: $rootId"
Write-Host "Nodes migrated: $($nodes.Count)"
Write-Host "Edges created: $($edges.Count)"
