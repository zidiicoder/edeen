# ===================================================================
# Edeen App - Comprehensive Build & Test Script for Windows
# ===================================================================
# This script builds the Android APK and runs comprehensive diagnostics
# to detect any errors during build and runtime.
# ===================================================================

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipInstall = $false,
    [switch]$SkipTest = $false,
    [string]$BuildType = "Release"  # Release or Debug
)

$ErrorActionPreference = "Continue"
$script:ErrorCount = 0
$script:WarningCount = 0
$LogFile = "build-test-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

# Colors for output
function Write-Step { param($msg) Write-Host "`n========================================" -ForegroundColor Cyan; Write-Host $msg -ForegroundColor Cyan; Write-Host "========================================`n" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-ErrorMsg { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red; $script:ErrorCount++ }
function Write-WarningMsg { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow; $script:WarningCount++ }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Blue }

# Log to file
function Log { param($msg) Add-Content -Path $LogFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $msg" }

Write-Step "Edeen Android Build & Test Script"
Write-Info "Log file: $LogFile"
Log "Build and Test Started"

# ===================================================================
# 1. PRE-BUILD CHECKS
# ===================================================================
Write-Step "Step 1: Pre-Build Environment Checks"

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-ErrorMsg "package.json not found. Please run this script from the project root."
    exit 1
}
Write-Success "Project directory verified"
Log "Project directory: $PWD"

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
    Log "Node.js: $nodeVersion"
} catch {
    Write-ErrorMsg "Node.js not found. Please install Node.js"
    Log "ERROR: Node.js not found"
}

# Check Java
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Success "Java: $javaVersion"
    Log "Java: $javaVersion"
} catch {
    Write-ErrorMsg "Java not found. Please install JDK"
    Log "ERROR: Java not found"
}

# Check Android SDK
if ($env:ANDROID_HOME) {
    Write-Success "ANDROID_HOME: $env:ANDROID_HOME"
    Log "ANDROID_HOME: $env:ANDROID_HOME"
} else {
    Write-WarningMsg "ANDROID_HOME not set"
    Log "WARNING: ANDROID_HOME not set"
}

# Check ADB
try {
    $adbVersion = adb version 2>&1 | Select-Object -First 1
    Write-Success "ADB: $adbVersion"
    Log "ADB: $adbVersion"
    
    # Check connected devices
    $devices = adb devices | Select-String "device$" | Measure-Object
    if ($devices.Count -gt 0) {
        Write-Success "$($devices.Count) Android device(s) connected"
        Log "Connected devices: $($devices.Count)"
        adb devices | Out-String | Log
    } else {
        Write-WarningMsg "No Android devices connected"
        Log "WARNING: No devices connected"
    }
} catch {
    Write-WarningMsg "ADB not found in PATH"
    Log "WARNING: ADB not found"
}

# Check package.json for React Native version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$rnVersion = $packageJson.dependencies."react-native"
Write-Info "React Native version: $rnVersion"
Log "React Native version: $rnVersion"

# ===================================================================
# 2. DEPENDENCY CHECK
# ===================================================================
Write-Step "Step 2: Checking Dependencies"

