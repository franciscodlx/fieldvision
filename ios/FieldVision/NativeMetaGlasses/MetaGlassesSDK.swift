import Foundation
import UIKit
import MWDATCore
import MWDATCamera

/// Puente entre el TurboModule (`MetaGlassesModule.mm`, Objective-C++) y el
/// Meta Wearables Device Access Toolkit, que solo expone API de Swift cómoda.
///
/// Flujo real de los lentes:
///   configure → registro con Meta AI → permiso de cámara → DeviceSession →
///   Camera + Stream → capturePhoto / frames de video.
///
/// El SDK **exige un stream de cámara activo** para poder tomar una foto:
/// `capturePhoto` sin stream no devuelve nada.
@objc(MetaGlassesSDK)
final class MetaGlassesSDK: NSObject {

  @objc static let shared = MetaGlassesSDK()

  private static let errorDomain = "FieldVision.MetaGlasses"

  private var isConfigured = false
  /// Se crea en cuanto el SDK queda configurado: `AutoDeviceSelector` se alimenta de
  /// `devicesStream()` de forma asíncrona, así que necesita tiempo para resolver los
  /// lentes activos. Crearlo justo antes de `createSession` provoca `noEligibleDevice`.
  private var deviceSelector: AutoDeviceSelector?
  private var session: DeviceSession?
  private var camera: Camera?
  private var stream: MWDATCamera.Stream?
  private var photoToken: (any AnyListenerToken)?
  private var frameToken: (any AnyListenerToken)?
  private var pendingPhotos: [(String?, NSError?) -> Void] = []
  private let lock = NSLock()

  private static func error(_ code: Int, _ message: String) -> NSError {
    NSError(domain: errorDomain, code: code, userInfo: [NSLocalizedDescriptionKey: message])
  }

  // MARK: - Configuración y registro

  /// Se llama una sola vez al arrancar la app. Devuelve nil si todo fue bien.
  @discardableResult
  @objc(configureIfNeeded) func configureIfNeeded() -> NSError? {
    if isConfigured { return nil }
    do {
      try Wearables.configure()
      isConfigured = true
      deviceSelector = AutoDeviceSelector(wearables: Wearables.shared)
      return nil
    } catch {
      // `alreadyConfigured` no es un fallo real: el SDK ya estaba listo.
      if case .alreadyConfigured = error {
        isConfigured = true
        if deviceSelector == nil {
          deviceSelector = AutoDeviceSelector(wearables: Wearables.shared)
        }
        return nil
      }
      return Self.error(1, "No se pudo configurar el SDK de Meta Wearables: \(error)")
    }
  }

  /// 0 unavailable · 1 available · 2 registering · 3 registered
  @objc(registrationState) var registrationState: Int {
    Wearables.shared.registrationState.rawValue
  }

  /// Abre la app de Meta AI para que el usuario autorice FieldVision.
  @objc(startRegistrationWithCompletion:) func startRegistration(completion: @escaping (NSError?) -> Void) {
    Task {
      do {
        try await Wearables.shared.startRegistration()
        completion(nil)
      } catch {
        completion(Self.error(2, "Falló el registro con Meta AI: \(error)"))
      }
    }
  }

  /// Meta AI regresa a la app por el URL scheme declarado en `MWDAT.AppLinkURLScheme`.
  @objc(handleURL:completion:) func handleURL(_ url: URL, completion: @escaping (Bool) -> Void) {
    Task {
      let handled = (try? await Wearables.shared.handleUrl(url)) ?? false
      completion(handled)
    }
  }

  /// "granted" | "denied"
  @objc(requestCameraPermissionWithCompletion:) func requestCameraPermission(completion: @escaping (NSString?, NSError?) -> Void) {
    Task {
      do {
        let status = try await Wearables.shared.requestPermission(.camera)
        completion(status == .granted ? "granted" : "denied", nil)
      } catch {
        completion(nil, Self.error(3, "No se pudo pedir el permiso de cámara: \(error)"))
      }
    }
  }

  /// Diagnóstico para la UI: qué falta para poder capturar.
  @objc(statusWithCompletion:) func status(completion: @escaping (NSDictionary) -> Void) {
    Task {
      let devices = Wearables.shared.devices
      var permission = "unknown"
      if let status = try? await Wearables.shared.checkPermissionStatus(.camera) {
        permission = status == .granted ? "granted" : "denied"
      }
      completion([
        "configured": isConfigured,
        "registrationState": Wearables.shared.registrationState.rawValue,
        "deviceCount": devices.count,
        "cameraPermission": permission,
        "sessionActive": session != nil,
        "deviceDetail": diagnoseNoDevice(),
      ] as NSDictionary)
    }
  }

