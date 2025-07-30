@echo off
cd /d "C:\Users\valti\Projects\WebstormProjects\home-accounting-monorepo"
echo Compiling frontend...
call sbt "frontend/fastOptJS"
echo.
echo Starting server...
echo Server will be available at http://localhost:8080
echo.
start "Scala Backend Server" cmd /k "sbt \"backend/runMain com.homeaccounting.MainFixed\""
echo Server started in new window!
pause
