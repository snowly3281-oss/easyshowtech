$ErrorActionPreference = "Continue"
try {
  $r = Invoke-WebRequest 'http://localhost:4321/_debug-pdf' -UseBasicParsing -TimeoutSec 30
  Write-Host $r.Content
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
    Write-Host $reader.ReadToEnd()
  }
}