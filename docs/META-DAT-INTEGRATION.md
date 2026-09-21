# Integración del SDK real de Meta (Wearables Device Access Toolkit)

> Actualizado el **2026-09-20**. El SDK real **ya está integrado en iOS**.
> Este documento describe qué quedó hecho, qué falta hacer en el Wearables Developer
> Center / la app de Meta AI, y cómo diagnosticar cuando la captura no funciona.

---

## Decisión de librería (revisada en sep 2026)

| Opción | Veredicto |
|---|---|
| **`facebook/meta-wearables-dat-ios` (SPM, v0.9.0)** | ✅ **La que usamos.** Es el SDK oficial, binario (xcframeworks), con API Swift y también API Objective-C (`MWDATWearables`, `MWDATStream`, …). |
| `DJRHails/expo-meta-wearables` | ❌ Descartada. En iOS son **stubs que devuelven `NOT_IMPLEMENTED`** por incompatibilidades de Swift 6, y exige Expo (config plugins). FieldVision es bare RN 0.84 con Nueva Arquitectura. |
| `facebook/meta-wearables-dat-android` | ⏳ Pendiente. Android sigue en mock; los métodos nuevos de la spec responden `not_implemented`. |

El toolkit soporta **Ray-Ban Meta Gen 1 y Gen 2**, Ray-Ban Meta Optics, Meta Ray-Ban Display
y Oakley Meta. Sigue en *developer preview*: se puede probar, no publicar a usuarios finales.

---

## Cómo funciona de verdad la captura de foto

Esto es lo que no era obvio y explica por qué "tomar una foto" no era una sola llamada:

```
Wearables.configure()                     ← una vez, al arrancar la app
        ↓
startRegistration()  →  abre Meta AI  →  el usuario aprueba  →  vuelve por fieldvision://
        ↓
requestPermission(.camera)                ← se concede DENTRO de la app de Meta AI
        ↓
createSession(deviceSelector: AutoDeviceSelector) → session.start() → estado .started
        ↓
session.addCamera(config:) → camera.stream → stream.start() → estado .streaming
        ↓
stream.capturePhoto(format: .jpeg)  →  llega por  stream.photoDataPublisher
```

> ⚠️ **`capturePhoto` solo funciona con un stream de cámara activo.** Sin `stream.start()`
> la llamada se ignora. Ese es el error de diseño más común al integrar el DAT.

---

## Qué quedó hecho en el repo (iOS)

| Archivo | Cambio |
|---|---|
| `ios/FieldVision.xcodeproj` | Paquete SPM `meta-wearables-dat-ios` 0.9.0 con los productos `MWDATCore` y `MWDATCamera`. `IPHONEOS_DEPLOYMENT_TARGET` **15.1 → 17.2** (el xcframework declara `MinimumOSVersion 17.2`). |
| `ios/Podfile` | `post_install` fuerza 17.2 en todos los pod targets. |
| `ios/FieldVision/Info.plist` | Bloque `MWDAT` (`MetaAppID`, `ClientToken`, `TeamID`, `AppLinkURLScheme`), `CFBundleURLTypes` con el esquema `fieldvision`, `LSApplicationQueriesSchemes: fb-viewapp`, `UISupportedExternalAccessoryProtocols: com.meta.ar.wearable`, background modes `bluetooth-central`/`bluetooth-peripheral`/`external-accessory`, y los permisos de cámara, micrófono, red local y Bonjour. |
| `ios/FieldVision/NativeMetaGlasses/MetaGlassesSDK.swift` | **Nuevo.** Puente Swift con el DAT: configure, registro, permiso, sesión, cámara, stream, `capturePhoto`, frames de video. |
| `ios/FieldVision/NativeMetaGlasses/MetaGlassesModule.mm` | Ya no es mock: delega en `MetaGlassesSDK`. El TTS ahora fija `AVAudioSession` en `playback` + `allowBluetoothA2DP` para que la voz salga por los lentes. |
| `ios/FieldVision/AppDelegate.swift` | `Wearables.configure()` al arrancar y manejo del callback `fieldvision://` desde `SceneDelegate`. |
| `src/specs/NativeMetaGlasses.ts` | Métodos nuevos: `getIntegrationStatus()`, `registerWithMetaAI()`, `requestCameraPermission()`. |

