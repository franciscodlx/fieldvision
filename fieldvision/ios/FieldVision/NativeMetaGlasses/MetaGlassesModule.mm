#import "MetaGlassesModule.h"
#import <React/RCTLog.h>
#import <AVFoundation/AVFoundation.h>
#import <memory>
#import <ReactCommon/RCTTurboModule.h>
#import <FieldVisionSpec/FieldVisionSpec.h>
// El header generado desde Swift declara también ReactNativeDelegate, cuya superclase
// vive aquí; sin este import el compilador no encuentra la interfaz.
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "FieldVision-Swift.h"

// Implementa NativeMetaGlassesSpec (CodeGen).
// La cámara/sesión reales viven en MetaGlassesSDK.swift, que habla con el
// Meta Wearables Device Access Toolkit. Aquí solo queda el puente a JS y el TTS.

@interface MetaGlassesModule () <AVSpeechSynthesizerDelegate>
@property (nonatomic, strong) AVSpeechSynthesizer *synthesizer;
@end

@implementation MetaGlassesModule

RCT_EXPORT_MODULE(NativeMetaGlasses)

- (instancetype)init {
  self = [super init];
  if (self) {
    _synthesizer = [[AVSpeechSynthesizer alloc] init];
    _synthesizer.delegate = self;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup { return NO; }

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onSessionStarted", @"onSessionEnded", @"onVideoFrame", @"onError"];
}

static void RejectWithError(RCTPromiseRejectBlock reject, NSString *code, NSError *error) {
  reject(code, error.localizedDescription ?: @"Error desconocido de los lentes", error);
}

#pragma mark - Registro y permisos (app de Meta AI)

RCT_EXPORT_METHOD(getIntegrationStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] statusWithCompletion:^(NSDictionary *status) {
    resolve(status);
  }];
}

RCT_EXPORT_METHOD(registerWithMetaAI:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] configureIfNeeded];
  [[MetaGlassesSDK shared] startRegistrationWithCompletion:^(NSError *error) {
    if (error) { RejectWithError(reject, @"registration_failed", error); return; }
    resolve(nil);
  }];
}

RCT_EXPORT_METHOD(requestCameraPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] requestCameraPermissionWithCompletion:^(NSString *status, NSError *error) {
    if (error) { RejectWithError(reject, @"permission_failed", error); return; }
    resolve(status);
  }];
}

#pragma mark - Sesión con los lentes

RCT_EXPORT_METHOD(startSession:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] startSessionWithCompletion:^(NSDictionary *session, NSError *error) {
    if (error) { RejectWithError(reject, @"session_failed", error); return; }
    [self sendEventWithName:@"onSessionStarted" body:session];
    resolve(session);
  }];
}

RCT_EXPORT_METHOD(endSession:(NSString *)sessionId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] endSession];
  [self sendEventWithName:@"onSessionEnded" body:@{@"id": sessionId ?: @""}];
  resolve(nil);
}

#pragma mark - Captura

RCT_EXPORT_METHOD(capturePhoto:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] capturePhotoWithCompletion:^(NSString *base64, NSError *error) {
    if (error) {
      [self sendEventWithName:@"onError" body:@{@"message": error.localizedDescription ?: @""}];
      RejectWithError(reject, @"capture_failed", error);
      return;
    }
    // El SDK entrega la foto ya codificada; el tamaño real lo define la resolución del stream.
    resolve(@{
      @"base64": base64 ?: @"",
      @"width": @(504),
      @"height": @(896),
      @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    });
  }];
}

RCT_EXPORT_METHOD(startVideoStream:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  __weak MetaGlassesModule *weakSelf = self;
  [[MetaGlassesSDK shared]
      startVideoStreamWithOnFrame:^(NSString *base64, NSInteger width, NSInteger height, double timestamp) {
        [weakSelf sendEventWithName:@"onVideoFrame" body:@{
          @"base64": base64 ?: @"",
          @"width": @(width),
          @"height": @(height),
          @"timestamp": @(timestamp)
        }];
      }
      completion:^(NSError *error) {
        if (error) { RejectWithError(reject, @"stream_failed", error); return; }
        resolve(nil);
      }];
}

RCT_EXPORT_METHOD(stopVideoStream:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[MetaGlassesSDK shared] stopVideoStream];
  resolve(nil);
}

#pragma mark - Voz

RCT_EXPORT_METHOD(speakText:(NSString *)text
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    // Reproduce por la ruta de audio activa: si los Ray-Ban están emparejados
    // por Bluetooth, el diagnóstico sale por sus bocinas.
    NSError *audioError = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                            mode:AVAudioSessionModeSpokenAudio
                                         options:AVAudioSessionCategoryOptionAllowBluetoothA2DP
                                           error:&audioError];
    [[AVAudioSession sharedInstance] setActive:YES error:nil];

    AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:text];
    utterance.voice = [AVSpeechSynthesisVoice voiceWithLanguage:@"es-MX"];
    utterance.rate = 0.5;
    [self.synthesizer speakUtterance:utterance];
    resolve(nil);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeMetaGlassesSpecJSI>(params);
}

@end
