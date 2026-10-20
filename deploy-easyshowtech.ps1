# Compatibility entry: one GitHub release pipeline handles both deployments.
& (Join-Path $PSScriptRoot 'scripts\publish-site.ps1') @args
exit $LASTEXITCODE
