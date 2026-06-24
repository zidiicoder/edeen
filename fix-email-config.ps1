# EDeen Email Configuration Fix Script (PowerShell)
# This script helps configure email settings on the production server

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "EDeen Email Configuration Fix" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Server details
$SERVER_USER = "u963776255"
$SERVER_IP = "77.37.37.189"
$SERVER_PORT = "65002"
$LARAVEL_PATH = "/home/u963776255/domains/edeenapp.co.uk/laravel"

Write-Host "📧 This script will help you configure email settings for EDeen app" -ForegroundColor Yellow
Write-Host ""
Write-Host "You will need:"
Write-Host "  1. SMTP username (email address, e.g., no-reply@edeenapp.co.uk)"
Write-Host "  2. SMTP password from Hostinger"
Write-Host ""

# Prompt for credentials
$SMTP_USERNAME = Read-Host "Enter SMTP username (email address)"
$SMTP_PASSWORD_SECURE = Read-Host "Enter SMTP password" -AsSecureString
$SMTP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SMTP_PASSWORD_SECURE)
)

if ([string]::IsNullOrWhiteSpace($SMTP_USERNAME) -or [string]::IsNullOrWhiteSpace($SMTP_PASSWORD)) {
    Write-Host "❌ Error: Username and password are required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Configuration to be applied:" -ForegroundColor Yellow
Write-Host "  MAIL_USERNAME: $SMTP_USERNAME"
Write-Host "  MAIL_PASSWORD: ***hidden***"
Write-Host "  MAIL_HOST: smtp.hostinger.com"
Write-Host "  MAIL_PORT: 587"
Write-Host ""

$CONFIRM = Read-Host "Proceed with configuration? (yes/no)"

if ($CONFIRM -ne "yes") {
    Write-Host "❌ Configuration cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔧 Connecting to server and updating configuration..." -ForegroundColor Cyan
Write-Host ""

# Create SSH command to update .env file
$SSH_COMMAND = @"
cd $LARAVEL_PATH && \
cp .env .env.backup-`$(date +%Y%m%d-%H%M%S) && \
sed -i 's/^MAIL_USERNAME=.*/MAIL_USERNAME=$SMTP_USERNAME/' .env && \
sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=$SMTP_PASSWORD/' .env && \
sed -i 's/^MAIL_MAILER=.*/MAIL_MAILER=smtp/' .env && \
sed -i 's/^MAIL_HOST=.*/MAIL_HOST=smtp.hostinger.com/' .env && \
sed -i 's/^MAIL_PORT=.*/MAIL_PORT=587/' .env && \
sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env && \
php artisan config:clear && \
php artisan cache:clear && \
echo '' && \
echo '✅ Configuration updated successfully!' && \
echo '' && \
echo '📋 Current mail configuration:' && \
grep 'MAIL_' .env | grep -v 'PASSWORD' && \
echo 'MAIL_PASSWORD=***hidden***'
"@

# Execute SSH command
ssh -p $SERVER_PORT "$SERVER_USER@$SERVER_IP" $SSH_COMMAND

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ Email Configuration Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test email sending:" -ForegroundColor White
Write-Host "     ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP" -ForegroundColor Gray
Write-Host "     cd $LARAVEL_PATH" -ForegroundColor Gray
Write-Host "     php artisan email:test your-email@example.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Quick test from PowerShell:" -ForegroundColor White
Write-Host "     ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP `"cd $LARAVEL_PATH && php artisan email:test your-email@example.com`"" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Check Laravel logs:" -ForegroundColor White
Write-Host "     ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP `"tail -f $LARAVEL_PATH/storage/logs/laravel.log`"" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Test user registration from mobile app" -ForegroundColor White
Write-Host ""
Write-Host "📚 Full documentation: EMAIL_OTP_FIX_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
