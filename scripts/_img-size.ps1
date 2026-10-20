Add-Type -AssemblyName System.Drawing
$path = 'c:\Users\ADMIN\AppData\Local\Temp\cursor\screenshots\page-2026-10-19T16-03-37-740Z.png'
$img = [System.Drawing.Image]::FromFile($path)
Write-Host ("size = {0} x {1}" -f $img.Width, $img.Height)
$img.Dispose()