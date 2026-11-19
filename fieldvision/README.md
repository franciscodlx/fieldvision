# FieldVision

Asistente técnico de campo **manos libres** con lentes **Ray-Ban Meta**: el técnico mira algo, los lentes
capturan una foto o un clip de video, **Meta Muse Spark** lo analiza y el diagnóstico se escucha por los
altavoces de los lentes.

| | |
|---|---|
| App | React Native **0.84** (bare, sin Expo) · Nueva Arquitectura / TurboModules · TypeScript · Zustand · TanStack Query |
| Lentes | SDK oficial **Meta Wearables Device Access Toolkit** (`meta-wearables-dat-ios` 0.9.0) — iOS real, Android en mock |
| IA de visión | **Meta Model API** · `muse-spark-1.3` (foto y clip de hasta 8 fotogramas) — Claude / GPT-4o como alternativa |
| Login | **Supabase Auth** (o login de prueba si no hay Supabase) |
| Bundle / Team | iOS `com.fieldvision.app` · Apple Team `Z2G8RSF85P` |

---

## 1. Requisitos

| Herramienta | Versión |
|---|---|
| macOS + **Xcode** | 26 o superior (probado con Xcode 27 / iOS 27) |
| **Node.js** | ≥ 22.11 (`node -v`) |
| Ruby + Bundler | el de macOS sirve (`bundle -v`) — instala CocoaPods |
| iPhone físico | **iOS 17.2+** (lo exige el SDK de Meta). Los lentes **no** funcionan en el simulador |
| Android (opcional) | Android Studio + JDK 17 + un emulador API 36 |
| Lentes | Ray-Ban Meta Gen 1/Gen 2 (u Oakley Meta) con firmware **V126+** |
| App **Meta AI** | **V282+** en el mismo iPhone |

---

## 2. Cuentas y claves (dónde dar de alta cada cosa)

Resumen de qué es obligatorio para cada nivel de prueba:

| Servicio | ¿Para qué? | Obligatorio para probar | Variable |
|---|---|---|---|
| Apple Developer | Instalar en el iPhone | ✅ (cuenta gratis basta para dev) | — (Xcode) |
| Meta AI (app) + Developer Mode | Conectar los lentes | ✅ para usar lentes reales | — |
| **Meta Model API** | IA de visión (Muse Spark) | ✅ si no, la IA queda en **modo demo** | `MUSE_API_KEY` |
| Supabase | Login real | ❌ sin él entra el login de prueba | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Wearables Developer Center | Publicar a usuarios | ❌ solo producción | `Info.plist` → `MWDAT` |
| Anthropic / OpenAI | IA alternativa | ❌ | `CLAUDE_API_KEY` / `OPENAI_API_KEY` |
| Stripe | Planes de pago (aún no conectado en el código) | ❌ | `STRIPE_*` |

### 2.1 Meta Model API — Muse Spark (IA de visión)

1. Entra a **https://dev.meta.ai** con tu cuenta de Meta.
2. Activa la **facturación** (Billing) — Muse se cobra por tokens.
3. **API keys → Create key** → nombre `fieldvision`. Copia la clave (empieza por `LLM_`); solo se muestra una vez.
4. En **Models**, confirma que `muse-spark-1.3` está habilitado para tu equipo.
5. Prueba la clave:

   ```bash
   export K=LLM_tu_clave
   curl -s https://api.meta.ai/v1/chat/completions \
     -H "Authorization: Bearer $K" \
     -H "Content-Type: application/json" \
     -d '{"model":"muse-spark-1.3","messages":[{"role":"user","content":"hola"}]}'
   ```

   Respuesta con `choices` = OK · `401` = clave mal · `404` = modelo no habilitado.

Coste aproximado: ≈ 0.005 USD por foto, ≈ 0.03 USD por clip. `muse-ember-1.0` es ~12× más barato.
Detalle técnico: [`docs/11-muse-vision.md`](docs/11-muse-vision.md).

### 2.2 Supabase — login (opcional)

