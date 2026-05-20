param(
  [string]$Path = (Get-Location).Path
)

$lhDir = Join-Path $Path ".long-horizon"
$brainDir = Join-Path $lhDir "brain"
$indexFile = Join-Path $brainDir "graph-index.json"
$loopFile = Join-Path $lhDir "loop-state.json"

if (-not (Test-Path $lhDir)) {
  Write-Error "No .long-horizon directory found. Run /lh init first."
  exit 1
}

$now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
$sessionDir = Join-Path $lhDir "sessions" (Get-Date -Format 'yyyy-MM-dd')
New-Item -ItemType Directory -Path $sessionDir -Force | Out-Null

# Archive current session state
$sessionFile = Join-Path $sessionDir "compact-$(Get-Date -Format 'HHmmss').md"
$index = if (Test-Path $indexFile) { Get-Content $indexFile -Raw | ConvertFrom-Json } else { $null }
$loop = if (Test-Path $loopFile) { Get-Content $loopFile -Raw | ConvertFrom-Json } else { $null }

$nodeCount = if ($index) { $index.stats.total_nodes } else { 0 }
$edgeCount = if ($index) { $index.stats.total_edges } else { 0 }
$loopStatus = if ($loop) { $loop.loop.status } else { "unknown" }
$completion = if ($loop) { $loop.loop.completion_pct } else { 0 }

$content = @"
# Compaction — $now

## State at Compaction
- Graph: $nodeCount nodes, $edgeCount edges
- Loop: $loopStatus ($completion% complete)
- Iteration: $(if ($loop) { $loop.loop.iteration } else { 0 })

## Preserved
- graph-index.json (full graph intact)
- loop-state.json (resume point intact)
- All node files in brain/

## Instructions for Next Context
1. Read loop-state.json to resume
2. Read graph-index.json for full knowledge
3. Continue from next pending subtask
"@

$content | Set-Content -Path $sessionFile -Encoding UTF8
Write-Host "Compacted. Session archived: $sessionFile"
Write-Host "Graph preserved: $nodeCount nodes, $edgeCount edges"
Write-Host "Loop state preserved: $loopStatus at $completion%"
