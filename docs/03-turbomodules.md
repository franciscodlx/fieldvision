# 03 — TurboModules (Nueva Arquitectura RN 0.84)

## Por qué TurboModules y no el Bridge viejo

React Native 0.82 eliminó permanentemente el Bridge legacy.
`RCTBridgeModule`, `RCTEventEmitter`, `RCT_EXTERN_MODULE` **ya no existen**.

Los TurboModules usan **JSI (JavaScript Interface)** — comunicación directa
C++ ↔ JS sin serialización. Para FieldVision esto significa:
- Captura de frames sin latencia del Bridge
- Eventos de cámara en tiempo real sin colas de mensajes
- Llamadas a `speakText()` síncronas (sin esperar el bridge)

---

## Flujo de CodeGen

```
src/specs/NativeMetaGlasses.ts   ← 1. Tú escribes la spec TypeScript
         │
         │  npm run build (o pod install / gradle build)
         ▼
CodeGen procesa la spec
         │
         ├── iOS:     build/generated/ios/NativeMetaGlassesSpec.h + .mm
         └── Android: build/generated/android/com/fieldvision/NativeMetaGlassesCxxSpec.h
                                                                      + NativeMetaGlassesSpec.kt
         │
         ▼
Tu código nativo implementa la interfaz generada
├── ios/FieldVision/NativeMetaGlasses/MetaGlassesModule.mm
└── android/.../MetaGlassesModule.kt
```

---

## La Spec TypeScript (fuente de verdad)

Archivo: `src/specs/NativeMetaGlasses.ts`

> ⚠️ El archivo DEBE llamarse `Native[NombreDelModulo].ts` — CodeGen solo procesa
> archivos con el prefijo `Native`.

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Tipos de datos que cruzan la frontera JS ↔ nativo
// Solo se permiten: string, number, boolean, null, undefined,
// Object (como Record), Array, y Promise<T>

export interface SessionData {
  id: string;
  deviceId: string;
  startedAt: string;  // ISO 8601 string — Date no está soportada en specs
  firmwareVersion: string;
  model: string;
}

export interface FrameData {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface Spec extends TurboModule {
  // Session
  startSession(): Promise<SessionData>;
  endSession(sessionId: string): Promise<void>;

  // Camera
  capturePhoto(): Promise<FrameData>;
  startVideoStream(): Promise<void>;
  stopVideoStream(): Promise<void>;

  // Audio output
  speakText(text: string): Promise<void>;

  // Required for event emitters in TurboModules
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeMetaGlasses');
```

---

## Implementación iOS (Objective-C++)

Archivo: `ios/FieldVision/NativeMetaGlasses/MetaGlassesModule.mm`

```objc
#import "MetaGlassesModule.h"
// Header generado por CodeGen — NO editar manualmente
#import <FieldVisionSpec/FieldVisionSpec.h>
#import <AVFoundation/AVFoundation.h>

// La clase implementa el protocolo NativeMetaGlassesSpec generado por CodeGen
@interface MetaGlassesModule () <NativeMetaGlassesSpec>
@property (nonatomic, assign) BOOL isStreamingVideo;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, strong) AVSpeechSynthesizer *synthesizer;
@end

@implementation MetaGlassesModule

// Nombre que debe coincidir exactamente con TurboModuleRegistry.getEnforcing('NativeMetaGlasses')
RCT_EXPORT_MODULE(NativeMetaGlasses)

- (instancetype)init {
  self = [super init];
  if (self) {
    _synthesizer = [[AVSpeechSynthesizer alloc] init];
    _isStreamingVideo = NO;
    _hasListeners = NO;
  }
  return self;
}

// Requerido por la Nueva Arquitectura
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeMetaGlassesSpecJSI>(params);
}

// startSession: mock hasta que el SDK de Meta esté disponible
// TODO: Replace mock with Meta Wearables SDK — ver docs/03-turbomodules.md
- (void)startSession:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject {
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 500 * NSEC_PER_MSEC),
                 dispatch_get_main_queue(), ^{
    NSDictionary *sessionData = @{
      @"id": [[NSUUID UUID] UUIDString],
      @"deviceId": @"mock-rayban-meta-gen2",
      @"startedAt": [self iso8601Now],
      @"firmwareVersion": @"20.0.0",
      @"model": @"Ray-Ban Meta (Gen 2)",
    };
    [self emitOnSessionStarted:sessionData];
    resolve(sessionData);
  });
}

- (void)endSession:(NSString *)sessionId
           resolve:(RCTPromiseResolveBlock)resolve
           rejecter:(RCTPromiseRejectBlock)reject {
  _isStreamingVideo = NO;
  [self emitOnSessionEnded:@{@"sessionId": sessionId}];
  resolve(nil);
}

- (void)capturePhoto:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject {
  // Mock: 1x1 PNG transparente en base64
  // TODO: Replace mock — usar Meta SDK camera capture
  NSDictionary *frame = @{
    @"base64": @"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    @"width": @(1920),
    @"height": @(1080),
    @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000),
  };
  resolve(frame);
}

