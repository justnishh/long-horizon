param(
  [string]$Path = (Get-Location).Path
)

$lhDir = Join-Path $Path ".long-horizon"
$brainDir = Join-Path $lhDir "brain"
$indexFile = Join-Path $brainDir "graph-index.json"
$loopFile = Join-Path $lhDir "loop-state.json"
$errors = @()

if (-not (Test-Path $lhDir)) {
  Write-Error "No .long-horizon directory found. Run /lh init first."
  exit 1
}

# Check graph-index.json exists and is valid
if (-not (Test-Path $indexFile)) {
  $errors += "MISSING: graph-index.json"
} else {
  try {
    $index = Get-Content $indexFile -Raw | ConvertFrom-Json
    if (-not $index.root_node) { $errors += "INVALID: No root_node in graph-index.json" }
    if (-not $index.nodes) { $errors += "INVALID: No nodes in graph-index.json" }

    # Validate edges reference existing nodes
    foreach ($edge in $index.edges) {
      if (-not $index.nodes.PSObject.Properties[$edge.source]) {
        $errors += "BROKEN EDGE: source '$($edge.source)' not found"
      }
      if (-not $index.nodes.PSObject.Properties[$edge.target]) {
        $errors += "BROKEN EDGE: target '$($edge.target)' not found"
      }
    }

    # Validate node files exist
    foreach ($prop in $index.nodes.PSObject.Properties) {
      $nodeFile = Join-Path $lhDir $prop.Value.file
      if (-not (Test-Path $nodeFile)) {
        $errors += "MISSING FILE: $($prop.Value.file) for node $($prop.Name)"
      }
    }
  } catch {
    $errors += "CORRUPT: graph-index.json is not valid JSON"
  }
}

# Check loop-state.json
if (-not (Test-Path $loopFile)) {
  $errors += "MISSING: loop-state.json"
} else {
  try {
    $loop = Get-Content $loopFile -Raw | ConvertFrom-Json
    if (-not $loop.loop) { $errors += "INVALID: No loop object in loop-state.json" }
    if (-not $loop.memory_queue) { $errors += "INVALID: No memory_queue in loop-state.json" }
  } catch {
    $errors += "CORRUPT: loop-state.json is not valid JSON"
  }
}

# Report
if ($errors.Count -eq 0) {
  Write-Host "VALID: All checks passed"
  Write-Host "  Graph: $($index.stats.total_nodes) nodes, $($index.stats.total_edges) edges"
  Write-Host "  Loop: $($loop.loop.status)"
  exit 0
} else {
  Write-Host "ERRORS FOUND: $($errors.Count)"
  foreach ($e in $errors) { Write-Host "  ! $e" }
  exit 1
}
