# CampusLoop Local Development Launcher
param(
    [string]$Service = "all"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   CAMPUSLOOP LOCAL DEVELOPMENT RUNNER   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

if ($Service -eq "backend" -or $Service -eq "all") {
    Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"
}

if ($Service -eq "frontend" -or $Service -eq "all") {
    Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
}

Write-Host "`nCampusLoop is launching! Access points:" -ForegroundColor Yellow
Write-Host "-> Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "-> Backend Swagger Docs: http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
