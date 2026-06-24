# FieldVision — Estado para correr local y desplegar a Stores

> Generado el 2026-06-23. Resume qué se arregló, qué funciona y qué falta.

---

## ✅ Lo que ya funciona

### Android — corre local en emulador
- Compila (`./gradlew :app:assembleDebug` → `app-debug.apk`, 123 MB).
- Instala y arranca en el emulador `Medium_Phone_API_36.1`.
- Renderiza la pantalla de **Login** en modo mock, sobre **Nueva Arquitectura (Fabric)**.
- `npm run type-check` → 0 errores · `npm test` → 52/52.

### iOS — corre local en simulador
- Compila, instala y arranca en el simulador **iPhone 17 (iOS 26.0)**.
- Renderiza la pantalla de **Login** en modo mock (idéntica a Android), bundle id `com.fieldvision.app`.
- Pods instalados (76) con codegen actualizado.
- Runtime de simulador iOS 26.5 ya instalado (`xcodebuild -downloadPlatform iOS`).

---

## 🛠️ Bugs reales arreglados (el build previo solo había corrido `tsc`+`jest`, nunca un bundle/run real)

1. **`tsconfig.json`** — `baseUrl` deprecado en TS 6 rompía `type-check`. Se quitó y se hicieron relativos los `paths`.
2. **`react-native-safe-area-context` 4.14 → 5.8** — su C++ usaba `yoga::StyleLength::unit`, que RN 0.84 eliminó. Rompía el build nativo de Android.
3. **Alias `@modules/*` en Metro** — solo estaban en `tsconfig`/Jest, no en runtime. Se agregó `babel-plugin-module-resolver` en `babel.config.js`. Sin esto Metro no bundleaba.
4. **`react-native-url-polyfill`** — `@supabase/supabase-js` lanzaba `Cannot assign to property 'protocol'` en Hermes al crear el cliente. Se importa `react-native-url-polyfill/auto` en `index.js`.

> Los fixes 3 y 4 son de JS y **también aplican a iOS** — iOS arrancará igual una vez instalado el runtime de simulador.

---

## 👤 Usuario de prueba (modo desarrollo, sin backend)

La auth no tenía mock (siempre pegaba a Supabase real, con URL placeholder → fallaba).
Se agregó un `MockAuthRepository` que se activa **automáticamente** cuando `SUPABASE_URL`
es el placeholder. Al poner keys reales de Supabase en `.env`, vuelve solo al repo real.

```
Email:       tecnico@fieldvision.app
Contraseña:  password123
```
> En modo demo acepta **cualquier** email válido + contraseña ≥ 6 caracteres y entra como
> "Técnico Demo" (plan pro). Verificado en Android: login → Dashboard. Aplica igual a iOS.
> Archivos: `src/modules/auth/infrastructure/services/MockAuthRepository.ts` y `authRepositoryFactory.ts`.

## 📱 Para correr local

### Android (funcionando)
```bash
# emulador
~/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 &
npm start                        # Metro
npx react-native run-android
```

### iOS (funcionando)
```bash
npm start                        # Metro
npx react-native run-ios         # o: --udid <id de un simulador iOS 26.x>
```
> Nota: se instaló el runtime de simulador iOS 26.5 con `xcodebuild -downloadPlatform iOS`
> (Xcode 26.5 venía sin él tras la actualización). Si en el futuro vuelve a faltar,
> ese mismo comando o Xcode → Settings → Components lo reinstala.

---

## 🚀 Despliegue a Stores

### iOS — App Store (configurado lo que no requiere cuenta)
- ✅ Bundle ID: `org.reactjs.native.example.*` → **`com.fieldvision.app`** (Debug + Release).
- ✅ `ios/ExportOptions.plist` creado (placeholder `TU_TEAM_ID`).
- ✅ `Info.plist`: descripción de uso de Location (estaba vacía → rechazo) + `NSBluetoothAlwaysUsageDescription`.
- ⛔ **Requiere cuenta Apple Developer ($99/año)**: Team ID, firma (signing), perfil de aprovisionamiento.
- 📝 Cuando el SDK real de Meta acceda a cámara/micrófono del teléfono, añade
  `NSCameraUsageDescription` y `NSMicrophoneUsageDescription` (Apple cuestiona permisos no usados).

### Android — Google Play (configurado y probado)
- ✅ Keystore de release: `android/app/fieldvision-release.keystore` (alias `fieldvision`, fuera de git).
- ✅ Credenciales en `android/keystore.properties` (gitignored).
- ✅ `android/app/build.gradle`: `signingConfigs.release` + el buildType release lo usa.
  Genera el AAB con:
  ```bash
  cd android && ./gradlew bundleRelease
  # → android/app/build/outputs/bundle/release/app-release.aab
  ```
- ⛔ **Requiere cuenta Google Play Console ($25 único)**.
- ⚠️ Resguarda el keystore y sus contraseñas: si lo pierdes, no puedes volver a publicar la app.

### Pendiente para AMBAS (requiere cuentas / keys / contenido)
- [ ] `.env` con keys reales (hoy todo `PLACEHOLDER`): Claude, Supabase, Stripe.
- [ ] `APP_ENV=production` para builds de release.
- [ ] Subir `versionCode`/`versionName` (Android) y `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` (iOS) en cada release.
- [ ] Ícono de app y splash definitivos.
- [ ] Screenshots (mín. 3 por plataforma; iPhone 6.7" 1290×2796).
- [ ] Privacy Policy publicada en una URL activa.
- [ ] Descripción, keywords, categoría (Business/Productivity).
- [ ] Nota al reviewer de Apple: la app requiere lentes Ray-Ban Meta; sin ellos corre en modo mock.
- [ ] Data safety (Play) / privacy nutrition labels (Apple): declarar imágenes de cámara y datos de cuenta.

---

## Credenciales del keystore Android (guárdalas en un gestor seguro)
```
keystore : android/app/fieldvision-release.keystore
alias    : fieldvision
storepass: fieldvision2026
keypass  : fieldvision2026
```
> Estas son de desarrollo. Para producción real conviene generar uno nuevo con contraseñas fuertes.
