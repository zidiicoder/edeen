package com.edeen;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.location.LocationManager;
import android.provider.Settings;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.LocationSettingsStatusCodes;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.Task;

public class LocationManagerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final int REQUEST_CHECK_SETTINGS = 0x1;
    private Promise locationPromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == REQUEST_CHECK_SETTINGS && locationPromise != null) {
                if (resultCode == Activity.RESULT_OK) {
                    locationPromise.resolve(true);
                } else {
                    locationPromise.resolve(false);
                }
                locationPromise = null;
            }
        }
    };

    public LocationManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    public String getName() {
        return "LocationManager";
    }

    @ReactMethod
    public void isLocationEnabled(Promise promise) {
        try {
            LocationManager locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
            
            if (locationManager == null) {
                promise.resolve(false);
                return;
            }

            boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            boolean networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            
            boolean isEnabled = gpsEnabled || networkEnabled;
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check location status: " + e.getMessage());
        }
    }

    @ReactMethod
    public void promptEnableLocation(final Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("ERROR", "Activity doesn't exist");
            return;
        }

        locationPromise = promise;

        try {
            LocationRequest locationRequest = new LocationRequest.Builder(
                    Priority.PRIORITY_HIGH_ACCURACY, 10000)
                    .build();

            LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                    .addLocationRequest(locationRequest)
                    .setAlwaysShow(true);

            Task<LocationSettingsResponse> task = LocationServices.getSettingsClient(currentActivity)
                    .checkLocationSettings(builder.build());

            task.addOnCompleteListener(task1 -> {
                try {
                    LocationSettingsResponse response = task1.getResult(ApiException.class);
                    if (locationPromise != null) {
                        locationPromise.resolve(true);
                        locationPromise = null;
                    }
                } catch (ApiException exception) {
                    switch (exception.getStatusCode()) {
                        case LocationSettingsStatusCodes.RESOLUTION_REQUIRED:
                            try {
                                ResolvableApiException resolvable = (ResolvableApiException) exception;
                                resolvable.startResolutionForResult(currentActivity, REQUEST_CHECK_SETTINGS);
                            } catch (IntentSender.SendIntentException | ClassCastException e) {
                                if (locationPromise != null) {
                                    locationPromise.reject("ERROR", "Failed to show enable dialog: " + e.getMessage());
                                    locationPromise = null;
                                }
                            }
                            break;
                        case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
                            if (locationPromise != null) {
                                locationPromise.reject("ERROR", "Location settings are not available");
                                locationPromise = null;
                            }
                            break;
                    }
                }
            });
        } catch (Exception e) {
            if (locationPromise != null) {
                locationPromise.reject("ERROR", "Failed to check location settings: " + e.getMessage());
                locationPromise = null;
            }
        }
    }

    @ReactMethod
    public void openLocationSettings(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to open location settings: " + e.getMessage());
        }
    }
}
