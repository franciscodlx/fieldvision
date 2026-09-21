package com.fieldvision

import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import java.util.Locale
import java.util.UUID

// TODO: Replace mock — ver docs/03-turbomodules.md para implementación real con Meta Wearables SDK
// Note: When CodeGen generates NativeMetaGlassesCxxSpec, extend that instead of ReactContextBaseJavaModule
@ReactModule(name = MetaGlassesModule.NAME)
class MetaGlassesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "NativeMetaGlasses"
    }

    private var tts: TextToSpeech? = null
    private var isStreaming = false

    override fun initialize() {
        super.initialize()
        tts = TextToSpeech(reactApplicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("es", "MX")
            }
        }
    }

    override fun invalidate() {
        tts?.shutdown()
        tts = null
        super.invalidate()
    }

    // El SDK real de Meta (meta-wearables-dat-android) todavía no está integrado en Android;
    // iOS ya usa el DAT real. Estos métodos existen para cumplir el contrato de la spec.
    @ReactMethod
    fun getIntegrationStatus(promise: Promise) {
        val map = WritableNativeMap().apply {
            putBoolean("configured", false)
            putInt("registrationState", 0)
            putInt("deviceCount", 0)
            putString("cameraPermission", "unknown")
            putBoolean("sessionActive", false)
            putString("deviceDetail", "El SDK de Meta Wearables aún no está integrado en Android.")
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun registerWithMetaAI(promise: Promise) {
        promise.reject("not_implemented", "El SDK de Meta Wearables aún no está integrado en Android.")
    }

    @ReactMethod
    fun requestCameraPermission(promise: Promise) {
        promise.reject("not_implemented", "El SDK de Meta Wearables aún no está integrado en Android.")
    }

    @ReactMethod
    fun startSession(promise: Promise) {
        // TODO: Replace mock
        val map = WritableNativeMap().apply {
            putString("id", UUID.randomUUID().toString())
            putString("deviceId", UUID.randomUUID().toString())
            putString("startedAt", java.util.Date().toString())
            putString("firmwareVersion", "1.0.0-mock")
            putString("model", "Ray-Ban Meta Smart Glasses (Mock)")
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun endSession(sessionId: String, promise: Promise) {
        // TODO: Replace mock
        promise.resolve(null)
    }

    @ReactMethod
    fun capturePhoto(promise: Promise) {
        // TODO: Replace mock
        val map = WritableNativeMap().apply {
            putString("base64", "/9j/4AAQSkZJRgABAQEASABIAAD/mockframe")
            putInt("width", 1280)
            putInt("height", 720)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun startVideoStream(promise: Promise) {
        // TODO: Replace mock
        isStreaming = true
        promise.resolve(null)
    }

    @ReactMethod
    fun stopVideoStream(promise: Promise) {
        isStreaming = false
        promise.resolve(null)
    }

    @ReactMethod
    fun speakText(text: String, promise: Promise) {
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "fieldvision_${System.currentTimeMillis()}")
        promise.resolve(null)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Double) {}

    override fun getName() = NAME
}
