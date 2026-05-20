package com.detectify.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.provider.BlockedNumberContract
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class SmsNotificationListener : NotificationListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val extras = sbn.notification.extras
        val title = extras.getString(android.app.Notification.EXTRA_TITLE, "")
        val text = extras.getString(android.app.Notification.EXTRA_TEXT, "")
        val packageName = sbn.packageName
        
        val isSmsNotification = isSmsApp(packageName) && isSmsContent(title, text)
        
        if (isSmsNotification && text.isNotEmpty()) {
            Log.d("SmsListener", "SMS detected from: $packageName")
            val (sender, body) = extractSmsDetails(title, text, packageName)
            
            if (body.isNotEmpty()) {
                scope.launch {
                    scanMessage(sender, body)
                }
            }
        }
    }
    
    private fun isSmsApp(packageName: String): Boolean {
        val smsApps = listOf(
            "com.google.android.apps.messaging",
            "com.android.mms",
            "com.microsoft.android.smsorganizer",
            "org.thoughtcrime.securesms",
            "com.facebook.orca",
            "com.android.messaging"
        )
        return smsApps.any { packageName.contains(it) } || packageName.contains("sms") || packageName.contains("mms")
    }
    
    private fun isSmsContent(title: String, text: String): Boolean {
        val smsKeywords = listOf("sms", "text", "message", "msg", "📩", "✉️")
        return smsKeywords.any { title.lowercase().contains(it) } || text.contains("+63") || text.matches(Regex(".*\\d{10,}.*"))
    }
    
    private fun extractSmsDetails(title: String, text: String, packageName: String): Pair<String, String> {
        var sender = "Unknown"
        var body = text
        
        if (title.contains(":")) {
            sender = title.substringBefore(":").trim()
            body = title.substringAfter(":").trim() + "\n" + text
        } else if (title.isNotEmpty() && !title.contains("message", ignoreCase = true)) {
            sender = title.trim()
        }
        
        if (packageName == "com.google.android.apps.messaging") {
            val lines = text.split("\n")
            if (lines.size >= 2) {
                sender = lines[0].trim()
                body = lines.drop(1).joinToString("\n")
            }
        }
        
        sender = sender.replace(Regex("[^a-zA-Z0-9\\s+]"), "").trim()
        if (sender.isEmpty()) sender = "Unknown"
        
        return Pair(sender, body)
    }
    
    private suspend fun scanMessage(sender: String, body: String) {
        try {
            val token = readTokenFromFile()
            if (token.isNullOrEmpty()) {
                Log.w("SmsListener", "No token found")
                return
            }
            
            val apiBase = getApiBaseUrl()
            val url = URL("$apiBase/messages/")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.connectTimeout = 10000
            conn.readTimeout = 10000
            conn.doOutput = true
            
            val payload = JSONObject().apply {
                put("sender", sender)
                put("body", body)
                put("display_name", JSONObject.NULL)
            }.toString()
            
            OutputStreamWriter(conn.outputStream).use { it.write(payload) }
            
            val responseCode = conn.responseCode
            Log.d("SmsListener", "Response: $responseCode")
            
            if (responseCode == 201) {
                val response = conn.inputStream.bufferedReader().readText()
                val json = JSONObject(response)
                val type = json.getString("type")
                val confidence = json.getDouble("confidence")
                
                if (type == "scam") {
                    showNotification(sender, body, confidence)
                    
                    if (confidence >= 0.80) {
                        blockNumberSystemWide(sender)
                    }
                }
            }
            conn.disconnect()
        } catch (e: Exception) {
            Log.e("SmsListener", "Error: ${e.message}")
        }
    }
    
    private fun blockNumberSystemWide(sender: String) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val uri = BlockedNumberContract.BlockedNumbers.CONTENT_URI
                val values = ContentValues().apply {
                    put(BlockedNumberContract.BlockedNumbers.COLUMN_ORIGINAL_NUMBER, sender)
                }
                contentResolver.insert(uri, values)
                Log.d("SmsListener", "System-wide blocked: $sender")
            }
        } catch (e: Exception) {
            Log.e("SmsListener", "Failed to block: ${e.message}")
        }
    }
    
    private fun readTokenFromFile(): String? {
        return try {
            val tokenFile = File(filesDir, "token.txt")
            if (tokenFile.exists()) tokenFile.readText().trim() else null
        } catch (e: Exception) {
            null
        }
    }
    
    private fun getApiBaseUrl(): String {
        val configFile = File(filesDir, "config.txt")
        return if (configFile.exists()) {
            configFile.readText().trim()
        } else {
            "https://stuffing-deceit-handoff.ngrok-free.dev"
        }
    }
    
    private fun showNotification(sender: String, body: String, confidence: Double) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "detectify_scam_alerts"
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Scam Alerts", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Alerts for detected scam messages"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }
        
        val confidencePct = (confidence * 100).toInt()
        val preview = if (body.length > 80) body.take(80) + "..." else body
        
        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("⚠️ Scam Detected! ($confidencePct% confidence)")
            .setContentText("From: $sender")
            .setStyle(NotificationCompat.BigTextStyle().bigText("From: $sender\n\n$preview"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}