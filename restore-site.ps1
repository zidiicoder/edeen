# PowerShell script to restore edeenapp.co.uk from maintenance mode

Write-Host "=== Restoring edeenapp.co.uk from Maintenance Mode ===" -ForegroundColor Cyan
Write-Host ""

# SSH connection details
$SSH_HOST = "77.37.37.189"
$SSH_PORT = "65002"
$SSH_USER = "u963776255"
$PUBLIC_HTML_PATH = "/home/u963776255/domains/edeenapp.co.uk/public_html"

Write-Host "Restoring original .htaccess file..." -ForegroundColor Yellow
ssh -p $SSH_PORT "${SSH_USER}@${SSH_HOST}" "cd $PUBLIC_HTML_PATH && cp .htaccess.backup .htaccess"

Write-Host ""
Write-Host "✅ Site restored successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Original files backed up at:"
Write-Host "  - $PUBLIC_HTML_PATH/.htaccess.backup"
Write-Host "  - $PUBLIC_HTML_PATH/index.php.backup"
Write-Host ""
Write-Host "Maintenance page still available at:"
Write-Host "  - https://edeenapp.co.uk/maintenance.html"
Write-Host ""
Write-Host "You can now visit: https://edeenapp.co.uk" -ForegroundColor Green
