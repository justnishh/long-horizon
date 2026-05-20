param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("add-node", "add-edge", "show", "traverse", "stats")]
  [string]$Action,

  [string]$Path = (Get-Location).Path,
  [string]$Type,
  [string]$Title,
  [string]$Content,
  [string]$Tags,
  [string]$ConnectTo,
  [string]$Relation,
  [string]$NodeId,
  [int]$Depth = 2
)

$lhDir = Join-Path $Path ".long-horizon"
$brainDir = Join-Path $lhDir "brain"
$indexFile = Join-Path $brainDir "graph-index.json"

if (-not (Test-Path $indexFile)) {
  Write-Error "No graph-index.json found. Run /lh init first."
  exit 1
}

$index = Get-Content $indexFile -Raw | ConvertFrom-Json

function New-NodeId($type) {
  $hash = -join ((48..57) + (97..102) | Get-Random -Count 6 | ForEach-Object { [char]$_ })
  $date = Get-Date -Format 'yyyyMMdd'
  return "$type-$date-$hash"
}

switch ($Action) {
  "add-node" {
    if (-not $Type -or -not $Title) {
      Write-Error "Required: -Type and -Title"
      exit 1
    }

    $id = New-NodeId $Type
    $now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
    $tagList = if ($Tags) { $Tags -split "," | ForEach-Object { $_.Trim() } } else { @() }
    $tagsYaml = ($tagList | ForEach-Object { "`"$_`"" }) -join ", "

    $edgesYaml = ""
    if ($ConnectTo -and $Relation) {
      $edgesYaml = @"

  - target: "$ConnectTo"
    relation: "$Relation"
"@
    }

    $nodeContent = @"
---
id: "$id"
type: "$Type"
created: "$now"
updated: "$now"
status: "active"
edges:$edgesYaml
tags: [$tagsYaml]
weight: 0.7
---

# $Title

## Content

$Content

## Context

Created during autonomous loop execution.

## Backlinks

"@

    $dir = Join-Path $brainDir "${Type}s"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $nodeContent | Set-Content -Path (Join-Path $dir "$id.md") -Encoding UTF8

    # Update graph index
    $nodeEntry = @{
      type = $Type
      title = $Title
      file = "brain/${Type}s/$id.md"
      edges_out = @()
      edges_in = @()
      tags = $tagList
      weight = 0.7
    }

    if ($ConnectTo -and $Relation) {
      $nodeEntry.edges_out = @($ConnectTo)
      # Add edge
      $edge = @{ source = $id; target = $ConnectTo; relation = $Relation }
      $index.edges += $edge
      # Update target's edges_in
      if ($index.nodes.PSObject.Properties[$ConnectTo]) {
        $index.nodes.$ConnectTo.edges_in += $id
      }
    }

    $index.nodes | Add-Member -NotePropertyName $id -NotePropertyValue $nodeEntry
    $index.stats.total_nodes += 1
    $index.stats.total_edges += $(if ($ConnectTo) { 1 } else { 0 })
    $index.stats.last_updated = $now

    $index | ConvertTo-Json -Depth 10 | Set-Content $indexFile -Encoding UTF8
    Write-Host "Node created: $id"
    Write-Host "Type: $Type | Title: $Title"
    if ($ConnectTo) { Write-Host "Edge: $id →[$Relation]→ $ConnectTo" }
  }

  "add-edge" {
    if (-not $NodeId -or -not $ConnectTo -or -not $Relation) {
      Write-Error "Required: -NodeId, -ConnectTo, -Relation"
      exit 1
    }

    $now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
    $edge = @{ source = $NodeId; target = $ConnectTo; relation = $Relation }
    $index.edges += $edge

    if ($index.nodes.PSObject.Properties[$NodeId]) {
      $index.nodes.$NodeId.edges_out += $ConnectTo
    }
    if ($index.nodes.PSObject.Properties[$ConnectTo]) {
      $index.nodes.$ConnectTo.edges_in += $NodeId
    }

    $index.stats.total_edges += 1
    $index.stats.last_updated = $now
    $index | ConvertTo-Json -Depth 10 | Set-Content $indexFile -Encoding UTF8
    Write-Host "Edge added: $NodeId →[$Relation]→ $ConnectTo"
  }

  "show" {
    if ($NodeId) {
      if ($index.nodes.PSObject.Properties[$NodeId]) {
        $node = $index.nodes.$NodeId
        Write-Host "[$NodeId]"
        Write-Host "  Type: $($node.type)"
        Write-Host "  Title: $($node.title)"
        Write-Host "  Tags: $($node.tags -join ', ')"
        Write-Host "  Edges out: $($node.edges_out -join ', ')"
        Write-Host "  Edges in: $($node.edges_in -join ', ')"
      } else {
        Write-Error "Node not found: $NodeId"
      }
    } else {
      Write-Host "=== GRAPH: $($index.stats.total_nodes) nodes, $($index.stats.total_edges) edges ==="
      Write-Host "Root: $($index.root_node)"
      Write-Host ""
      foreach ($prop in $index.nodes.PSObject.Properties) {
        $n = $prop.Value
        Write-Host "  [$($prop.Name)] $($n.type): $($n.title)"
      }
    }
  }

  "traverse" {
    if (-not $NodeId) { $NodeId = $index.root_node }
    $visited = @{}
    $queue = @(@{ id = $NodeId; depth = 0 })

    while ($queue.Count -gt 0) {
      $current = $queue[0]
      $queue = $queue[1..($queue.Count)]

      if ($visited[$current.id] -or $current.depth -gt $Depth) { continue }
      $visited[$current.id] = $true

      $indent = "  " * $current.depth
      $node = $index.nodes.($current.id)
      if ($node) {
        Write-Host "${indent}[$($current.id)] $($node.title)"
        foreach ($out in $node.edges_out) {
          $queue += @{ id = $out; depth = $current.depth + 1 }
        }
      }
    }
  }

  "stats" {
    $types = @{}
    foreach ($prop in $index.nodes.PSObject.Properties) {
      $t = $prop.Value.type
      if (-not $types[$t]) { $types[$t] = 0 }
      $types[$t]++
    }
    Write-Host "=== Graph Stats ==="
    Write-Host "Total nodes: $($index.stats.total_nodes)"
    Write-Host "Total edges: $($index.stats.total_edges)"
    Write-Host "Last updated: $($index.stats.last_updated)"
    Write-Host ""
    Write-Host "By type:"
    foreach ($t in $types.Keys) {
      Write-Host "  $t: $($types[$t])"
    }
  }
}
