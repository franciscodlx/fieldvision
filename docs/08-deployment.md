# 08 — Deployment

## Checklist pre-release

```
[ ] npm run type-check → 0 errores TS 6
[ ] npm test → todos pasan
[ ] npm run lint → 0 warnings
[ ] .env con keys LIVE (pk_live_, sk-ant-api03-)
[ ] APP_ENV=production
[ ] Versión incrementada en package.json, Info.plist y build.gradle
[ ] Screenshots para las stores (mínimo 3 por plataforma)
[ ] Privacy Policy URL activa
```

## iOS — App Store

### Build

```bash
cd ios
xcodebuild -workspace FieldVision.xcworkspace \
  -scheme FieldVision \
  -configuration Release \
  -archivePath ./build/FieldVision.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath ./build/FieldVision.xcarchive \
  -exportOptionsPlist ./ExportOptions.plist \
  -exportPath ./build/
```

`ExportOptions.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>method</key><string>app-store</string>
  <key>teamID</key><string>TU_TEAM_ID</string>
  <key>uploadSymbols</key><true/>
</dict></plist>
```

### App Store Connect

1. New App → Bundle ID: `com.fieldvision.app`
2. Categoría: Business → Subcategoría: Productivity
3. Screenshots iPhone 6.7" (1290×2796): mínimo 3
4. Keywords (máx 100 chars): `técnico,campo,IA,lentes,diagnóstico,Ray-Ban`
5. **Nota para el reviewer** (importante — requiere hardware especial):
   ```
   Esta app requiere lentes Ray-Ban Meta para su función principal.
   Sin los lentes, la app corre en modo mock: al presionar "Conectar lentes"
   la conexión simulada se establece en 0.5 segundos automáticamente.
   Las funciones de análisis de IA funcionan normalmente en el simulador.
   ```

### Permisos en Info.plist

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>FieldVision se conecta a tus lentes Ray-Ban Meta vía Bluetooth.</string>
<key>NSCameraUsageDescription</key>
<string>FieldVision accede a la cámara de tus lentes para análisis técnico.</string>
<key>NSMicrophoneUsageDescription</key>
<string>FieldVision usa el micrófono de tus lentes para comandos de voz.</string>
```

## Android — Google Play

### Build

```bash
cd android
./gradlew bundleRelease \
  -PKEYSTORE_PASSWORD=tupassword \
  -PKEY_PASSWORD=tupassword
# Salida: android/app/build/outputs/bundle/release/app-release.aab
```

En `android/app/build.gradle`:
```groovy
signingConfigs {
  release {
    storeFile file('fieldvision-release.keystore')
    storePassword System.getenv("KEYSTORE_PASSWORD")
    keyAlias "fieldvision"
    keyPassword System.getenv("KEY_PASSWORD")
  }
}
```

### Google Play Console

1. All apps > Create app
2. Rollout: empieza con 20% → monitorea crashes → sube a 100%
3. **Data safety**: declara que la app recopila imágenes de cámara (frames de los lentes)

## Privacy Policy (obligatorio)

Genera en https://privacypolicygenerator.info/ y publica en `https://fieldvision.app/privacy`.

Datos que recopila FieldVision:
- Imágenes de la cámara de los lentes (procesadas, no almacenadas sin consentimiento)
- Datos de sesión y análisis (en Supabase, cifrados)
- Email y nombre para la cuenta

---
---

