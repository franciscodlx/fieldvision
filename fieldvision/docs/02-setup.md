# 02 — Setup del entorno (2026)

## Requisitos de sistema

| Herramienta | Versión mínima | Verificar |
|-------------|---------------|-----------|
| macOS | Sonoma 14+ | `sw_vers` |
| Xcode | 16.0+ | `xcode-select --version` |
| Android Studio | Meerkat (2024.3)+ | Help > About |
| Node.js | 22 LTS | `node --version` |
| Ruby | 3.2+ | `ruby --version` |
| CocoaPods | 1.15+ | `pod --version` |
| Java JDK | 17 o 21 | `java --version` |
| Bundler | 2.5+ | `bundler --version` |

> RN 0.84 requiere Node 22 LTS (soporte de Node 18 fue eliminado).
> Java 17 es el mínimo; Java 21 es recomendado para builds más rápidos.

---

## 1. Crear proyecto

```bash
npx @react-native-community/cli@latest init FieldVision \
  --version 0.84.1 \
  --skip-install \
  --directory fieldvision

cd fieldvision
```

> El template de RN 0.84 ya viene con Nueva Arquitectura activa por default,
> `newArchEnabled=true` en `android/gradle.properties` y
> `RCT_NEW_ARCH_ENABLED=1` en el Podfile.

---

## 2. Variables de entorno (react-native-dotenv)

`react-native-config` no mantiene soporte activo para RN 0.84+.
Usamos `react-native-dotenv` (Babel plugin, sin dependencias nativas).

```bash
npm install react-native-dotenv --save-dev
```

En `babel.config.js`:
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: true,          // falla si falta una variable requerida
      allowUndefined: false,
    }],
  ],
};
```

Crea `.env` en la raíz (ver `docs/09-env-variables.md` para valores completos):
```bash
cp .env.example .env
```

Declara los tipos en `src/types/env.d.ts`:
```typescript
declare module '@env' {
  export const CLAUDE_API_KEY: string;
  export const OPENAI_API_KEY: string;
  export const VISION_PROVIDER: string;
  export const TTS_PROVIDER: string;
  export const META_APP_TOKEN: string;
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  export const STRIPE_PUBLISHABLE_KEY: string;
  export const STRIPE_PRICE_STARTER: string;
  export const STRIPE_PRICE_PRO: string;
  export const STRIPE_PRICE_ENTERPRISE: string;
  export const CAPTURE_INTERVAL_MS: string;
  export const APP_ENV: string;
}
```

---

## 3. Instalar dependencias

```bash
npm install
```

**Dependencias de producción:**
```bash
npm install \
  @react-navigation/native@7.2.2 \
  @react-navigation/native-stack@7.3.2 \
  react-native-safe-area-context@4.12.0 \
  react-native-screens@4.4.0 \
  react-native-permissions@4.3.4 \
  @tanstack/react-query@5.96.2 \
  zustand@5.0.12 \
  zod@3.24.1 \
  axios@1.7.9
```

**Dependencias de desarrollo:**
```bash
npm install --save-dev \
  typescript@6.0.2 \
  react-native-dotenv \
  @testing-library/react-native@12.9.0 \
  @testing-library/jest-native@5.4.3 \
  @types/jest@29.5.14
```

---

## 4. Instalar pods iOS (Nueva Arquitectura)

```bash
cd ios

# Instalar dependencias de Ruby si es necesario
bundle install

# Instalar pods con Nueva Arquitectura activa
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install

cd ..
```

> Si `bundle exec pod install` falla con errores de CocoaPods:
> ```bash
> sudo gem install cocoapods
> pod repo update
> RCT_NEW_ARCH_ENABLED=1 pod install
> ```

---

## 5. Configurar tsconfig.json

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@navigation/*": ["src/navigation/*"],
      "@specs/*": ["src/specs/*"],
      "@env": [".env"]
    }
  },
  "include": ["src", "__tests__", "App.tsx", "src/types/env.d.ts"],
  "exclude": ["node_modules", "android", "ios"]
}
```

> `"moduleResolution": "bundler"` es requerido por TypeScript 6 para
> proyectos con Metro bundler.

---

## 6. Configurar package.json (codegenConfig)

En `package.json`, agrega la sección `codegenConfig` para que CodeGen encuentre
las specs de TurboModules:

```json
{
  "codegenConfig": {
    "name": "FieldVisionSpec",
    "type": "modules",
    "jsSrcsDir": "src/specs",
    "android": {
      "javaPackageName": "com.fieldvision"
    }
  }
}
```

---

## 7. Preparar lentes Ray-Ban Meta

> Los lentes conectan vía Bluetooth — necesitas **dispositivo físico iOS** (no simulador).

1. Descarga la app **Meta AI** del App Store en tu iPhone
2. Conecta los lentes y emparéjalos con la app
3. Actualiza firmware a **versión 20.0+**:
   Lentes > Settings > About > Version
4. Activa **Developer Mode**:
   Meta AI app > Settings > App Info — toca el número de versión **5 veces**
   → aparece toggle "Developer Mode" → actívalo → Enable

---

## 8. Registrar tu app en Meta Wearables Developer Center

Ver `docs/05-registrations.md` → sección Meta.

Resumen:
1. `developer.meta.com/wearables` → crear organización → crear proyecto
2. Bundle IDs: `com.fieldvision.app` (iOS y Android)
3. Copiar `META_APP_TOKEN` → pegar en `.env`

---

## 9. Correr la app

```bash
# Terminal 1 — Metro bundler
npm start

# Terminal 2 — iOS simulador (modo mock, sin lentes)
npx react-native run-ios

# Terminal 2 — iOS dispositivo físico (lentes reales)
npx react-native run-ios --device "Mi iPhone"

# Terminal 2 — Android
npx react-native run-android
```

---

## Verificación de la instalación

Con la app corriendo en el simulador:
1. El badge de conexión debe mostrar "disconnected"
2. Al presionar "Conectar lentes" → el badge cambia a "connected" en ~0.5s (modo mock)
3. Al presionar "Analizar ahora" → debe aparecer un análisis con severidad "OK" (respuesta mock del fetch)
4. En la consola de Metro: debe aparecer el warning de PLACEHOLDERs si el `.env` tiene valores placeholder

---

## Errores comunes

**`Error: Unable to find module 'NativeMetaGlasses'`**
```bash
# Re-generar CodeGen y reinstalar pods
cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install && cd ..
```

**`cannot find module '@env'`**
```bash
# Limpiar cache de Metro
npm start -- --reset-cache
```

**`Build failed: Missing target`**
```bash
# Clean de Xcode
cd ios && xcodebuild clean -workspace FieldVision.xcworkspace -scheme FieldVision && cd ..
```

**`Gradle build failed`**
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

**Lentes no se conectan (dispositivo físico)**
- Developer Mode activo en Meta AI app ✓
- Firmware 20.0+ ✓
- `META_APP_TOKEN` correcto en `.env` ✓
- Misma red WiFi/BT que el iPhone ✓
