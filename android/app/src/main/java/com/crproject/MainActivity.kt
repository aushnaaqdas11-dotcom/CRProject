package com.crproject

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle // Add this import if not present

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "CRProject"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    // Add this override for enabling navigation gestures
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null) // Set to null for gesture handling
    }
}