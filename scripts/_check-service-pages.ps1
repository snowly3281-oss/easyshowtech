$slugs = @('custom-fabric-printing','dye-sublimation-printing','custom-logo-printing','large-format-printing','artwork-design-setup')
foreach ($s in $slugs) {
  $u = "http://localhost:4321/printing-services/$s"
  $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 15
  $b = $r.Content
  # extract the hero img tag's src + width/height
  $m = [regex]::Match($b, '<img\s+src="([^"]+)"[^>]+width="(\d+)"[^>]+height="(\d+)"')
  if ($m.Success) {
    $src = $m.Groups[1].Value
    Write-Host "$s -> $src"
  } else {
    Write-Host "$s -> (no hero img)"
  }
}