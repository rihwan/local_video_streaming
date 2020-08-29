import glob
import math
import os
import subprocess
import sys

# ffmpeg -y -hide_banner -loglevel error -ss 00:02:00 -i "%CURR_DIR%\%CURR_FILE%" -vframes 1 -q:v 1 "%CURR_DIR%\screenshots\%CURR_FILE%.jpg"

def get_time_string(video_length):
  secs = video_length % 60.0
  secs_int = int(secs)
  secs_rem = int((secs - secs_int) * 1000.0)
  mins = (video_length - secs) / 60.0
  hours = int(mins / 60.0)
  mins = int(mins % 60.0)

  if hours > 3:
    hours = 3
  s = "{:02d}:{:02d}:{:02d}.{:03d}".format(hours, mins, secs_int, secs_rem)
  return s

if __name__ == '__main__':
  target_dir = sys.argv[1]
  for filepath in glob.iglob(target_dir + '/**', recursive=True):
    if os.path.isfile(filepath):
      _, ext = os.path.splitext(filepath)
      if ext == '.mp4' or ext == '.mov':
        base_dir, filename = os.path.split(filepath)
        screenshot_dir = os.path.join(base_dir, 'screenshots')
        target_image_file = os.path.join(screenshot_dir, filename) + '.jpg'
        if os.path.exists(target_image_file):
          continue

        out = subprocess.Popen(
          ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
           '-of', 'default=noprint_wrappers=1:nokey=1',
           filepath],
          stdout=subprocess.PIPE,
          stderr=subprocess.STDOUT)
        stdout, _ = out.communicate()
        video_length = float(stdout.decode('utf-8'))
        half_time_str = get_time_string(video_length / 2.0)
        print('Processing: ' + filepath + ' in time: ' + half_time_str)

        if not os.path.exists(screenshot_dir):
          print('Make Dir: ' + screenshot_dir)
          os.makedirs(screenshot_dir)
        
        print(target_image_file)
        out = subprocess.Popen(
          ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss',
           half_time_str, '-i', filepath, '-vframes', '1', '-q:v', '1',
           target_image_file],
          stdout=subprocess.PIPE,
          stderr=subprocess.STDOUT)
        out.communicate()
