param(
  [string]$Path = (Get-Location).Path
)

$lhDir = Join-Path $Path ".long-horizon"
$brainDir = Join-Path $lhDir "brain"

# Create directory structure
$dirs = @(
  $lhDir,
  (Join-Path $brainDir "decisions"),
  (Join-Path $brainDir "lessons"),
  (Join-Path $brainDir "patterns"),
  (Join-Path $brainDir "tasks"),
  (Join-Path $brainDir "milestones"),
  (Join-Path $brainDir "context"),
  (Join-Path $lhDir "sessions")
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Generate root node ID
$hash = -join ((48..57) + (97..102) | Get-Random -Count 6 | ForEach-Object { [char]$_ })
$date = Get-Date -Format 'yyyyMMdd'
$rootId = "context-$date-$hash"
$now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
$projectName = Split-Path $Path -Leaf

# Create root node file
$rootNode = @"
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

# $projectName — Root Node

## Content

This is the root node of the $projectName project graph. All knowledge connects back here.

## Context

Initialized by Long-Horizon v2. This node is the "main dot" — the center of the knowledge web.

## Backlinks

<!-- All top-level nodes link back here -->
"@

$rootNode | Set-Content -Path (Join-Path $brainDir "context\$rootId.md") -Encoding UTF8

# Create graph-index.json
$graphIndex = @"
{
  "version": "2.0",
  "root_node": "$rootId",
  "nodes": {
    "$rootId": {
      "type": "context",
      "title": "$projectName — Root Node",
      "file": "brain/context/$rootId.md",
      "edges_out": [],
      "edges_in": [],
      "tags": ["root", "project"],
      "weight": 1.0
    }
  },
  "edges": [],
  "stats": {
    "total_nodes": 1,
    "total_edges": 0,
    "last_updated": "$now"
  }
}
"@

$graphIndex | Set-Content -Path (Join-Path $brainDir "graph-index.json") -Encoding UTF8

# Create loop-state.json
$loopState = @"
{
  "version": "2.0",
  "loop": {
    "status": "idle",
    "task_id": null,
    "task_description": null,
    "started_at": null,
    "iteration": 0,
    "max_iterations": 100,
    "subtasks": [],
    "completed_subtasks": [],
    "blocked_subtasks": [],
    "completion_criteria": [],
    "completion_pct": 0,
    "last_action": null,
    "last_action_at": null,
    "errors": [],
    "should_continue": true
  },
  "memory_queue": {
    "pending_nodes": [],
    "pending_edges": []
  }
}
"@

$loopState | Set-Content -Path (Join-Path $lhDir "loop-state.json") -Encoding UTF8

# Create config.json
$config = @"
{
  "version": "2.0",
  "loop": {
    "max_iterations": 100,
    "memory_flush_interval": 3,
    "max_retries_per_subtask": 3,
    "auto_compact_threshold_pct": 80
  },
  "graph": {
    "max_traversal_depth": 3,
    "context_nodes_limit": 10,
    "auto_backlink": true
  },
  "validation": {
    "enabled": true,
    "test_command": "",
    "lint_command": ""
  },
  "git": {
    "auto_commit": true,
    "commit_on_milestone": true
  }
}
"@

$config | Set-Content -Path (Join-Path $lhDir "config.json") -Encoding UTF8

Write-Host "Long-Horizon v2 initialized at: $lhDir"
Write-Host "Root node: $rootId"
Write-Host "Graph brain ready. Loop state: idle."
Write-Host ""
Write-Host "Give the AI a task and it will self-execute until done."
