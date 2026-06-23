Add-Type -AssemblyName System.Drawing

function Resize-Icon {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$size
    )
    
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.DrawImage($img, 0, 0, $size, $size)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gfx.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

# Resize admin-pwa icons
$source = "apps\admin-pwa\public\icons\icon-192x192.png"
$sizes = @(72, 96, 128, 144, 152, 384, 512)
foreach ($size in $sizes) {
    $dest = "apps\admin-pwa\public\icons\icon-${size}x${size}.png"
    Resize-Icon -sourcePath $source -destPath $dest -size $size
    Write-Output "Resized admin-pwa icon to ${size}x${size}"
}

# Resize client-pwa icons
$source = "apps\client-pwa\public\icons\icon-192x192.png"
$sizes = @(72, 96, 128, 144, 152, 384, 512)
foreach ($size in $sizes) {
    $dest = "apps\client-pwa\public\icons\icon-${size}x${size}.png"
    Resize-Icon -sourcePath $source -destPath $dest -size $size
    Write-Output "Resized client-pwa icon to ${size}x${size}"
}

# Resize driver-pwa icons
$source = "apps\driver-pwa\public\icons\icon-192x192.png"
$sizes = @(72, 96, 128, 144, 152, 384, 512)
foreach ($size in $sizes) {
    $dest = "apps\driver-pwa\public\icons\icon-${size}x${size}.png"
    Resize-Icon -sourcePath $source -destPath $dest -size $size
    Write-Output "Resized driver-pwa icon to ${size}x${size}"
}

Write-Output "All icons resized successfully"

# Resize public folder icons for admin-pwa
$source = "apps\admin-pwa\public\icons\icon-192x192.png"
Resize-Icon -sourcePath $source -destPath "apps\admin-pwa\public\android-chrome-192x192.png" -size 192
Resize-Icon -sourcePath $source -destPath "apps\admin-pwa\public\android-chrome-512x512.png" -size 512
Resize-Icon -sourcePath $source -destPath "apps\admin-pwa\public\apple-touch-icon.png" -size 192
Resize-Icon -sourcePath $source -destPath "apps\admin-pwa\public\favicon-16x16.png" -size 16
Resize-Icon -sourcePath $source -destPath "apps\admin-pwa\public\favicon-32x32.png" -size 32
Resize-Icon -sourcePath $source -destPath "apps\admin-pwa\public\icon.png" -size 192

# Resize public folder icons for client-pwa
$source = "apps\client-pwa\public\icons\icon-192x192.png"
Resize-Icon -sourcePath $source -destPath "apps\client-pwa\public\android-chrome-192x192.png" -size 192
Resize-Icon -sourcePath $source -destPath "apps\client-pwa\public\android-chrome-512x512.png" -size 512
Resize-Icon -sourcePath $source -destPath "apps\client-pwa\public\apple-touch-icon.png" -size 192
Resize-Icon -sourcePath $source -destPath "apps\client-pwa\public\favicon-16x16.png" -size 16
Resize-Icon -sourcePath $source -destPath "apps\client-pwa\public\favicon-32x32.png" -size 32
Resize-Icon -sourcePath $source -destPath "apps\client-pwa\public\icon.png" -size 192

# Resize public folder icons for driver-pwa
$source = "apps\driver-pwa\public\icons\icon-192x192.png"
Resize-Icon -sourcePath $source -destPath "apps\driver-pwa\public\android-chrome-192x192.png" -size 192
Resize-Icon -sourcePath $source -destPath "apps\driver-pwa\public\android-chrome-512x512.png" -size 512
Resize-Icon -sourcePath $source -destPath "apps\driver-pwa\public\apple-touch-icon.png" -size 192
Resize-Icon -sourcePath $source -destPath "apps\driver-pwa\public\favicon-16x16.png" -size 16
Resize-Icon -sourcePath $source -destPath "apps\driver-pwa\public\favicon-32x32.png" -size 32
Resize-Icon -sourcePath $source -destPath "apps\driver-pwa\public\icon.png" -size 192

Write-Output "All public folder icons resized successfully"
