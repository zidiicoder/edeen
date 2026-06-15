#!/bin/bash

#######################################
# Edeen Backend Deployment Script
# Run this via SSH on Hostinger server
#######################################

echo "========================================="
echo "🚀 Edeen Backend Deployment"
echo "========================================="
echo ""

# Set the Laravel directory path
LARAVEL_DIR="/home/u963776255/domains/edeenapp.co.uk/Laravel"
PUBLIC_HTML="/home/u963776255/domains/edeenapp.co.uk/public_html"

# Check if Laravel directory exists
if [ ! -d "$LARAVEL_DIR" ]; then
    echo "❌ Error: Laravel directory not found at $LARAVEL_DIR"
    exit 1
fi

echo "📁 Found Laravel directory: $LARAVEL_DIR"
echo ""

# Navigate to Laravel directory
cd "$LARAVEL_DIR" || exit 1

echo "Step 1: Generating Application Key..."
php artisan key:generate --force
echo "✅ APP_KEY generated"
echo ""

echo "Step 2: Setting storage permissions..."
chmod -R 775 storage
chmod -R 775 bootstrap/cache
echo "✅ Permissions set"
echo ""

echo "Step 3: Installing Composer dependencies..."
if command -v composer &> /dev/null; then
    composer install --no-dev --optimize-autoloader --no-interaction
    echo "✅ Composer dependencies installed"
else
    echo "⚠️  Composer not found, skipping..."
fi
echo ""

echo "Step 4: Clearing old caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
echo "✅ Caches cleared"
echo ""

echo "Step 5: Running database migrations..."
php artisan migrate --force
echo "✅ Migrations completed"
echo ""

echo "Step 6: Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "✅ Optimization complete"
echo ""

echo "Step 7: Setting up web root access..."
# Create .htaccess in public_html to redirect to Laravel/public
cat > "$PUBLIC_HTML/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ /Laravel/public/$1 [L]
</IfModule>
EOF

# Also copy index.php as backup
cp "$LARAVEL_DIR/public/index.php" "$PUBLIC_HTML/index.php" 2>/dev/null || true

echo "✅ Web root configured"
echo ""

echo "========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "🌐 Your API should now be accessible at:"
echo "   https://edeenapp.co.uk/api/"
echo ""
echo "🧪 Test with:"
echo "   curl https://edeenapp.co.uk/api/login"
echo ""
echo "📝 Next steps:"
echo "   1. Update mobile app API URL to: https://edeenapp.co.uk/api/"
echo "   2. Rebuild APK"
echo "   3. Test login with: forcann66@gmail.com"
echo ""
