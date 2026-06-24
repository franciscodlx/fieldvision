# Integración del SDK real de Meta (Wearables Device Access Toolkit)

> Estado: el TurboModule nativo **ya funciona** con cuerpos *mock* (sesión/foto
> simuladas) + **TTS real**. Este documento describe cómo reemplazar el mock por
> el SDK oficial de Meta para capturar foto/video reales de los Ray-Ban Meta.

---

## Decisión de SDK

Usamos el **oficial `facebook/meta-wearables-dat-ios`** (v0.7+, Swift, vía Swift
Package Manager), NO el wrapper de Expo, porque:

- La app es **bare React Native 0.84 (solo Nueva Arquitectura)**; el wrapper de
  comunidad marca Nueva Arquitectura como "untested" y depende de Expo.
- Ya tenemos el **TurboModule nativo** (`ios/FieldVision/NativeMetaGlasses/`)
  funcionando, listo para alojar las llamadas reales.

Para Android: el repo hermano `facebook/meta-wearables-dat-android` (se integra
en `android/app/src/main/java/com/fieldvision/MetaGlassesModule.kt`).

---

## Lo que ya quedó resuelto (no repetir)

- `MetaGlassesModule.mm` **agregado al target Xcode** y compilando.
- **AVFoundation.framework** enlazado al target.
- Selectores del TurboModule corregidos (`resolve:`/`reject:`).
- `NativeEventEmitter` apuntando al propio TurboModule.
- El factory `glassesRepositoryFactory.ts` usa el nativo por defecto.

---

## Pasos para el SDK real (iOS)

### 1. Enrolamiento con Meta (tarea del desarrollador)
1. Crear cuenta en https://wearables.developer.meta.com
2. Registrar la organización y la app; obtener acceso al developer preview.
3. Crear un *release channel* y añadirte como test user.
4. Obtener el **client token / app id** y ponerlo en `.env` como `META_APP_TOKEN`.

### 2. Añadir el SDK por Swift Package Manager
En Xcode (`ios/FieldVision.xcworkspace`): File ▸ Add Package Dependencies ▸
`https://github.com/facebook/meta-wearables-dat-ios` ▸ fijar versión 0.7.x.

### 3. Reemplazar los `// TODO: Replace mock` en `MetaGlassesModule.mm`
Mapear cada método del spec a la API del DAT SDK:

| Método del TurboModule | API DAT (aprox.) |
|---|---|
| `startSession` | inicializar `WearableDeviceManager`, conectar, devolver sesión real |
| `capturePhoto` | `capturePhoto` → base64 del JPEG/HEIC |
| `startVideoStream` | abrir `CameraStream`; emitir frames por el event emitter |
| `stopVideoStream` | cerrar el stream |
| `speakText` | (ya real, AVSpeechSynthesizer) o ruta de audio del SDK |
| `endSession` | desconectar la sesión |

> El contrato JS (`src/specs/NativeMetaGlasses.ts`) NO cambia, así que la capa
> de negocio/UI sigue igual.

### 4. Permisos (Info.plist)
Añadir, además de Bluetooth (ya presente):
```xml
<key>NSCameraUsageDescription</key>
<string>FieldVision usa la cámara de tus lentes para el análisis técnico.</string>
<key>NSMicrophoneUsageDescription</key>
<string>FieldVision usa el micrófono de tus lentes para comandos de voz.</string>
```

### 5. Activar el repo real
Con `META_APP_TOKEN` real en `.env`, el factory ya elige el nativo. Si quieres
distinguir mock vs real dentro del nativo, usa `isMetaSdkConfigured()`.

---

## Límites del developer preview (importante)

- Puedes **probar en tus propios lentes**, pero **NO publicar a usuarios**
  (App Store/Play) hasta ser "select partner" de Meta.
- Es preview (SDK 0.x): la API puede cambiar entre versiones.

## Verificación

```bash
npm run type-check && npm test
npx react-native run-ios --device   # con tus Ray-Ban emparejados
```
