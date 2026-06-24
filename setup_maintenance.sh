#!/bin/bash

# EDeen Maintenance Mode Setup Script
# This script will enable maintenance mode while keeping API routes accessible

PUBLIC_HTML="/home/u963776255/domains/edeenapp.co.uk/public_html"

echo "=== EDeen Maintenance Mode Setup ==="
echo "Starting at: $(date)"
echo ""

# Step 1: Backup current .htaccess if not already backed up
echo "Step 1: Backing up current .htaccess..."
if [ ! -f "$PUBLIC_HTML/.htaccess.backup" ]; then
    cp "$PUBLIC_HTML/.htaccess" "$PUBLIC_HTML/.htaccess.backup"
    echo "✓ Backup created: .htaccess.backup"
else
    echo "✓ Backup already exists: .htaccess.backup"
fi

# Step 2: Check if maintenance files exist locally
if [ ! -f "./maintenance.html" ] || [ ! -f "./.htaccess.maintenance" ]; then
    echo "✗ Error: maintenance.html or .htaccess.maintenance not found in current directory"
    exit 1
fi

# Step 3: Copy maintenance HTML to server
echo ""
echo "Step 2: Uploading maintenance page..."
cp "./maintenance.html" "$PUBLIC_HTML/maintenance.html"
chmod 644 "$PUBLIC_HTML/maintenance.html"
echo "✓ maintenance.html uploaded"

# Step 4: Apply maintenance .htaccess
echo ""
echo "Step 3: Activating maintenance mode..."
cp "./.htaccess.maintenance" "$PUBLIC_HTML/.htaccess"
chmod 644 "$PUBLIC_HTML/.htaccess"
echo "✓ Maintenance .htaccess activated"

# Step 5: Verify setup
echo ""
echo "Step 4: Verifying setup..."
if [ -f "$PUBLIC_HTML/maintenance.html" ] && [ -f "$PUBLIC_HTML/.htaccess" ]; then
    echo "✓ All files in place"
    echo ""
    echo "=== Maintenance Mode ACTIVE ==="
    echo ""
    echo "Status:"
    echo "  • Website: SHOWS MAINTENANCE PAGE"
    echo "  • API routes (/api/*): STILL WORKING"
    echo "  • Storage/Images: ACCESSIBLE"
    echo ""
    echo "To disable maintenance mode later, run:"
    echo "  cp $PUBLIC_HTML/.htaccess.backup $PUBLIC_HTML/.htaccess"
    echo ""
    echo "Completed at: $(date)"
else
    echo "✗ Error: Setup incomplete"
    exit 1
fi
