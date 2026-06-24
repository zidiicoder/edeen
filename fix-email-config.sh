#!/bin/bash
# EDeen Email Configuration Fix Script
# This script helps configure email settings on the production server

echo "======================================"
echo "EDeen Email Configuration Fix"
echo "======================================"
echo ""

# Server details
SERVER_USER="u963776255"
SERVER_IP="77.37.37.189"
SERVER_PORT="65002"
LARAVEL_PATH="/home/u963776255/domains/edeenapp.co.uk/laravel"

echo "📧 This script will help you configure email settings for EDeen app"
echo ""
echo "You will need:"
echo "  1. SMTP username (email address, e.g., no-reply@edeenapp.co.uk)"
echo "  2. SMTP password from Hostinger"
echo ""

# Prompt for credentials
echo -n "Enter SMTP username (email address): "
read SMTP_USERNAME

echo -n "Enter SMTP password: "
read -s SMTP_PASSWORD
echo ""

if [ -z "$SMTP_USERNAME" ] || [ -z "$SMTP_PASSWORD" ]; then
    echo "❌ Error: Username and password are required!"
    exit 1
fi

echo ""
echo "📝 Configuration to be applied:"
echo "  MAIL_USERNAME: $SMTP_USERNAME"
echo "  MAIL_PASSWORD: ***hidden***"
echo "  MAIL_HOST: smtp.hostinger.com"
echo "  MAIL_PORT: 587"
echo ""

echo -n "Proceed with configuration? (yes/no): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Configuration cancelled."
    exit 0
fi

echo ""
echo "🔧 Connecting to server and updating configuration..."
echo ""

# Create a temporary script to run on the server
cat > /tmp/update-email-config.sh << EOF
#!/bin/bash
cd $LARAVEL_PATH

# Backup current .env
cp .env .env.backup-\$(date +%Y%m%d-%H%M%S)

# Update MAIL_USERNAME
sed -i 's/^MAIL_USERNAME=.*/MAIL_USERNAME=$SMTP_USERNAME/' .env

# Update MAIL_PASSWORD
sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=$SMTP_PASSWORD/' .env

# Ensure other mail settings are correct
sed -i 's/^MAIL_MAILER=.*/MAIL_MAILER=smtp/' .env
sed -i 's/^MAIL_HOST=.*/MAIL_HOST=smtp.hostinger.com/' .env
sed -i 's/^MAIL_PORT=.*/MAIL_PORT=587/' .env
sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env

# Clear Laravel cache
php artisan config:clear
php artisan cache:clear

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Current mail configuration:"
grep "MAIL_" .env | grep -v "PASSWORD"
echo "MAIL_PASSWORD=***hidden***"
EOF

# Upload and execute the script on the server
scp -P $SERVER_PORT /tmp/update-email-config.sh $SERVER_USER@$SERVER_IP:/tmp/
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "bash /tmp/update-email-config.sh && rm /tmp/update-email-config.sh"

# Clean up local temporary file
rm /tmp/update-email-config.sh

echo ""
echo "======================================"
echo "✅ Email Configuration Complete!"
echo "======================================"
echo ""
echo "🧪 Next steps:"
echo "  1. Test email sending:"
echo "     ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP"
echo "     cd $LARAVEL_PATH"
echo "     php artisan email:test your-email@example.com"
echo ""
echo "  2. Check Laravel logs:"
echo "     tail -f $LARAVEL_PATH/storage/logs/laravel.log"
echo ""
echo "  3. Test user registration from mobile app"
echo ""
echo "📚 Full documentation: EMAIL_OTP_FIX_GUIDE.md"
echo ""
