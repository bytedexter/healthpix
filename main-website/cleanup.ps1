# This script should be run with administrator privileges
# Right-click on PowerShell and select "Run as Administrator", then navigate to this directory and run .\cleanup.ps1

Write-Host "Cleaning .next directory..." -ForegroundColor Yellow

# Kill any node processes that might be locking files
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Stopped Node.js processes" -ForegroundColor Green

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Try to force delete the .next directory
if (Test-Path .next) {
    try {
        # First try normal removal
        Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
        
        # Check if removal was successful
        if (-not (Test-Path .next)) {
            Write-Host ".next directory removed successfully" -ForegroundColor Green
        }
        else {
            # If normal removal failed, try specific file removal
            Write-Host "Trying to remove individual files..." -ForegroundColor Yellow
            
            # Specifically target the trace file that often causes issues
            if (Test-Path .next\trace) {
                try {
                    # Set file attributes to normal before removal
                    attrib -R -H -S ".next\trace" 2>$null
                    Remove-Item -Force .next\trace -ErrorAction SilentlyContinue
                    Write-Host "Removed problematic trace file" -ForegroundColor Green
                }
                catch {
                    Write-Host "Could not remove trace file: $_" -ForegroundColor Red
                }
            }
            
            # Try one more time to remove the entire directory
            Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
            
            if (-not (Test-Path .next)) {
                Write-Host ".next directory removed successfully after targeting specific files" -ForegroundColor Green
            }
            else {
                Write-Host "Could not completely remove .next directory. You may need to restart your computer." -ForegroundColor Red
            }
        }
    }
    catch {
        Write-Host "Failed to remove .next directory: $_" -ForegroundColor Red
        Write-Host "You may need to restart your computer to release file locks." -ForegroundColor Yellow
    }
}
else {
    Write-Host ".next directory does not exist" -ForegroundColor Green
}

# Create reminder for next steps
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm run build:standard' to build with standard webpack" -ForegroundColor Cyan
Write-Host "2. Run 'npm start' to start the production server" -ForegroundColor Cyan
}

Write-Host "Cleanup complete. Now you can run 'npm run build'" -ForegroundColor Cyan
