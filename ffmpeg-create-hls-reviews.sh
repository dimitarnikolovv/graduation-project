# Generate HLS (HTTP Live Streaming) segments and playlists
# By default it generates thumbnails for each segment.
# You can specify --no-thumbs to skip thumbnail generation.


INPUT="$1" # Input video file (e.g. video_1.mp4)
NO_THUMBS="$3" # Optional: --no-thumbs

if [ -z "$INPUT" ]; then
  echo "❌ Usage: ./ffmpeg-create-hls.sh path/to/video.mp4"
  exit 1
fi

# Strip extension and path to get base name
BASENAME=$(basename "$INPUT")
NAME="${BASENAME%.*}"
INPUT_DIR="$(cd "$(dirname "$INPUT")" && pwd)"

# Root output folder (same as input name without extension)
OUTDIR="${INPUT_DIR}/${NAME}-hls"

mkdir -p "$OUTDIR"


echo "🔹 Transcoding to single resolution (original input size)..."

ffmpeg -i "$INPUT" \
  -c:v libx264 -preset medium -crf 22 \
  -c:a aac -b:a 128k \
  -flags +cgop -g 30 -sc_threshold 0 \
  -f hls \
  -hls_time 8 \
  -hls_playlist_type vod \
  -hls_segment_filename "${OUTDIR}/output_%03d.m2ts" \
  "${OUTDIR}/master.m3u8"


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