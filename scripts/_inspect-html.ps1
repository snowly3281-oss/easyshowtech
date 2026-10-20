$path = "e:\easyshow\agent-debug5.html"
$content = Get-Content $path -Raw

# Find section right BEFORE ps-layout
$idx = $content.IndexOf('class="ps-layout"')
Write-Host "ps-layout at offset $idx"
# Get 3000 chars BEFORE ps-layout
$start = [Math]::Max(0, $idx - 3000)
Write-Host "`n=== 3000 chars before ps-layout ==="
Write-Host $content.Substring($start, $idx - $start)