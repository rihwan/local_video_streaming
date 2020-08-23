@echo off
SETLOCAL enableextensions enabledelayedexpansion

set BASE_DIR=%cd%
set VIDEO_DIR=%1
cd /d %VIDEO_DIR%

call :treeProcess
goto :eof

:treeProcess
set "CURR_DIR=%cd%"
echo "Current Dir: %CURR_DIR%"
for %%f in (*.mp4) do (
    echo "File: %CURR_DIR%\%%f"
    call %BASE_DIR%\capture_screenshot.bat %BASE_DIR% %CURR_DIR% "%%f"
)

for /D %%d in (*) do (
    echo "Current directory: %%d"
    if /i not %%d == screenshots (
        set current_directory=%%d
        if /i not %current_directory:~-11% == screenshots (
            cd %%d
            call :treeProcess
            cd ..
        )
    )
)

ENDLOCAL
exit /b