  // MARK: - Sesión con los lentes

  @objc(startSessionWithCompletion:) func startSession(completion: @escaping (NSDictionary?, NSError?) -> Void) {
    if let configError = configureIfNeeded() {
      completion(nil, configError)
      return
    }

    Task {
      // 1. Registro con Meta AI (abre la app de Meta si hace falta).
      if Wearables.shared.registrationState != .registered {
        do {
          try await Wearables.shared.startRegistration()
        } catch {
          completion(nil, Self.error(4, "FieldVision no está registrada en Meta AI: \(error)"))
          return
        }
        // Esperar a que el usuario apruebe en la app de Meta AI.
        for await state in Wearables.shared.registrationStateStream() where state == .registered {
          break
        }
      }

      // 2. Permiso de cámara de los lentes (se concede en la app de Meta AI).
      //    Solo se pide si aún no está concedido, para no reabrir Meta AI en cada intento.
      do {
        var status = (try? await Wearables.shared.checkPermissionStatus(.camera)) ?? .denied
        if status != .granted {
          status = try await Wearables.shared.requestPermission(.camera)
        }
        guard status == .granted else {
          completion(nil, Self.error(5, "El permiso de cámara de los lentes está denegado. Actívalo en Meta AI → Settings → App connections → FieldVision."))
          return
        }
      } catch {
        completion(nil, Self.error(5, "No se pudo obtener el permiso de cámara: \(error)"))
        return
      }

      // 3. Sesión con los lentes. El selector resuelve el dispositivo activo de forma
      //    asíncrona; pedir la sesión antes de que lo haya resuelto devuelve `noEligibleDevice`.
      guard let selector = self.deviceSelector else {
        completion(nil, Self.error(6, "El SDK de Meta no quedó configurado."))
        return
      }
      guard await self.waitForEligibleDevice(selector: selector, seconds: 20) else {
        completion(nil, Self.error(6, "No hay lentes elegibles para abrir la sesión. \(self.diagnoseNoDevice())"))
        return
      }

      let newSession: DeviceSession
      do {
        newSession = try Wearables.shared.createSession(deviceSelector: selector)
        try newSession.start()
      } catch {
        completion(nil, Self.error(6, "No se pudo abrir la sesión con los lentes: \(error). \(self.diagnoseNoDevice())"))
        return
      }
      for await state in newSession.stateStream() {
        if state == .started { break }
        if state == .stopped {
          completion(nil, Self.error(7, "Los lentes cerraron la sesión antes de iniciarla."))
          return
        }
      }

      // 4. Cámara + stream. El stream debe estar activo para poder capturar fotos.
      let newCamera: Camera?
      do {
        let config = StreamConfiguration(videoCodec: .raw, resolution: .medium, frameRate: 24)
        newCamera = try newSession.addCamera(config: config)
      } catch {
        newSession.stop()
        completion(nil, Self.error(8, "No se pudo activar la cámara de los lentes: \(error)"))
        return
      }
      guard let activeCamera = newCamera else {
        newSession.stop()
        completion(nil, Self.error(8, "La sesión no aceptó la cámara (¿los lentes siguen conectados?)."))
        return
      }

      let activeStream = activeCamera.stream
      self.session = newSession
      self.camera = activeCamera
      self.stream = activeStream
      self.attachPhotoListener(to: activeStream)
      activeStream.start()

      let deviceId = newSession.deviceId
      completion([
        "id": UUID().uuidString,
        "deviceId": deviceId,
        "startedAt": ISO8601DateFormatter().string(from: Date()),
        "firmwareVersion": "",
        "model": "Meta AI glasses",
      ] as NSDictionary, nil)
    }
  }

  /// `AutoDeviceSelector` publica el dispositivo activo de forma asíncrona.
  /// Devuelve true en cuanto haya uno, o false al agotar el tiempo.
  private func waitForEligibleDevice(selector: AutoDeviceSelector, seconds: Int) async -> Bool {
    let deadline = Date().addingTimeInterval(TimeInterval(seconds))
    while Date() < deadline {
      if selector.activeDevice != nil { return true }
      try? await Task.sleep(nanoseconds: 300_000_000)
    }
    return selector.activeDevice != nil
  }

