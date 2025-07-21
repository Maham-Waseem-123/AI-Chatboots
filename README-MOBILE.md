# 📱 Chrono Heist - Mobile Android Game

**The Time Loop Puzzle** - Now optimized for Android devices!

## 🎮 About

Chrono Heist Mobile brings the innovative time loop puzzle gameplay to Android with:
- **Touch-optimized controls** with virtual D-pad and action buttons
- **Responsive design** that adapts to different screen sizes
- **Tap-to-move** functionality for intuitive navigation
- **Mobile-optimized graphics** and UI elements
- **Hardware acceleration** for smooth performance

## 🔧 Development Setup

### Prerequisites

1. **Node.js** (v14 or higher)
2. **Cordova CLI** (`npm install -g cordova`)
3. **Android Studio** with Android SDK
4. **Java Development Kit (JDK 11)**

### Environment Setup

```bash
# Set Android SDK path
export ANDROID_SDK_ROOT=/path/to/android-sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
export PATH=$PATH:$ANDROID_SDK_ROOT/tools
export PATH=$PATH:$ANDROID_SDK_ROOT/tools/bin

# Set Java path
export JAVA_HOME=/path/to/jdk
```

## 🚀 Building the App

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Android Platform
```bash
cordova platform add android
```

### 3. Build for Android
```bash
# Debug build
cordova build android

# Release build
cordova build android --release
```

### 4. Run on Device/Emulator
```bash
# Run on connected device
cordova run android

# Run on emulator
cordova emulate android
```

## 📱 Mobile-Specific Features

### Touch Controls
- **Virtual D-Pad**: Move character in all directions
- **Action Buttons**: 
  - **E** - Interact with objects
  - **STEALTH** - Toggle stealth mode (blue glow)
  - **TOOL** - Use special tools
  - **R** - Reset current time loop

### Tap-to-Move
- **Tap anywhere on the game canvas** to move toward that location
- **Tap on objects** to automatically interact with them
- **Smart detection** prioritizes object interaction over movement

### Responsive Design
- **Portrait/Landscape support** with automatic UI adjustment
- **Multiple screen sizes** from phones to tablets
- **Scalable graphics** maintain quality across devices
- **Optimized font sizes** for mobile readability

## 🎯 Mobile Gameplay Differences

### Simplified UI
- **Compact status overlay** showing timer, loop count, and phase
- **Mobile-optimized tooltips** and progress indicators
- **Touch-friendly button sizes** (minimum 44px touch targets)
- **Reduced visual complexity** for smaller screens

### Performance Optimizations
- **Smaller canvas size** (800x600 vs 1200x800)
- **Reduced particle effects** for better performance
- **Optimized rendering** with mobile-specific code paths
- **Battery-friendly** frame rate management

## 📦 App Configuration

### Key Settings (config.xml)
```xml
<!-- Performance optimizations -->
<preference name="android-windowHardwareAcceleratedrendering" value="true" />
<preference name="webviewbounce" value="false" />
<preference name="DisallowOverscroll" value="true" />

<!-- Game-specific settings -->
<preference name="orientation" value="default" />
<preference name="fullscreen" value="false" />
<preference name="exit-on-suspend" value="false" />
```

### Required Permissions
- `INTERNET`: For future online features
- `WAKE_LOCK`: Prevent device sleep during gameplay

## 🔧 Debugging

### Chrome DevTools
1. Enable **Developer Options** on Android device
2. Enable **USB Debugging**
3. Open Chrome and navigate to `chrome://inspect`
4. Select your device and app for debugging

### Cordova Debugging
```bash
# Build with debug information
cordova build android --debug

# Run with live reload
cordova run android --livereload
```

## 📋 Testing Checklist

### Device Testing
- [ ] Portrait orientation gameplay
- [ ] Landscape orientation gameplay
- [ ] Touch controls responsiveness
- [ ] Tap-to-move accuracy
- [ ] Object interaction detection
- [ ] Time loop functionality
- [ ] Clone recording/playback
- [ ] Security AI adaptation
- [ ] Victory condition
- [ ] App pause/resume behavior

### Performance Testing
- [ ] Smooth 60fps gameplay
- [ ] No memory leaks
- [ ] Quick app startup
- [ ] Stable time loop resets
- [ ] Efficient canvas rendering

## 🚀 Distribution

### Google Play Store Preparation

1. **Create Signed APK**
```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore chrono-heist.keystore -alias chronoheist -keyalg RSA -keysize 2048 -validity 10000

# Build signed release
cordova build android --release

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore chrono-heist.keystore platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk chronoheist

# Align the APK
zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk chrono-heist-release.apk
```

2. **App Store Assets**
- App icon (512x512 PNG)
- Screenshots (multiple device sizes)
- Feature graphic (1024x500)
- App description and metadata

### Alternative Distribution
- **APK Direct Install**: Share the signed APK file
- **F-Droid**: Open source app store
- **Amazon Appstore**: Alternative Android marketplace

## 🎨 Customization

### Theming
- Modify colors in `www/index.html` CSS section
- Update game colors in `www/game-mobile.js`
- Create custom icons and splash screens

### Controls
- Adjust button sizes in CSS media queries
- Modify touch sensitivity in `handleCanvasTouch()`
- Add new control schemes in `setupMobileControls()`

## 📊 Analytics & Monitoring

### Recommended Plugins
```bash
# Google Analytics
cordova plugin add cordova-plugin-google-analytics

# Crashlytics
cordova plugin add cordova-plugin-firebase-crashlytics

# Performance monitoring
cordova plugin add cordova-plugin-firebase-performance
```

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
- Ensure Android SDK and tools are properly installed
- Check ANDROID_SDK_ROOT environment variable
- Update Cordova and Android platform versions

**Performance Issues**
- Reduce canvas size in mobile detection
- Disable visual effects on older devices
- Implement device capability detection

**Touch Not Working**
- Verify touch event listeners are properly bound
- Check for conflicting CSS touch-action properties
- Test on multiple devices and Android versions

**App Crashes**
- Monitor memory usage during gameplay
- Check for JavaScript errors in remote debugging
- Test time loop transitions thoroughly

## 📈 Future Enhancements

### Planned Features
- **Online leaderboards** with fastest completion times
- **Achievement system** for different play styles
- **Level editor** for custom vault layouts
- **Multiplayer co-op** mode
- **Cloud save** synchronization

### Technical Improvements
- **WebGL rendering** for better performance
- **Progressive Web App** features
- **Adaptive graphics quality** based on device
- **Haptic feedback** for touch interactions

---

## 🎮 Ready to Build!

Your mobile Android version of Chrono Heist is ready for development and deployment. The game includes all core mechanics optimized for mobile devices with intuitive touch controls.

**Build Command:**
```bash
cd chrono-heist-mobile
cordova build android
```

**Run on Device:**
```bash
cordova run android
```

Enjoy creating your time-bending mobile heist experience! 🌀⏰🎯