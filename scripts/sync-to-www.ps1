# Sync root app files to www/ (desktop + deployment copy)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$www = Join-Path $root 'www'

$files = @(
    'index.html',
    'sw.js',
    'css/style.css',
    'css/belding-theme.css',
    'css/mobile-native.css',
    'js/app.js',
    'js/payments-table.js',
    'js/payment-sync.js',
    'js/tenant-hub.js',
    'js/tenant-unified-ui.js',
    'js/mobile.js'
)

foreach ($f in $files) {
    $src = Join-Path $root $f
    $dst = Join-Path $www $f
    if (Test-Path $src) {
        $dir = Split-Path $dst -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $src $dst -Force
        Write-Host "Synced $f"
    }
}

Write-Host 'Done.'
