@echo off
SETLOCAL

set BASE_DIR=%~1
set CURR_DIR=%~2
set CURR_FILE=%~3

rem echo "Base Directory: %BASE_DIR%"
rem echo "Current Directory: %CURR_DIR%"
echo "Current File: %CURR_FILE%"

call "%BASE_DIR%\get_video_length.bat" "%CURR_DIR%\%CURR_FILE%"
set /p length=<tmp.txt

for /F "tokens=1,3 delims=. " %%a in ("%length%") do (
  set /a length=%%a
)

set /a half_length=%length% / 2
del tmp.txt
rem echo %length%
rem echo %half_length%

IF not exist %CURR_DIR%\screenshots (
    rem echo "Making directory: %CURR_DIR%\screenshots"
    mkdir %CURR_DIR%\screenshots
)

if /i %half_length% GEQ 60 (
    ffmpeg -y -hide_banner -loglevel error -ss 00:01:00 -i "%CURR_DIR%\%CURR_FILE%" -vframes 1 -q:v 1 "%CURR_DIR%\screenshots\%CURR_FILE%.jpg"
    echo "Capturing at 00h:01m:00s."
) else (
    if /i %half_length% GEQ 30 (
        ffmpeg -y -hide_banner -loglevel error -ss 00:00:30 -i "%CURR_DIR%\%CURR_FILE%" -vframes 1 -q:v 1 "%CURR_DIR%\screenshots\%CURR_FILE%.jpg"
        echo "Capturing at 00h:00m:30s."
    ) else (
        if /i %half_length% GEQ 10 (
            ffmpeg -y -hide_banner -loglevel error -ss 00:00:10 -i "%CURR_DIR%\%CURR_FILE%" -vframes 1 -q:v 1 "%CURR_DIR%\screenshots\%CURR_FILE%.jpg"
            echo "Capturing at 00h:00m:10s."
        ) else (
            ffmpeg -y -hide_banner -loglevel error -ss 00:00:00.100 -i "%CURR_DIR%\%CURR_FILE%" -vframes 1 -q:v 1 "%CURR_DIR%\screenshots\%CURR_FILE%.jpg"
            echo "Capturing at 00h:00m:00.1s."
        )
    )
)
ENDLOCAL