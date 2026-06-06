@echo off
title Hieu Sach Chin - Dev Server
echo Starting Frontend and Backend...
start cmd /k "cd /d %~dp0frontend && npm run dev"
start cmd /k "cd /d %~dp0backend && npm run dev"
echo Both servers started!
pause
