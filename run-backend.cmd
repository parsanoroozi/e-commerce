@echo off
setlocal

cd /d "%~dp0"

if exist "%~dp0.env" (
  echo Loading environment from %~dp0.env
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0.env") do (
    if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
  )
) else (
  echo No .env file found. Using local development defaults.
)

if "%JWT_SECRET%"=="" set "JWT_SECRET=dev-only-change-this-secret-please-make-production-random"
if "%SPRING_DATASOURCE_URL%"=="" set "SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ecommerce"
if "%SPRING_DATASOURCE_USERNAME%"=="" set "SPRING_DATASOURCE_USERNAME=postgres"
if "%SPRING_DATASOURCE_PASSWORD%"=="" set "SPRING_DATASOURCE_PASSWORD=postgres"
if "%SPRING_JPA_HIBERNATE_DDL_AUTO%"=="" set "SPRING_JPA_HIBERNATE_DDL_AUTO=update"
if "%PAYMENT_DEV_MODE%"=="" set "PAYMENT_DEV_MODE=true"
if "%MAIL_ENABLED%"=="" set "MAIL_ENABLED=false"
if "%AUTH_COOKIE_SECURE%"=="" set "AUTH_COOKIE_SECURE=false"
if "%APP_SEED_ENABLED%"=="" set "APP_SEED_ENABLED=false"

echo Starting ShopVerse backend on http://localhost:8080
echo Swagger: http://localhost:8080/swagger-ui/index.html
echo.

call "%~dp0mvnw.cmd" spring-boot:run
