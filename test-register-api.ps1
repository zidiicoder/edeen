# Test user registration API to trigger OTP email

$apiUrl = "https://edeenapp.co.uk/api/signup"
$testEmail = "test.otp.$(Get-Date -Format 'HHmmss')@example.com"

Write-Host "Testing user registration API..." -ForegroundColor Cyan
Write-Host "Test Email: $testEmail" -ForegroundColor Yellow
Write-Host ""

$body = @{
    name = "Test User"
    email = $testEmail
    password = "Test@123456"
    password_confirmation = "Test@123456"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor White
    Write-Host ($response | ConvertTo-Json -Depth 3)
    Write-Host ""
    Write-Host "📧 Check email: $testEmail" -ForegroundColor Yellow
    Write-Host "🔍 Or check database for OTP code" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Check Laravel logs for email sending status:" -ForegroundColor Cyan
