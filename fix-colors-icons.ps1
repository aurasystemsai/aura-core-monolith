Set-Location "c:\Users\darre\OneDrive\Desktop\aura-core-monolith-main\aura-console\src"
$files = Get-ChildItem -Recurse -Include "*.jsx","*.js","*.css" | Select-Object -ExpandProperty FullName
$emojiCount = 0
$colorCount = 0

# Color brightening map: old -> new (shift everything lighter)
$colorMap = @{
    '#0a0a0a' = '#141414'
    '#0d0d0d' = '#181818'
    '#111111' = '#1c1c1c'
    '#161616' = '#212121'
    '#181818' = '#242424'
    '#1a1a1a' = '#262626'
    '#1c1c1c' = '#282828'
    '#1e1e1e' = '#2e2e2e'
    '#202020' = '#2a2a2a'
    '#222222' = '#303030'
    '#232323' = '#313131'
    '#242424' = '#323232'
    '#262626' = '#343434'
    '#282828' = '#363636'
    '#2a2a2a' = '#383838'
    '#2e2e2e' = '#3a3a3a'
    '#303030' = '#3c3c3c'
    '#333333' = '#404040'
    '#3a3a3a' = '#464646'
    '#404040' = '#4a4a4a'
    '#444444' = '#555555'
    '#555555' = '#666666'
    '#666666' = '#777777'
    '#888888' = '#9a9a9a'
    '#999999' = '#aaaaaa'
    '#aaaaaa' = '#bbbbbb'
}

foreach ($f in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($f)
    $c = [System.Text.Encoding]::UTF8.GetString($bytes)
    $orig = $c

    # Remove surrogate-pair emoji (U+1F000+ like face/object emoji)
    $c = [System.Text.RegularExpressions.Regex]::Replace($c, '[\uD800-\uDBFF][\uDC00-\uDFFF]', '')
    # Remove BMP symbol/emoji blocks (arrows, symbols, dingbats, misc symbols)
    $c = [System.Text.RegularExpressions.Regex]::Replace($c, '[\u2300-\u27BF\u2B00-\u2BFF]', '')
    # Remove empty icon wrapper divs: <div style={{ fontSize: NNpx }}>  </div> (now just whitespace after emoji removed)
    $c = [System.Text.RegularExpressions.Regex]::Replace($c, '<div\s+style=\{\{\s*fontSize\s*:\s*\d+[^}]*\}\}>\s*</div>', '')
    # Clean up lone whitespace in JSX text nodes left by emoji removal
    $c = [System.Text.RegularExpressions.Regex]::Replace($c, '>\s{1,4}([A-Z])', '>$1')

    if ($c -ne $orig) { $emojiCount++ }

    # Brighten colors
    foreach ($old in $colorMap.Keys) {
        $new = $colorMap[$old]
        if ($c.Contains($old)) {
            $c = $c.Replace($old, $new)
            $colorCount++
        }
    }

    if ($c -ne $orig) {
        [System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
    }
}

Write-Host "Emoji stripped from $emojiCount files, color replacements: $colorCount"
