param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("start", "iterate", "complete-subtask", "block", "finalize", "status")]
  [string]$Action,

  [string]$Path = (Get-Location).Path,
  [string]$TaskDescription,
  [string]$Subtasks,
  [string]$Criteria,
  [int]$SubtaskId,
  [string]$LastAction
)

$lhDir = Join-Path $Path ".long-horizon"
$loopFile = Join-Path $lhDir "loop-state.json"

if (-not (Test-Path $loopFile)) {
  Write-Error "No loop-state.json found. Run /lh init first."
  exit 1
}

$state = Get-Content $loopFile -Raw | ConvertFrom-Json

function Save-State {
  $state | ConvertTo-Json -Depth 10 | Set-Content $loopFile -Encoding UTF8
}

switch ($Action) {
  "start" {
    if (-not $TaskDescription) {
      Write-Error "Required: -TaskDescription"
      exit 1
    }

    $hash = -join ((48..57) + (97..102) | Get-Random -Count 6 | ForEach-Object { [char]$_ })
    $date = Get-Date -Format 'yyyyMMdd'
    $taskId = "task-$date-$hash"
    $now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'

    $subtaskList = @()
    if ($Subtasks) {
      $i = 1
      foreach ($s in ($Subtasks -split "`n" | Where-Object { $_.Trim() })) {
        $subtaskList += @{ id = $i; description = $s.Trim(); status = "pending" }
        $i++
      }
    }

    $criteriaList = @()
    if ($Criteria) {
      $criteriaList = $Criteria -split "`n" | Where-Object { $_.Trim() } | ForEach-Object { $_.Trim() }
    }

    $state.loop.status = "running"
    $state.loop.task_id = $taskId
    $state.loop.task_description = $TaskDescription
    $state.loop.started_at = $now
    $state.loop.iteration = 0
    $state.loop.subtasks = $subtaskList
    $state.loop.completed_subtasks = @()
    $state.loop.blocked_subtasks = @()
    $state.loop.completion_criteria = $criteriaList
    $state.loop.completion_pct = 0
    $state.loop.errors = @()
    $state.loop.should_continue = $true

    Save-State
    Write-Host "Loop started: $taskId"
    Write-Host "Task: $TaskDescription"
    Write-Host "Subtasks: $($subtaskList.Count)"
  }

  "iterate" {
    $state.loop.iteration++
    $now = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'
    $state.loop.last_action_at = $now
    if ($LastAction) { $state.loop.last_action = $LastAction }

    # Calculate completion
    $total = $state.loop.subtasks.Count
    $done = $state.loop.completed_subtasks.Count
    if ($total -gt 0) {
      $state.loop.completion_pct = [math]::Round(($done / $total) * 100)
    }

    Save-State
    Write-Host "Iteration: $($state.loop.iteration) | Completion: $($state.loop.completion_pct)%"
  }

  "complete-subtask" {
    if (-not $SubtaskId) {
      Write-Error "Required: -SubtaskId"
      exit 1
    }

    foreach ($st in $state.loop.subtasks) {
      if ($st.id -eq $SubtaskId) {
        $st.status = "done"
      }
    }
    $state.loop.completed_subtasks += $SubtaskId

    $total = $state.loop.subtasks.Count
    $done = $state.loop.completed_subtasks.Count
    if ($total -gt 0) {
      $state.loop.completion_pct = [math]::Round(($done / $total) * 100)
    }

    if ($done -eq $total) {
      $state.loop.should_continue = $false
      $state.loop.status = "complete"
    }

    Save-State
    Write-Host "Subtask $SubtaskId complete. Progress: $done/$total ($($state.loop.completion_pct)%)"
  }

  "block" {
    if (-not $SubtaskId) {
      Write-Error "Required: -SubtaskId"
      exit 1
    }

    foreach ($st in $state.loop.subtasks) {
      if ($st.id -eq $SubtaskId) {
        $st.status = "blocked"
      }
    }
    $state.loop.blocked_subtasks += $SubtaskId

    # Check if all remaining are blocked
    $pending = $state.loop.subtasks | Where-Object { $_.status -eq "pending" }
    if ($pending.Count -eq 0) {
      $state.loop.should_continue = $false
      $state.loop.status = "blocked"
    }

    Save-State
    Write-Host "Subtask $SubtaskId blocked."
  }

  "finalize" {
    $state.loop.status = "complete"
    $state.loop.should_continue = $false
    $state.loop.completion_pct = 100
    Save-State
    Write-Host "Loop finalized. Task complete."
  }

  "status" {
    Write-Host "=== Loop Status ==="
    Write-Host "Status: $($state.loop.status)"
    Write-Host "Task: $($state.loop.task_description)"
    Write-Host "Iteration: $($state.loop.iteration)"
    Write-Host "Completion: $($state.loop.completion_pct)%"
    Write-Host ""
    Write-Host "Subtasks:"
    foreach ($st in $state.loop.subtasks) {
      $icon = switch ($st.status) { "done" { "[x]" } "blocked" { "[!]" } default { "[ ]" } }
      Write-Host "  $icon #$($st.id): $($st.description)"
    }
    Write-Host ""
    Write-Host "Memory queue: $($state.memory_queue.pending_nodes.Count) nodes, $($state.memory_queue.pending_edges.Count) edges pending"
  }
}
