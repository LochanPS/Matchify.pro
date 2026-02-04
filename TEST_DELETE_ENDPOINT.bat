@echo off
echo ========================================
echo Testing Delete All Data Endpoint
echo ========================================
echo.
echo Opening browser test page...
echo.
echo Instructions:
echo 1. Open browser console (F12)
echo 2. Copy and paste these commands:
echo.
echo Test 1 - Check test endpoint:
echo fetch('https://matchify-backend.onrender.com/api/admin/delete-all-info/test').then(r =^> r.json()).then(d =^> console.log('Test:', d))
echo.
echo Test 2 - Check main endpoint:
echo fetch('https://matchify-backend.onrender.com/api/admin/delete-all-info', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: 'test'})}).then(r =^> r.json()).then(d =^> console.log('Main:', d))
echo.
echo Expected Results:
echo - If deployed: Test returns success, Main returns 401 error
echo - If NOT deployed: Both return 404 Not Found
echo.
pause
