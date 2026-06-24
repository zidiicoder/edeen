#!/bin/bash
# Script to restore edeenapp.co.uk from maintenance mode

echo "=== Restoring edeenapp.co.uk from Maintenance Mode ==="
echo ""

# SSH connection details
SSH_HOST="77.37.37.189"
SSH_PORT="65002"
SSH_USER="u963776255"
PUBLIC_HTML_PATH="/home/u963776255/domains/edeenapp.co.uk/public_html"

echo "Restoring original .htaccess file..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $PUBLIC_HTML_PATH && cp .htaccess.backup .htaccess"

echo ""
echo "✅ Site restored successfully!"
echo ""
echo "Original files backed up at:"
echo "  - $PUBLIC_HTML_PATH/.htaccess.backup"
echo "  - $PUBLIC_HTML_PATH/index.php.backup"
echo ""
echo "Maintenance page still available at:"
echo "  - https://edeenapp.co.uk/maintenance.html"
echo ""
echo "You can now visit: https://edeenapp.co.uk"