### Modo desarrollador vs producción

`Info.plist` está hoy en **modo desarrollador**: `MWDAT.MetaAppID = 0`.
Con ese valor Meta AI **siempre permite el registro** y no hace falta versión ni release channel.

Para producción, cambia `MetaAppID` al App ID real del proyecto
(`1456035589291024`, ya anotado en el comentario del plist) y completa el release channel.

---

## Lo que falta (tareas fuera del código)

### A. En la app de Meta AI del teléfono — imprescindible
1. Instala/actualiza **Meta AI a V282 o superior**.
2. Actualiza el **firmware de los lentes a V126 o superior**.
3. Activa **Developer Mode**: Meta AI → *Settings* → *Your glasses* → *Developer Mode*.
4. Tras el primer "Conectar lentes", aprueba FieldVision cuando Meta AI lo pida y concede
   el permiso de **cámara** (*Settings* → *App connections* → FieldVision).

### B. En el Wearables Developer Center — solo para producción
En la pantalla *Configuration* del proyecto:
- **Team ID**: `Z2G8RSF85P`
- **Bundle ID**: `com.fieldvision.app`
- **Universal link**: para el preview basta el esquema `fieldvision://` que ya está en el plist;
  un universal link real exige un dominio propio con `apple-app-site-association` y el
  entitlement *Associated Domains*. Déjalo pendiente hasta tener dominio.
- **Permissions**: escribe el motivo de uso de la cámara.
- **Distribute**: *Create a new version* → *Assign the version to a release channel* →
  añade tu correo de Meta como tester → acepta la invitación que llega por correo.

---

## Diagnóstico cuando no captura

Llama `getIntegrationStatus()` desde JS; devuelve:

```ts
{
  configured: boolean,          // false → Wearables.configure() falló (revisa el bloque MWDAT)
  registrationState: number,    // 0 unavailable · 1 available · 2 registering · 3 registered
  deviceCount: number,          // 0 → Meta AI no ve lentes conectados
  cameraPermission: string,     // 'granted' | 'denied' | 'unknown'
  sessionActive: boolean,
}
```

| Síntoma | Causa más probable |
|---|---|
| `registrationState = 0` | Meta AI no instalada, o falta `fb-viewapp` en `LSApplicationQueriesSchemes`. |
| `registrationState` nunca llega a 3 | Developer Mode apagado, o el App ID real sin release channel. |
| `cameraPermission = denied` | Falta aprobar en Meta AI → *App connections* → FieldVision. |
| `deviceCount = 0` | Lentes plegados o desconectados del teléfono. Al plegar las bisagras se corta el Bluetooth. |
| La foto nunca llega (timeout 15 s) | El stream no llegó a `.streaming`: poca batería, térmico alto o ancho de banda Bluetooth insuficiente. |

Errores típicos del stream (`MWDATStreamError`): `deviceNotConnected`, `permissionDenied`,
`hingesClosed`, `thermalCritical`, `batteryCritical`, `photoCaptureFailed`.

---

## Verificación

```bash
npm run lint && npm run type-check && npm test
npx react-native run-ios --device "Franciscodlx"   # con los Ray-Ban emparejados
```

## Referencias

- [Guía de integración iOS](https://wearables.developer.meta.com/docs/develop/dat/build-integration-ios/)
- [Getting started](https://wearables.developer.meta.com/docs/develop/dat/getting-started-toolkit)
- [Release channels](https://wearables.developer.meta.com/docs/develop/dat/set-up-release-channels/)
- [Versiones requeridas de Meta AI y firmware](https://wearables.developer.meta.com/docs/develop/dat/version-dependencies/)
- [SDK iOS en GitHub](https://github.com/facebook/meta-wearables-dat-ios)
