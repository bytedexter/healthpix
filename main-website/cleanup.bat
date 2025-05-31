@echo off
echo Cleaning .next directory...

rem Kill any node processes that might be locking files
taskkill /F /IM node.exe 2>nul
echo Node.js processes stopped

rem Wait a moment for processes to terminate
timeout /T 2 /NOBREAK >nul

rem Try to force delete the .next directory
rd /s /q ".next" 2>nul

rem Check if removal was successful
if not exist ".next" (
    echo .next directory removed successfully
) else (
    echo Could not completely remove .next directory
    echo You may need to restart your computer
)

echo.
echo Next steps:
echo 1. Run 'npm run build:standard' to build with standard webpack
echo 2. Run 'npm start' to start the production server
