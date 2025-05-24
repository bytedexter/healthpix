# Start the backend
$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "Starting backend server..."
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", {
    Set-Location -Path $using:backendPath
    npm install
    npm start
} -PassThru -WindowStyle Normal

Write-Host "Starting frontend server..."
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", {
    Set-Location -Path $using:frontendPath
    npm install
    npm run dev
} -PassThru -WindowStyle Normal

Write-Host "Both servers are running..."
Write-Host "Press Ctrl+C to stop both servers"

try {
    Wait-Process -Id $backendProcess.Id, $frontendProcess.Id
} finally {
    if (!$backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id }
    if (!$frontendProcess.HasExited) { Stop-Process -Id $frontendProcess.Id }
}