if (Test-Path "node_modules") {
    Write-Success "node_modules directory exists"
    $nodeModulesSize = (Get-ChildItem "node_modules" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Info "node_modules size: $([math]::Round($nodeModulesSize, 2)) MB"
    Log "node_modules size: $nodeModulesSize MB"
} else {
    Write-WarningMsg "node_modules not found. Run 'npm install' first"
    Log "WARNING: node_modules not found"
}

# Check critical native modules
$criticalModules = @(
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    "@notifee/react-native",
    "react-native-gesture-handler",
    "react-native-reanimated"
)

foreach ($module in $criticalModules) {
    if (Test-Path "node_modules/$module") {
        Write-Success "Module found: $module"
    } else {
        Write-ErrorMsg "Missing module: $module"
        Log "ERROR: Missing module - $module"
    }
}

# ===================================================================
# 3. CONFIGURATION VERIFICATION
# ===================================================================
Write-Step "Step 3: Verifying Build Configuration"

# Check gradle.properties
if (Test-Path "android/gradle.properties") {
    $gradleProps = Get-Content "android/gradle.properties" | Out-String
    if ($gradleProps -match "hermesEnabled=true") {
        Write-Info "Hermes JS engine: ENABLED"
        Log "Hermes enabled"
    } elseif ($gradleProps -match "hermesEnabled=false") {
        Write-Info "Hermes JS engine: DISABLED (using JSC)"
        Log "Hermes disabled"
    } else {
        Write-WarningMsg "hermesEnabled property not found"
        Log "WARNING: hermesEnabled not configured"
    }
} else {
    Write-ErrorMsg "gradle.properties not found"
    Log "ERROR: gradle.properties not found"
}

# Check build.gradle
if (Test-Path "android/app/build.gradle") {
    Write-Success "build.gradle found"
    $buildGradle = Get-Content "android/app/build.gradle" | Out-String
    
    # Check version code and name
    if ($buildGradle -match "versionCode\s+(\d+)") {
        Write-Info "Version Code: $($matches[1])"
        Log "Version Code: $($matches[1])"
    }
    if ($buildGradle -match 'versionName\s+"([^"]+)"') {
        Write-Info "Version Name: $($matches[1])"
        Log "Version Name: $($matches[1])"
    }
} else {
    Write-ErrorMsg "build.gradle not found"
    Log "ERROR: build.gradle not found"
}

# ===================================================================
# 4. CLEAN BUILD
# ===================================================================
if (-not $SkipBuild) {
    Write-Step "Step 4: Cleaning Previous Build"
    
    Push-Location "android"
    try {
        Write-Info "Running gradle clean..."
        .\gradlew clean 2>&1 | Tee-Object -Variable cleanOutput
        $cleanOutput | Out-String | Log
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Clean successful"
            Log "Clean successful"
        } else {
            Write-ErrorMsg "Clean failed with exit code: $LASTEXITCODE"
            Log "ERROR: Clean failed"
            $cleanOutput | Select-String -Pattern "ERROR|FAILURE" | ForEach-Object {
                Write-ErrorMsg $_.Line
                Log "ERROR: $($_.Line)"
            }
        }
    } finally {
        Pop-Location
    }

    # ===================================================================
    # 5. BUILD APK
    # ===================================================================
    Write-Step "Step 5: Building APK ($BuildType)"
    
    $buildTask = if ($BuildType -eq "Debug") { "assembleDebug" } else { "assembleRelease" }
    $buildStartTime = Get-Date
    
    Push-Location "android"
    try {
        Write-Info "Running: gradlew $buildTask"
        Write-Info "This may take several minutes..."
        
        .\gradlew $buildTask 2>&1 | Tee-Object -Variable buildOutput
        $buildOutput | Out-String | Log
        
        $buildEndTime = Get-Date
        $buildDuration = ($buildEndTime - $buildStartTime).TotalMinutes
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build successful (took $([math]::Round($buildDuration, 2)) minutes)"
            Log "Build successful - Duration: $buildDuration minutes"
            
            # Find and analyze the APK
            $apkPath = if ($BuildType -eq "Debug") {
                "app/build/outputs/apk/debug/app-debug.apk"
            } else {
                "app/build/outputs/apk/release/app-release.apk"
            }
            
            if (Test-Path $apkPath) {
                $apkSize = (Get-Item $apkPath).Length / 1MB
                Write-Success "APK generated: $apkPath"
                Write-Info "APK size: $([math]::Round($apkSize, 2)) MB"
                Log "APK: $apkPath - Size: $apkSize MB"
                
                # Analyze APK contents
                Write-Info "Analyzing APK contents..."
                $apkLibs = jar -tf $apkPath | Select-String "lib/.*\.so$"
                $libCount = ($apkLibs | Measure-Object).Count
                Write-Info "Native libraries found: $libCount"
                Log "Native libraries count: $libCount"
                
                # Check for specific libraries
                $hermesLib = $apkLibs | Select-String "libhermes\.so"
                $hermesExecLib = $apkLibs | Select-String "libhermes_executor\.so"
                $jscLib = $apkLibs | Select-String "libjsc\.so"
                $jscExecLib = $apkLibs | Select-String "libjscexecutor\.so"
                
                if ($hermesLib) {
                    Write-Success "Found: libhermes.so (New Hermes format - RN 0.76+)"
                    Log "Found: libhermes.so"
                } elseif ($hermesExecLib) {
                    Write-Success "Found: libhermes_executor.so (Old Hermes format - RN 0.75)"
                    Log "Found: libhermes_executor.so"
                } elseif ($jscLib) {
                    Write-Success "Found: libjsc.so (New JSC format - RN 0.76+)"
                    Log "Found: libjsc.so"
                } elseif ($jscExecLib) {
                    Write-Success "Found: libjscexecutor.so (Old JSC format - RN 0.75)"
                    Log "Found: libjscexecutor.so"
                } else {
                    Write-ErrorMsg "No JavaScript engine library found in APK!"
                    Log "ERROR: No JS engine library found"
                }
                
                # Copy APK to project root with timestamp
                $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
                $outputApk = Join-Path $PWD.Path "..\edeen-$BuildType-$timestamp.apk"
                Copy-Item $apkPath $outputApk
                Write-Success "APK copied to: $(Split-Path $outputApk -Leaf)"
                Log "APK copied to: $outputApk"
                
            } else {
                Write-ErrorMsg "APK file not found at: $apkPath"
                Log "ERROR: APK not found at $apkPath"
            }
            
        } else {
            Write-ErrorMsg "Build failed with exit code: $LASTEXITCODE"
            Log "ERROR: Build failed with code $LASTEXITCODE"
            
            # Extract and display errors
            Write-Info "Extracting errors from build output..."
            $buildOutput | Select-String -Pattern "ERROR|FAILURE|FAILED" | ForEach-Object {
                Write-ErrorMsg $_.Line
                Log "BUILD ERROR: $($_.Line)"
            }
            
            # Check for common issues
            if ($buildOutput -match "Could not resolve") {
                Write-WarningMsg "Dependency resolution issue detected"
                Log "WARNING: Dependency resolution issue"
            }
            if ($buildOutput -match "Execution failed for task") {
                Write-WarningMsg "Task execution failure detected"
                Log "WARNING: Task execution failure"
            }
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Skipping build (use -SkipBuild:`$false to build)"
}

# ===================================================================
# 6. INSTALL APK ON DEVICE
# ===================================================================
if (-not $SkipInstall -and -not $SkipBuild) {
    Write-Step "Step 6: Installing APK on Device"
    
    # Find the most recent APK
    $apkFiles = Get-ChildItem -Path "android/app/build/outputs/apk" -Filter "*.apk" -Recurse | Sort-Object LastWriteTime -Descending
    if ($apkFiles) {
        $latestApk = $apkFiles[0].FullName
        Write-Info "Installing: $($apkFiles[0].Name)"
        
        try {
            $installOutput = adb install -r $latestApk 2>&1
            $installOutput | Out-String | Log
            
            if ($installOutput -match "Success") {
                Write-Success "APK installed successfully"
                Log "APK installed successfully"
            } else {
                Write-ErrorMsg "Installation failed"
                Write-Info "Output: $installOutput"
                Log "ERROR: Installation failed - $installOutput"
            }
        } catch {
            Write-ErrorMsg "ADB install failed: $_"
            Log "ERROR: ADB install exception - $_"
        }
    } else {
        Write-WarningMsg "No APK file found to install"
        Log "WARNING: No APK to install"
    }
}

# ===================================================================
# 7. RUNTIME TESTING
# ===================================================================
if (-not $SkipTest -and -not $SkipInstall) {
    Write-Step "Step 7: Runtime Testing"
    
    Write-Info "Launching app..."
    try {
        $launchOutput = adb shell am start -n com.edeen/.MainActivity 2>&1
        $launchOutput | Out-String | Log
        
        if ($launchOutput -match "Error") {
            Write-ErrorMsg "Failed to launch app"
            Write-Info "Output: $launchOutput"
            Log "ERROR: App launch failed - $launchOutput"
        } else {
            Write-Success "App launched"
            Log "App launched successfully"
            
            # Wait for app to initialize
            Write-Info "Waiting 5 seconds for app to initialize..."
            Start-Sleep -Seconds 5
            
            # Capture crash logs
            Write-Info "Capturing device logs..."
            $logOutput = adb logcat -d -s "AndroidRuntime:E" 2>&1
            $logOutput | Out-String | Log
            
            # Check for crashes
            $crashes = $logOutput | Select-String -Pattern "FATAL EXCEPTION|UnsatisfiedLinkError" -Context 5,10
            if ($crashes) {
                Write-ErrorMsg "App crashed! Analyzing crash logs..."
                Log "ERROR: App crashed"
                
                $crashes | ForEach-Object {
                    Write-ErrorMsg "Crash detected:"
                    Write-Host $_.Context.PreContext -ForegroundColor DarkRed
                    Write-Host $_.Line -ForegroundColor Red
                    Write-Host $_.Context.PostContext -ForegroundColor DarkRed
                    Log "CRASH: $($_.Line)"
                }
                
                # Specific error detection
                if ($logOutput -match "UnsatisfiedLinkError.*libhermes_executor\.so") {
                    Write-ErrorMsg "CRITICAL: Missing libhermes_executor.so"
                    Write-WarningMsg "This is a React Native 0.76+ compatibility issue"
                    Write-Info "SOLUTION: The app needs React Native 0.75 or earlier for this device"
                    Log "CRITICAL: libhermes_executor.so not found - RN 0.76 compatibility issue"
                }
                
                if ($logOutput -match "UnsatisfiedLinkError.*libjscexecutor\.so") {
                    Write-ErrorMsg "CRITICAL: Missing libjscexecutor.so"
                    Write-WarningMsg "This is a React Native 0.76+ compatibility issue"
                    Write-Info "SOLUTION: The app needs React Native 0.75 or earlier for this device"
                    Log "CRITICAL: libjscexecutor.so not found - RN 0.76 compatibility issue"
                }
                
            } else {
                Write-Success "No crashes detected in logs"
                Log "No crashes detected"
                
                # Check if app is still running
                $processCheck = adb shell "ps | grep com.edeen" 2>&1
                if ($processCheck -match "com.edeen") {
                    Write-Success "App is running!"
                    Log "App is running successfully"
                } else {
                    Write-WarningMsg "App process not found (may have closed gracefully or crashed)"
                    Log "WARNING: App process not found"
                }
            }
        }
    } catch {
        Write-ErrorMsg "Runtime test failed: $_"
        Log "ERROR: Runtime test exception - $_"
    }
}

# ===================================================================
# 8. SUMMARY
# ===================================================================
Write-Step "Build & Test Summary"

Write-Host ""
if ($script:ErrorCount -eq 0 -and $script:WarningCount -eq 0) {
    Write-Success "All checks passed!"
    Write-Success "No errors or warnings detected"
} else {
    if ($script:ErrorCount -gt 0) {
        Write-ErrorMsg "Total Errors: $script:ErrorCount"
    }
    if ($script:WarningCount -gt 0) {
        Write-WarningMsg "Total Warnings: $script:WarningCount"
    }
}

Write-Host ""
Write-Info "Log file: $LogFile"
Write-Info "Review the log file for complete details"
Log "Build and Test Completed - Errors: $script:ErrorCount, Warnings: $script:WarningCount"

# ===================================================================
# 9. RECOMMENDATIONS
# ===================================================================
if ($script:ErrorCount -gt 0) {
    Write-Step "Recommendations"
    
    if ($logOutput -match "UnsatisfiedLinkError.*libhermes_executor\.so|UnsatisfiedLinkError.*libjscexecutor\.so") {
        Write-Host "`n========================================================================" -ForegroundColor Yellow
        Write-Host "                 CRITICAL COMPATIBILITY ISSUE                           " -ForegroundColor Yellow
        Write-Host "========================================================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  React Native 0.76.x is incompatible with this device!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  The issue: RN 0.76 renamed JavaScript engine libraries:" -ForegroundColor Yellow
        Write-Host "    - libhermes_executor.so -> libhermes.so" -ForegroundColor Yellow
        Write-Host "    - libjscexecutor.so -> libjsc.so" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Your device's Android runtime is looking for the OLD names." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "========================================================================" -ForegroundColor Yellow
        Write-Host "  SOLUTION: Downgrade to React Native 0.75.x" -ForegroundColor Yellow
        Write-Host "========================================================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Steps:" -ForegroundColor Yellow
        Write-Host "  1. npm install react-native@0.75.7" -ForegroundColor Yellow
        Write-Host "  2. Update all @react-native/* dependencies to 0.75.7" -ForegroundColor Yellow
        Write-Host "  3. npm install" -ForegroundColor Yellow
        Write-Host "  4. cd android && .\gradlew clean" -ForegroundColor Yellow
        Write-Host "  5. cd .. && .\build-and-test.ps1" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "========================================================================" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Script completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
