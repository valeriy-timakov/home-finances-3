@echo off
echo Starting Scala backend server...
echo.
echo First compiling frontend...
call sbt "frontend/fastOptJS"
echo.
echo Starting backend server...
echo Server will be available at http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
call sbt "backend/run"
pause
