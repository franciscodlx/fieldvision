import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // El SDK de Meta Wearables debe configurarse una sola vez al arrancar.
    if let error = MetaGlassesSDK.shared.configureIfNeeded() {
      NSLog("[FieldVision] MWDAT no se configuró: %@", error.localizedDescription)
    }

    // La ventana la crea SceneDelegate: iOS 27 exige el ciclo de vida UIScene
    // y mata en el arranque a cualquier app que siga usando solo UIWindow aquí.
    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let factory = (UIApplication.shared.delegate as? AppDelegate)?.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    factory.startReactNative(
      withModuleName: "FieldVision",
      in: window,
      launchOptions: nil
    )

    // Meta AI puede devolvernos el control aquí si la app estaba cerrada.
    handleWearablesURLs(connectionOptions.urlContexts)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    handleWearablesURLs(URLContexts)
  }

  /// Callback de registro de la app de Meta AI (esquema `fieldvision://`).
  private func handleWearablesURLs(_ contexts: Set<UIOpenURLContext>) {
    for context in contexts {
      MetaGlassesSDK.shared.handleURL(context.url) { _ in }
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
