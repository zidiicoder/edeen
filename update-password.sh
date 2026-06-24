#!/bin/bash
cd /home/u963776255/domains/edeenapp.co.uk/laravel
cp .env .env.backup-password
sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD="wQ\/s@ka#9Qv@"/' .env
echo "Password updated with proper escaping"
grep 'MAIL_PASSWORD' .env
