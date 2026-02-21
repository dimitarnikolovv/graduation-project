# USAGE: 
# 1 - chmod +x ffmpeg-create-hls.sh
# 2 - ./ffmpeg-create-hls.sh path/to/video.mp4 [--single] [--no-thumbs]

# Generate HLS (HTTP Live Streaming) segments and playlists
# By default, it creates multiple resolutions (1080p, 720p, 480p)
# You can specify --single to create a single resolution variant, maintaining the original input size.

# By default it generates thumbnails for each segment.
# You can specify --no-thumbs to skip thumbnail generation.


INPUT="$1" # Input video file (e.g. video_1.mp4)
MODE="$2" # Optional: --single
NO_THUMBS="$3" # Optional: --no-thumbs

if [ -z "$INPUT" ]; then
  echo "❌ Usage: ./ffmpeg-create-hls.sh path/to/video.mp4 [--single] [--no-thumbs]"
  exit 1
fi

# Strip extension and path to get base name
BASENAME=$(basename "$INPUT")
NAME="${BASENAME%.*}"
INPUT_DIR="$(cd "$(dirname "$INPUT")" && pwd)"

# Root output folder (same as input name without extension)
OUTDIR="${INPUT_DIR}/${NAME}-hls"

mkdir -p "$OUTDIR"

if [ "$MODE" == "--single" ]; then
 echo "🔹 Transcoding to single resolution (original input size)..."

 ffmpeg -i "$INPUT" \
  -c:v libx264 -preset medium -crf 22 \
  -c:a aac -b:a 128k \
  -flags +cgop -g 30 -sc_threshold 0 \
  -f hls \
  -hls_time 17 \
  -hls_playlist_type vod \
  -hls_segment_filename "${OUTDIR}/output_%03d.ts" \
  "${OUTDIR}/master.m3u8"

else

 echo "🔹 Transcoding to multiple resolutions (1080p, 720p, 480p)..."

 ffmpeg -i "$INPUT" \
  -filter_complex '[0:v]split=3[v1][v2][v3]; [v1]scale=w=1920:h=1080[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=854:h=480[v3out]' \
  -map '[v1out]' -map a -c:v:0 libx264 -preset medium -crf 21 -c:a:0 aac -b:a:0 128k \
  -map '[v2out]' -map a -c:v:1 libx264 -preset medium -crf 22 -c:a:1 aac -b:a:1 128k \
  -map '[v3out]' -map a -c:v:2 libx264 -preset medium -crf 23 -c:a:2 aac -b:a:2 96k \
  -flags +cgop -g 30 -sc_threshold 0 \
  -f hls \
  -hls_time 17 \
  -hls_playlist_type vod \
  -hls_segment_filename "${OUTDIR}/output_%v/output_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map 'v:0,a:0 v:1,a:1 v:2,a:2' \
  "${OUTDIR}/output_%v/playlist.m3u8"
fi


if [ "$NO_THUMBS" == "--no-thumbs" ]; then
  echo "🔹 Skipping thumbnail generation as per --no-thumbs option."
  exit 0
fi

# Generate VTT sprite thumbnails
THUMBS_DIR="${OUTDIR}/thumbnails"
mkdir -p "$THUMBS_DIR"

echo "🖼️ Generating thumbnail sprites and .vtt file..."

ffmpeg -i "$INPUT" -vf "fps=1/10,scale=160:-1" -q:v 5 -start_number 0 "$THUMBS_DIR/thumb_%03d.jpg"

# Generate .vtt file in the root directory
VTT_FILE="${OUTDIR}/thumbnails.vtt"
> "$VTT_FILE"

count=0

for img in "$THUMBS_DIR"/thumb_*.jpg; do
  start=$((count * 10))
  end=$(((count + 1) * 10))
  printf "WEBVTT\n\n%02d:%02d.000 --> %02d:%02d.000\nthumbnails/thumb_%03d.jpg\n\n" \
    $((start / 60)) $((start % 60)) \
    $((end / 60)) $((end % 60)) \
    $count >> "$VTT_FILE"
  count=$((count + 1))
done