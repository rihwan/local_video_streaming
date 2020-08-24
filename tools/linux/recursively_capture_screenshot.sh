#/bin/sh

SAVEIFS=$IFS
IFS=$(echo "\r\n\b")

SEARCH_DIRECTORY="$1"

x=$(find "$SEARCH_DIRECTORY" -type f -name "*.mp4")
for f in $x;
do
  echo "Process $f"
  base_dir=$(dirname $f)
  filename=$(basename $f)
  echo "Dir $base_dir $filename"
  mkdir -p "$base_dir/screenshots"
  video_length=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  half_length=$(printf '%d\n' "$video_length")
  half_length=$(expr $half_length / 2)
  echo "Video Length $video_length $half_length"

  if [ $half_length -gt 60 ]
  then
    ffmpeg -y -hide_banner -loglevel error -ss 00:01:00 -i $f -vframes 1 -q:v 1 $base_dir/screenshots/$filename.jpg
    echo "Capturing at 00h:01m:00s $base_dir/screenshots/$filename.jpg"
  else
    if [ $half_length -gt 30 ]
    then
      ffmpeg -y -hide_banner -loglevel error -ss 00:00:30 -i $f -vframes 1 -q:v 1 $base_dir/screenshots/$filename.jpg
      echo "Capturing at 00h:00m:30s $base_dir/screenshots/$filename.jpg"
    else
      if [ $half_length -gt 10 ]
      then
        ffmpeg -y -hide_banner -loglevel error -ss 00:00:10 -i $f -vframes 1 -q:v 1 $base_dir/screenshots/$filename.jpg
        echo "Capturing at 00h:00m:10s $base_dir/screenshots/$filename.jpg"
      else
        ffmpeg -y -hide_banner -loglevel error -ss 00:00:00.100 -i $f -vframes 1 -q:v 1 $base_dir/screenshots/$filename.jpg
        echo "Capturing at 00h:00m:00.1s $base_dir/screenshots/$filename.jpg"
      fi
    fi
  fi
done

IFS=$SAVEIFS