Sin Supabase, la app usa un login en memoria: `tecnico@fieldvision.app` / `password123`
(cualquier email válido + contraseña ≥ 6 caracteres).

Para login real:

1. **https://supabase.com/dashboard → New project** → nombre `fieldvision`, región cercana. Guarda la contraseña de BD.
2. **Project Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** / *publishable* → `SUPABASE_ANON_KEY`
   - `service_role` → **nunca** en la app.
3. **Authentication → Sign In / Providers → Email** → apaga **Confirm email**
   (si no, el registro desde la app falla con `confirm_email`).
4. **Authentication → Users → Add user** → email + contraseña + **Auto Confirm User**
   (o regístrate desde la app).

Hoy solo se usa **Auth**; no hace falta crear tablas. El esquema futuro está en
[`docs/04-api-integrations.md`](docs/04-api-integrations.md).

### 2.3 Lentes Ray-Ban Meta (app Meta AI)

1. Actualiza **Meta AI a V282+** y el **firmware de los lentes a V126+**.
2. Empareja los lentes con Meta AI en el iPhone.
3. Activa **Developer Mode**: Meta AI → *Settings* → *Your glasses* → *Developer Mode*.
4. La primera vez que toques **Conectar lentes**, Meta AI se abrirá: aprueba **FieldVision** y concede el
   permiso de **cámara** (*Settings* → *App connections* → FieldVision).

En desarrollo `Info.plist` usa `MWDAT.MetaAppID = 0`, así que **no** hace falta registrar nada en el
Wearables Developer Center. Para producción y diagnóstico: [`docs/META-DAT-INTEGRATION.md`](docs/META-DAT-INTEGRATION.md).

### 2.4 Apple (firma en el iPhone)

1. Xcode → *Settings* → *Accounts* → añade tu Apple ID.
2. Abre `ios/FieldVision.xcworkspace` → target **FieldVision** → *Signing & Capabilities* →
   Team **`Z2G8RSF85P`** (o el tuyo; si cambias de team, cambia también el bundle ID).
3. En el iPhone: *Ajustes → Privacidad y seguridad → Modo desarrollador* activado, y la primera vez
   confía en el certificado en *Ajustes → General → VPN y gestión de dispositivos*.

---

## 3. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` (está en `.gitignore`; **nunca lo subas**):

```bash
# IA de visión
VISION_PROVIDER=muse                 # muse | claude | openai
MUSE_API_KEY=LLM_xxxxxxxx
MUSE_VISION_MODEL=muse-spark-1.3     # o muse-ember-1.0

# Login (déjalo en placeholder para usar el login de prueba)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=xxxxxxxx

# Opcionales
CLAUDE_API_KEY=sk-ant-PLACEHOLDER
OPENAI_API_KEY=sk-openai-PLACEHOLDER
META_APP_TOKEN=meta-wearables-PLACEHOLDER   # no lo usa el SDK actual; se puede dejar así
STRIPE_PUBLISHABLE_KEY=pk_test_PLACEHOLDER
APP_ENV=development                  # production en builds de release
TTS_PROVIDER=system
CAPTURE_INTERVAL_MS=0
```

> ⚠️ Los valores del `.env` se **incrustan en el bundle** de JavaScript (react-native-dotenv).
> Después de cambiar el `.env` arranca Metro con `--reset-cache`, o la app seguirá con los valores viejos.
> Por lo mismo, la `MUSE_API_KEY` viaja dentro de la app: sirve para pruebas; en producción la llamada
> a Muse debe pasar por un backend (Edge Function / Lambda).

---

## 4. Instalar y levantar

```bash
cd fieldvision
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```

(Los pods solo se reinstalan tras clonar o al cambiar dependencias nativas.)

### iPhone físico (con lentes)

Terminal 1 — Metro:

```bash
npm start -- --reset-cache
```

Terminal 2 — compilar e instalar:

```bash
npx react-native run-ios --device            # o --device "Nombre de tu iPhone"
```

