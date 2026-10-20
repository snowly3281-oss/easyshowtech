param(
  [switch]$CheckOnly,
  [string]$Message = ('Publish website ' + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$previousLocation = Get-Location

function Invoke-Checked {
  param([string]$Command, [string[]]$Arguments)
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Command failed (exit $LASTEXITCODE). Publishing stopped." }
}

try {
  Set-Location -LiteralPath $projectRoot
  $branch = (& git branch --show-current).Trim()
  if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') { throw 'Run this publisher from the main branch.' }
  $origin = (& git remote get-url origin).Trim()
  if ($origin -notmatch '^(?:git@github\.com:|https://github\.com/)([\w.-]+/[\w.-]+?)(?:\.git)?$') { throw 'The origin remote must be the intended GitHub repository.' }
  $repository = $Matches[1]
  $planText = & node scripts/release-plan.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the release files.' }
  $plan = $planText | ConvertFrom-Json
  if (@($plan.stagedOutside).Count -gt 0) { throw ('Unrelated files are already staged. Review the index first: ' + ($plan.stagedOutside -join ', ')) }
  Write-Host ('Website files selected: ' + @($plan.selected).Count)
  $plan.selected | ForEach-Object { Write-Host ('  ' + $_) }
  if (@($plan.excluded).Count -gt 0) {
    Write-Host ('Unrelated files left untouched: ' + @($plan.excluded).Count)
    $plan.excluded | ForEach-Object { Write-Host ('  skipped: ' + $_) }
  }
  if ($CheckOnly) { Write-Host 'Check completed. No commit, push or deployment was performed.'; exit 0 }

  Invoke-Checked 'git' @('fetch', 'origin', 'main')
  & git merge-base --is-ancestor origin/main HEAD
  if ($LASTEXITCODE -ne 0) { throw 'GitHub main has newer or divergent commits. Reconcile them before publishing; no reset or force push will be performed.' }
  Invoke-Checked 'npm.cmd' @('run', 'test:deployment')
  Invoke-Checked 'npm.cmd' @('run', 'content:check')
  Invoke-Checked 'npm.cmd' @('run', 'build')

  if (@($plan.selected).Count -gt 0) {
    Invoke-Checked 'git' (@('add', '--') + @($plan.selected))
    Invoke-Checked 'git' @('diff', '--cached', '--check')
    Invoke-Checked 'git' @('commit', '-m', $Message)
  }
  $commit = (& git rev-parse HEAD).Trim()
  Invoke-Checked 'git' @('push', 'origin', 'HEAD:main')
  Write-Host ('Waiting for GitHub to publish ' + $commit.Substring(0, 12) + '...')
  Invoke-Checked 'node' @('scripts/deployment.mjs', 'wait', $commit, $repository)
  Write-Host 'Published and verified: https://easyshowtech.com/' -ForegroundColor Green
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host 'An uploaded commit remains on GitHub if a later deployment step failed. See Actions for details; rerunning this publisher is safe.'
  exit 1
} finally {
  Set-Location -LiteralPath $previousLocation
}
