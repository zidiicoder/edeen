package com.edeen;

import android.content.Context;
import android.location.LocationManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LocationManagerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public LocationManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
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

            // Check if either GPS or Network provider is enabled
            boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            boolean networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            
            boolean isEnabled = gpsEnabled || networkEnabled;
            promise.resolve(isEnabled);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to check location status: " + e.getMessage());
        }
    }
}
