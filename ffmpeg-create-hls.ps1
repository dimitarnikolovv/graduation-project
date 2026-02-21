param(
  [Parameter(Mandatory=$true)][string]$Input,
  [switch]$Single,
  [switch]$NoThumbs
)

$ErrorActionPreference = 'Stop'

# Resolve full paths
$InputFull = (Resolve-Path $Input).Path
$InputDir  = Split-Path -Parent $InputFull
$BaseName  = [IO.Path]::GetFileNameWithoutExtension($InputFull)
$OutDir    = Join-Path $InputDir "$BaseName-hls"
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# Helper for forward-slash path (ffmpeg is happier)
function AsUnix([string]$p) { return ($p -replace '\\','/') }

if ($Single) {
  Write-Host "🔹 Transcoding to single resolution (original size)..."
  $args = @(
    '-i', $InputFull,
    '-c:v','libx264','-preset','medium','-crf','22',
    '-c:a','aac','-b:a','128k',
    '-flags','+cgop','-g','30','-sc_threshold','0',
    '-f','hls','-hls_time','17','-hls_playlist_type','vod',
    '-hls_segment_filename', (Join-Path $OutDir 'output_%03d.ts'),
    (Join-Path $OutDir 'master.m3u8')
  )
  & ffmpeg @args
}
else {
  Write-Host "🔹 Transcoding to multiple resolutions (1080p, 720p, 480p)..."
  $outUnix = AsUnix $OutDir
  $args = @(
    '-i', $InputFull,
    '-filter_complex','[0:v]split=3[v1][v2][v3]; [v1]scale=w=1920:h=1080[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=854:h=480[v3out]',
    '-map','[v1out]','-map','a','-c:v:0','libx264','-preset','medium','-crf','21','-c:a:0','aac','-b:a:0','128k',
    '-map','[v2out]','-map','a','-c:v:1','libx264','-preset','medium','-crf','22','-c:a:1','aac','-b:a:1','128k',
    '-map','[v3out]','-map','a','-c:v:2','libx264','-preset','medium','-crf','23','-c:a:2','aac','-b:a:2','96k',
    '-flags','+cgop','-g','30','-sc_threshold','0',
    '-f','hls','-hls_time','17','-hls_playlist_type','vod',
    '-hls_segment_filename', "$outUnix/output_%v/output_%03d.ts",
    '-master_pl_name','master.m3u8',
    '-var_stream_map','v:0,a:0 v:1,a:1 v:2,a:2',
    "$outUnix/output_%v/playlist.m3u8"
  )
  & ffmpeg @args
}

if ($NoThumbs) {
  Write-Host "🔹 Skipping thumbnail generation."
  exit 0
}

# Thumbnails + VTT
$ThumbsDir = Join-Path $OutDir 'thumbnails'
New-Item -ItemType Directory -Path $ThumbsDir -Force | Out-Null

Write-Host "🖼️ Generating thumbnail sprites and .vtt..."
& ffmpeg -i $InputFull -vf 'fps=1/10,scale=160:-1' -q:v 5 -start_number 0 (Join-Path $ThumbsDir 'thumb_%03d.jpg')

$Vtt = Join-Path $OutDir 'thumbnails.vtt'
"WEBVTT`r`n`r`n" | Set-Content $Vtt -Encoding UTF8
$count = 0
Get-ChildItem $ThumbsDir -Filter 'thumb_*.jpg' | Sort-Object Name | ForEach-Object {
  $start = 10 * $count
  $end   = 10 * ($count + 1)
  $line  = "{0:00}:{1:00}.000 --> {2:00}:{3:00}.000`r`nthumbnails/thumb_{4:000}.jpg`r`n`r`n" -f `
           [int]($start/60), ($start%60), [int]($end/60), ($end%60), $count
  Add-Content -Path $Vtt -Value $line -Encoding UTF8 -NoNewline
  $count++
}