El iPhone y la Mac deben estar en la **misma red Wi-Fi** para que la app descargue el bundle de Metro.

### Simulador / Android (sin lentes)

```bash
npx react-native run-ios                     # simulador iOS
npx react-native run-android                 # emulador Android (lentes en mock)
```

### Logs

Los `console.*` de la app ya no salen en la terminal de Metro: pulsa **`j`** en Metro para abrir
**React Native DevTools**. Los errores de IA aparecen como `[FieldVision] análisis falló:`.

---

## 5. Probar

1. Inicia sesión (Supabase o login de prueba).
2. **Conectar lentes** → aprueba en Meta AI si lo pide.
3. **Analizar ahora** → foto. El detalle termina en `(muse-spark-1.3 · foto)`.
4. **Analizar video (5 s)** → los lentes dicen "Grabando clip"; el detalle termina en
   `(… · clip de N fotogramas)`.
5. El diagnóstico se escucha en los lentes. Si falla, también dicen la causa
   (clave inválida, modelo no habilitado, límite de peticiones, sin conexión…).

Si ves el aviso amarillo **"IA en modo demo"**, la `MUSE_API_KEY` es placeholder o no se recargó el `.env`.

---

## 6. Calidad (antes de cada commit)

```bash
npm run type-check
npm test
npm run lint
```

---

## 7. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| Sigue en "modo demo" tras poner la clave | `npm start -- --reset-cache` y vuelve a abrir la app |
| `No script URL provided` / pantalla roja al abrir | Metro no está corriendo o el iPhone no está en la misma Wi-Fi |
| Los lentes dicen "La clave de Muse es inválida" | Revisa `MUSE_API_KEY` en `.env` (sin comillas ni espacios) |
| "El modelo de Muse no está habilitado" | dev.meta.ai → Models → habilita `muse-spark-1.3` |
| El registro falla con `confirm_email` | Supabase → Auth → Email → apaga *Confirm email* |
| No conecta con los lentes | Developer Mode en Meta AI, lentes desplegados y con batería; ver tabla de [`docs/META-DAT-INTEGRATION.md`](docs/META-DAT-INTEGRATION.md) |
| Error de firma en Xcode | Elige tu Team en *Signing & Capabilities* |
| Falla `pod install` | `cd ios && bundle exec pod install --repo-update` |

---

## 8. Documentación

| Doc | Contenido |
|---|---|
| [`docs/01-architecture.md`](docs/01-architecture.md) | Arquitectura DDD + flujo TurboModule |
| [`docs/02-setup.md`](docs/02-setup.md) | Entorno desde cero |
| [`docs/03-turbomodules.md`](docs/03-turbomodules.md) | Nueva Arquitectura / CodeGen |
| [`docs/04-api-integrations.md`](docs/04-api-integrations.md) | Supabase, Claude, OpenAI |
| [`docs/05-registrations.md`](docs/05-registrations.md) | Altas en servicios externos |
| [`docs/06-payments.md`](docs/06-payments.md) | Stripe (pendiente de integrar) |
| [`docs/07-testing.md`](docs/07-testing.md) | Tests |
| [`docs/08-deployment.md`](docs/08-deployment.md) | App Store y Google Play |
| [`docs/09-env-variables.md`](docs/09-env-variables.md) | Variables de entorno |
| [`docs/10-roadmap.md`](docs/10-roadmap.md) | Próximas features |
| [`docs/11-muse-vision.md`](docs/11-muse-vision.md) | IA de visión con Muse Spark (foto y video) |
| [`docs/META-DAT-INTEGRATION.md`](docs/META-DAT-INTEGRATION.md) | SDK de los lentes, producción y diagnóstico |

## Estado

- ✅ iOS con lentes reales, IA con Muse Spark (foto + video), login Supabase.
- ⏳ Android: SDK de Meta sin integrar (mock).
- ⏳ Producción: mover la llamada a Muse a un backend, `MetaAppID` real + release channel, Stripe.