  /// Traduce el escueto `noEligibleDevice` del SDK a algo accionable.
  private func diagnoseNoDevice() -> String {
    let identifiers = Wearables.shared.devices
    guard !identifiers.isEmpty else {
      return "Meta AI no reporta ningunos lentes. Abre la app de Meta AI, comprueba que los Ray-Ban aparecen conectados y que no están plegados (al plegar las bisagras se corta el Bluetooth)."
    }
    var reasons: [String] = []
    for identifier in identifiers {
      guard let device = Wearables.shared.deviceForIdentifier(identifier) else { continue }
      let name = device.nameOrId()
      switch device.compatibility() {
      case .deviceUpdateRequired:
        reasons.append("\(name): el firmware de los lentes está desactualizado; actualízalo desde la app de Meta AI.")
      case .sdkUpdateRequired:
        reasons.append("\(name): estos lentes piden una versión más nueva del SDK de Meta.")
      case .compatible, .undefined:
        switch device.linkState {
        case .connected:
          reasons.append("\(name): conectado, pero el SDK todavía no lo habilita. Revisa en Meta AI → Settings → App connections que FieldVision tenga el permiso de cámara, y que Developer Mode siga activo.")
        case .connecting:
          reasons.append("\(name): aún conectándose al teléfono; reintenta en unos segundos.")
        case .disconnected:
          reasons.append("\(name): desconectado del teléfono.")
        }
      @unknown default:
        reasons.append("\(name): estado de compatibilidad desconocido.")
      }
    }
    return reasons.isEmpty ? "Meta AI reporta lentes pero sin detalles de estado." : reasons.joined(separator: " ")
  }

  @objc(endSession) func endSession() {
    let token = photoToken
    let frames = frameToken
    photoToken = nil
    frameToken = nil
    camera?.stop()
    session?.stop()
    camera = nil
    stream = nil
    session = nil
    Task {
      await token?.cancel()
      await frames?.cancel()
    }
  }

  // MARK: - Captura

  private func attachPhotoListener(to stream: MWDATCamera.Stream) {
    photoToken = stream.photoDataPublisher.listen { [weak self] (photo: MWDATCamera.PhotoData) in
      guard let self else { return }
      // El SDK entrega JPEG/HEIC crudo; la app lo consume como base64.
      let base64 = photo.data.base64EncodedString()
      self.lock.lock()
      let handlers = self.pendingPhotos
      self.pendingPhotos = []
      self.lock.unlock()
      handlers.forEach { $0(base64, nil) }
    }
  }

  /// Dispara la captura y resuelve cuando llega la foto (o a los 15 s).
  @objc(capturePhotoWithCompletion:) func capturePhoto(completion: @escaping (NSString?, NSError?) -> Void) {
    guard let stream else {
      completion(nil, Self.error(9, "No hay sesión activa con los lentes. Conéctalos primero."))
      return
    }

    var settled = false
    let settle: (String?, NSError?) -> Void = { base64, error in
      guard !settled else { return }
      settled = true
      completion(base64 as NSString?, error)
    }

    lock.lock()
    pendingPhotos.append(settle)
    lock.unlock()

    guard stream.capturePhoto(format: .jpeg) else {
      lock.lock(); pendingPhotos.removeAll(); lock.unlock()
      settle(nil, Self.error(10, "Los lentes rechazaron la captura (estado del stream: \(stream.state))."))
      return
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
      guard let self, !settled else { return }
      self.lock.lock(); self.pendingPhotos.removeAll(); self.lock.unlock()
      settle(nil, Self.error(11, "Los lentes no entregaron la foto en 15 segundos."))
    }
  }

  // MARK: - Video

  @objc(startVideoStreamWithOnFrame:completion:)
  func startVideoStream(onFrame: @escaping (NSString, Int, Int, Double) -> Void,
                        completion: @escaping (NSError?) -> Void) {
    guard let stream else {
      completion(Self.error(9, "No hay sesión activa con los lentes. Conéctalos primero."))
      return
    }
    frameToken = stream.videoFramePublisher.listen { (frame: MWDATCamera.VideoFrame) in
      guard let image = frame.makeUIImage(),
            let jpeg = image.jpegData(compressionQuality: 0.6) else { return }
      onFrame(jpeg.base64EncodedString() as NSString,
              Int(image.size.width),
              Int(image.size.height),
              Date().timeIntervalSince1970 * 1000)
    }
    completion(nil)
  }

  @objc(stopVideoStream) func stopVideoStream() {
    let token = frameToken
    frameToken = nil
    Task { await token?.cancel() }
  }
}
