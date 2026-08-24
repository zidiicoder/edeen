$cmd = @"
cd /home/u402661558/domains/edeenapp.co.uk/laravel/public
echo '=== Backing up current .htaccess ==='
cp .htaccess .htaccess.backup-ip-fix
echo 'Backup created!'
echo ''
echo '=== Current .htaccess content ==='
cat .htaccess
echo ''
echo '=== Creating new .htaccess with IP bypass ==='
cat > .htaccess.new << 'HTACCESS_END'
# Mobile App IP Bypass - Allow all IPs
<IfModule mod_rewrite.c>
    RewriteEngine On
</IfModule>

# Disable ModSecurity for this subdomain
<IfModule mod_security.c>
    SecRuleEngine Off
</IfModule>

# Standard Laravel public folder .htaccess
<IfModule mod_negotiation.c>
    Options -MultiViews -Indexes
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
HTACCESS_END
echo 'New .htaccess created!'
echo ''
echo '=== Applying new .htaccess ==='
mv .htaccess.new .htaccess
echo 'Applied successfully!'
echo ''
echo '=== Verifying new .htaccess ==='
head -20 .htaccess
"@

Write-Host "=== Fixing IP Blocking Issue ===" -ForegroundColor Green
Write-Host "This will modify .htaccess to allow all IPs" -ForegroundColor Yellow
Write-Host ""

echo $cmd | ssh -p 65002 u402661558@45.130.228.181 bash -s

Write-Host ""
Write-Host "=== Fix Applied! ===" -ForegroundColor Green
Write-Host "Please test the app from different IPs now." -ForegroundColor Yellow
