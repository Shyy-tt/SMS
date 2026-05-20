package com.detectify.app

import android.Manifest
import android.content.pm.PackageManager
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmsModule"

    @ReactMethod
    fun sendSMS(phoneNumber: String, message: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.SEND_SMS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                promise.reject("PERMISSION_DENIED", "SEND_SMS permission not granted")
                return
            }

            val smsManager = SmsManager.getDefault()
            smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            
            Log.d("SmsModule", "SMS sent to: $phoneNumber")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("SmsModule", "Error sending SMS: ${e.message}")
            promise.reject("SEND_FAILED", e.message)
        }
    }

    @ReactMethod
    fun getSmsPermissions(promise: Promise) {
        val context = reactApplicationContext
        val sendGranted = ActivityCompat.checkSelfPermission(
            context, Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED
        
        promise.resolve(sendGranted)
    }
}