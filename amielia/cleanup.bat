@echo off
echo Cleaning up unnecessary files...

REM Remove HTTrack cache and log files
rmdir /s /q "hts-cache" 2>nul
del /q "hts-log.txt" 2>nul

REM Remove external domain folders that are not needed
rmdir /s /q "export.qodethemes.com" 2>nul
rmdir /s /q "static.zdassets.com" 2>nul
rmdir /s /q "www.googletagmanager.com" 2>nul

REM Remove WordPress admin and includes (not needed for static site)
rmdir /s /q "munich.qodeinteractive.com\wp-includes" 2>nul
rmdir /s /q "munich.qodeinteractive.com\wp-content\plugins" 2>nul

REM Remove remaining image directories
rmdir /s /q "munich.qodeinteractive.com\wp-content\uploads\2022" 2>nul

echo Cleanup completed!
pause