- (void)startVideoStream:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject {
  _isStreamingVideo = YES;
  // TODO: Replace mock — usar Meta SDK video stream
  [self emitMockFrames];
  resolve(nil);
}

- (void)stopVideoStream:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject {
  _isStreamingVideo = NO;
  resolve(nil);
}

- (void)speakText:(NSString *)text
          resolve:(RCTPromiseResolveBlock)resolve
          rejecter:(RCTPromiseRejectBlock)reject {
  // TODO: Replace — usar altavoces de Meta SDK cuando esté disponible
  // Fallback: iOS AVSpeechSynthesizer
  AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:text];
  utterance.voice = [AVSpeechSynthesisVoice voiceWithLanguage:@"es-MX"];
  utterance.rate = 0.5;
  [_synthesizer speakUtterance:utterance];
  resolve(nil);
}

- (void)addListener:(NSString *)eventName {
  _hasListeners = YES;
}

- (void)removeListeners:(double)count {
  if (count == 0) _hasListeners = NO;
}

#pragma mark - Private helpers

- (void)emitMockFrames {
  if (!_isStreamingVideo || !_hasListeners) return;
  NSDictionary *frame = @{
    @"base64": @"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    @"width": @(1280), @"height": @(720),
    @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000),
  };
  [self emitOnCameraFrame:frame];
  __weak typeof(self) weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 2 * NSEC_PER_SEC),
                 dispatch_get_main_queue(), ^{
    [weakSelf emitMockFrames];
  });
}

- (NSString *)iso8601Now {
  NSISO8601DateFormatter *fmt = [[NSISO8601DateFormatter alloc] init];
  return [fmt stringFromDate:[NSDate date]];
}

// Métodos emit generados por CodeGen (declarados en el spec)
- (void)emitOnSessionStarted:(NSDictionary *)data { /* CodeGen genera esto */ }
- (void)emitOnSessionEnded:(NSDictionary *)data { /* CodeGen genera esto */ }
- (void)emitOnCameraFrame:(NSDictionary *)data { /* CodeGen genera esto */ }

@end
```

**Header** `ios/FieldVision/NativeMetaGlasses/MetaGlassesModule.h`:
```objc
#import <React/RCTEventEmitter.h>

@interface MetaGlassesModule : RCTEventEmitter
@end
```

---

## Implementación Android (Kotlin)

Archivo: `android/app/src/main/java/com/fieldvision/MetaGlassesModule.kt`

```kotlin
package com.fieldvision

import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.fieldvision.NativeMetaGlassesCxxSpec  // generado por CodeGen
import android.os.Handler
import android.os.Looper
import java.util.*

// Nombre debe coincidir con TurboModuleRegistry.getEnforcing('NativeMetaGlasses')
@ReactModule(name = MetaGlassesModule.NAME)
class MetaGlassesModule(reactContext: ReactApplicationContext) :
    NativeMetaGlassesCxxSpec(reactContext) {  // implementa spec generada por CodeGen

  companion object {
    const val NAME = "NativeMetaGlasses"
  }

  private val mainHandler = Handler(Looper.getMainLooper())
  private var tts: TextToSpeech? = null
  private var isStreamingVideo = false

  override fun getName() = NAME

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
    super.invalidate()
  }

  // TODO: Replace mock with Meta Wearables SDK — ver docs/03-turbomodules.md
  override fun startSession(promise: Promise) {
    mainHandler.postDelayed({
      val sessionData = Arguments.createMap().apply {
        putString("id", UUID.randomUUID().toString())
        putString("deviceId", "mock-rayban-meta-gen2")
        putString("startedAt", java.time.Instant.now().toString())
        putString("firmwareVersion", "20.0.0")
        putString("model", "Ray-Ban Meta (Gen 2)")
      }
      emitOnSessionStarted(sessionData)
      promise.resolve(sessionData)
    }, 500)
  }

  override fun endSession(sessionId: String, promise: Promise) {
    isStreamingVideo = false
    val body = Arguments.createMap().apply { putString("sessionId", sessionId) }
    emitOnSessionEnded(body)
    promise.resolve(null)
  }

  override fun capturePhoto(promise: Promise) {
    // TODO: Replace mock — Meta SDK camera capture
    val frame = Arguments.createMap().apply {
      putString("base64", "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
      putInt("width", 1920)
      putInt("height", 1080)
      putDouble("timestamp", System.currentTimeMillis().toDouble())
    }
    promise.resolve(frame)
  }

  override fun startVideoStream(promise: Promise) {
    isStreamingVideo = true
    emitMockFrames()
    promise.resolve(null)
  }

  override fun stopVideoStream(promise: Promise) {
    isStreamingVideo = false
    promise.resolve(null)
  }

  override fun speakText(text: String, promise: Promise) {
    // TODO: Replace — usar altavoces Meta SDK cuando esté disponible
    tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "fv-tts")
    promise.resolve(null)
  }

  override fun addListener(eventName: String) {}
  override fun removeListeners(count: Double) {}

  // Métodos emit — CodeGen genera la implementación base
  private fun emitOnSessionStarted(data: WritableMap) {
    reactApplicationContext.emitDeviceEvent("onSessionStarted", data)
  }
  private fun emitOnSessionEnded(data: WritableMap) {
    reactApplicationContext.emitDeviceEvent("onSessionEnded", data)
  }
  private fun emitOnCameraFrame(data: WritableMap) {
    reactApplicationContext.emitDeviceEvent("onCameraFrame", data)
  }

  private fun emitMockFrames() {
    if (!isStreamingVideo) return
    val frame = Arguments.createMap().apply {
      putString("base64", "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
      putInt("width", 1280); putInt("height", 720)
      putDouble("timestamp", System.currentTimeMillis().toDouble())
    }
    emitOnCameraFrame(frame)
    mainHandler.postDelayed({ emitMockFrames() }, 2000)
  }
}
```

**Package** `android/.../MetaGlassesPackage.kt`:
```kotlin
package com.fieldvision

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext

class MetaGlassesPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
    listOf(MetaGlassesModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext) = emptyList<Nothing>()
}
```

---

## Wrapper TypeScript (JS Layer)

Archivo: `src/modules/glasses/infrastructure/native/MetaGlassesNative.ts`

```typescript
import NativeMetaGlasses from '@specs/NativeMetaGlasses';
import type { SessionData, FrameData } from '@specs/NativeMetaGlasses';
import { NativeEventEmitter, NativeModules } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import type { CameraFrame, GlassesSession } from '@shared/types';

// TurboModuleRegistry ya resuelve el módulo — no necesitamos NativeModules.X
const emitter = new NativeEventEmitter(NativeModules.NativeMetaGlasses);

export const MetaGlassesNative = {
  async startSession(): Promise<GlassesSession> {
    const raw: SessionData = await NativeMetaGlasses.startSession();
    return {
      id: raw.id,
      deviceId: raw.deviceId,
      startedAt: new Date(raw.startedAt),  // convierte ISO string a Date
      status: 'connected',
    };
  },

  endSession: (id: string) => NativeMetaGlasses.endSession(id),

  async capturePhoto(): Promise<CameraFrame> {
    const raw: FrameData = await NativeMetaGlasses.capturePhoto();
    return { base64: raw.base64, width: raw.width, height: raw.height, timestamp: raw.timestamp };
  },

  startVideoStream: () => NativeMetaGlasses.startVideoStream(),
  stopVideoStream:  () => NativeMetaGlasses.stopVideoStream(),
  speakText:        (text: string) => NativeMetaGlasses.speakText(text),

  onCameraFrame(cb: (f: CameraFrame) => void): EmitterSubscription {
    return emitter.addListener('onCameraFrame', cb);
  },
  onSessionStarted(cb: (s: GlassesSession) => void): EmitterSubscription {
    return emitter.addListener('onSessionStarted', (raw: SessionData) =>
      cb({ id: raw.id, deviceId: raw.deviceId, startedAt: new Date(raw.startedAt), status: 'connected' })
    );
  },
  onSessionEnded(cb: (id: string) => void): EmitterSubscription {
    return emitter.addListener('onSessionEnded', ({ sessionId }: { sessionId: string }) => cb(sessionId));
  },
  onError(cb: (e: { message: string }) => void): EmitterSubscription {
    return emitter.addListener('onError', cb);
  },
};
```

---

## Integrar SDK real de Meta (cuando esté disponible)

### iOS
1. Descarga `MetaWearablesSDK.xcframework` del Meta Developer Center
2. Copia a `ios/vendor/MetaWearablesSDK.xcframework`
3. En Xcode: Target > Frameworks > Embed & Sign
4. Reemplaza los bloques `// TODO: Replace mock` en `MetaGlassesModule.mm`

### Android
1. Descarga el `.aar` del Meta Developer Center
2. Copia a `android/app/libs/MetaWearablesSDK.aar`
3. En `android/app/build.gradle`: `implementation files('libs/MetaWearablesSDK.aar')`
4. Reemplaza los bloques `// TODO: Replace mock` en `MetaGlassesModule.kt`

---

## Re-generar bindings tras cambiar la spec

Cada vez que modifiques `src/specs/NativeMetaGlasses.ts`:

```bash
# iOS
cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install && cd ..

# Android
cd android && ./gradlew generateCodegenArtifactsFromSchema && cd ..
```

Los archivos generados van en `build/` — **no los commitees a Git**.

---

## Agregar un nuevo método

1. Agregar al `Spec` en `src/specs/NativeMetaGlasses.ts`
2. Regenerar CodeGen (comandos arriba)
3. Implementar en `MetaGlassesModule.mm` (iOS)
4. Implementar en `MetaGlassesModule.kt` (Android)
5. Agregar al wrapper en `MetaGlassesNative.ts`
6. Si es relevante para dominio, agregar a `IGlassesRepository.ts`
