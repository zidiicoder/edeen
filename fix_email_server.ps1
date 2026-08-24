# SSH connection details
$server = "45.130.228.181"
$port = "65002"
$username = "u402661558"
$password = "K5yyxGX??MS`$"

Write-Host "=== Email OTP Fix Script ===" -ForegroundColor Green
Write-Host "This script will:"
Write-Host "1. Find your Laravel project"
Write-Host "2. Clear cache"
Write-Host "3. Check logs"
Write-Host "4. Test email configuration"
Write-Host ""

# Commands to execute on the server
$commands = @"
echo '=== Finding Laravel project ==='
cd domains/edeenapp.co.uk/public_html 2>/dev/null || cd public_html 2>/dev/null || cd htdocs 2>/dev/null || pwd
echo ''
echo '=== Current directory ==='
pwd
echo ''
echo '=== Checking if Laravel exists ==='
ls -la artisan 2>/dev/null && echo 'Laravel found!' || echo 'Laravel not found in this directory'
echo ''
echo '=== Clearing Laravel cache ==='
php artisan config:clear
php artisan cache:clear
php artisan config:cache
echo ''
echo '=== Checking .env file ==='
grep -E 'MAIL_' .env | head -10
echo ''
echo '=== Checking recent Laravel logs ==='
tail -30 storage/logs/laravel.log 2>/dev/null || echo 'No log file found'
echo ''
echo '=== Testing PHP mail configuration ==='
php -r "echo ini_get('sendmail_path');" 
"@

Write-Host "Connecting to server..." -ForegroundColor Yellow
Write-Host "You will be prompted for password: $password" -ForegroundColor Cyan
Write-Host ""

# Execute commands via SSH
$commands | ssh -p $port "$username@$server"

Write-Host ""
Write-Host "=== Script completed ===" -ForegroundColor Green
Write-Host "Please review the output above and share it with me." -ForegroundColor Yellow
