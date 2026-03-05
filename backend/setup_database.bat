@echo off
echo Creating ERO Database...
echo.
echo Connect to MySQL and run:
echo CREATE DATABASE ero_db;
echo.
pause

REM Add MySQL to PATH if needed
REM set PATH=%PATH%;C:\Program Files\MySQL\MySQL Server 8.0\bin

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ero_db; SHOW DATABASES;"

echo.
echo Database created successfully!
pause
