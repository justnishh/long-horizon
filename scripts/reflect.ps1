param(
  [string]$Path = (Get-Location).Path
)

$lhDir = Join-Path $Path ".long-horizon"
$brainDir = Join-Path $lhDir "brain"
$indexFile = Join-Path $brainDir "graph-index.json"

if (-not (Test-Path $indexFile)) {
  Write-Error "No graph-index.json found. Run /lh init first."
  exit 1
}

$index = Get-Content $indexFile -Raw | ConvertFrom-Json
$now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'

# Count by type
$types = @{}
$tagFreq = @{}
$orphans = @()

foreach ($prop in $index.nodes.PSObject.Properties) {
  $node = $prop.Value
  $t = $node.type
  if (-not $types[$t]) { $types[$t] = 0 }
  $types[$t]++

  foreach ($tag in $node.tags) {
    if (-not $tagFreq[$tag]) { $tagFreq[$tag] = 0 }
    $tagFreq[$tag]++
  }

  # Find orphans (no edges in or out, except root)
  if ($prop.Name -ne $index.root_node) {
    if ($node.edges_out.Count -eq 0 -and $node.edges_in.Count -eq 0) {
      $orphans += $prop.Name
    }
  }
}

# Find most connected nodes
$connectivity = @()
foreach ($prop in $index.nodes.PSObject.Properties) {
  $node = $prop.Value
  $connections = $node.edges_out.Count + $node.edges_in.Count
  $connectivity += @{ id = $prop.Name; title = $node.title; connections = $connections }
}
$hubs = $connectivity | Sort-Object { $_.connections } -Descending | Select-Object -First 5

# Write reflection
$reflectFile = Join-Path $brainDir "lessons" "reflect-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"

$typeReport = ($types.GetEnumerator() | ForEach-Object { "- $($_.Key): $($_.Value)" }) -join "`n"
$tagReport = ($tagFreq.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object { "- $($_.Key): $($_.Value)" }) -join "`n"
$hubReport = ($hubs | ForEach-Object { "- [$($_.id)] $($_.title) ($($_.connections) connections)" }) -join "`n"
$orphanReport = if ($orphans.Count -gt 0) { ($orphans | ForEach-Object { "- $_" }) -join "`n" } else { "- None" }

$reflection = @"
---
id: "lesson-$(Get-Date -Format 'yyyyMMdd')-reflect"
type: "lesson"
created: "$now"
updated: "$now"
status: "active"
edges:
  - target: "$($index.root_node)"
    relation: "related"
tags: ["reflection", "meta"]
weight: 0.5
---

# Graph Reflection — $(Get-Date -Format 'yyyy-MM-dd')

## Graph Health

Nodes: $($index.stats.total_nodes) | Edges: $($index.stats.total_edges)

### By Type
$typeReport

### Top Tags
$tagReport

### Hub Nodes (most connected)
$hubReport

### Orphan Nodes (disconnected)
$orphanReport

## Recommendations

$(if ($orphans.Count -gt 0) { "- Connect orphan nodes to related knowledge" })
$(if ($index.stats.total_edges -lt $index.stats.total_nodes) { "- Graph is sparse — look for missing connections between related nodes" })
$(if ($types["lesson"] -gt 5) { "- Many lessons accumulated — consider extracting patterns" })
"@

$reflection | Set-Content -Path $reflectFile -Encoding UTF8
Write-Host "=== Graph Reflection ==="
Write-Host "Nodes: $($index.stats.total_nodes) | Edges: $($index.stats.total_edges)"
Write-Host ""
Write-Host "By type:"
$types.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" }
Write-Host ""
Write-Host "Hubs:"
$hubs | ForEach-Object { Write-Host "  $($_.title) ($($_.connections) connections)" }
Write-Host ""
if ($orphans.Count -gt 0) { Write-Host "Orphans: $($orphans.Count) disconnected nodes" }
Write-Host "Reflection saved: $reflectFile"
