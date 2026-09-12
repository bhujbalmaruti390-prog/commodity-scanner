# Legal Metrology Scanner - Android Studio Setup & Run Guide

This project is fully packaged and ready to be extracted and opened directly in **Android Studio**.

---

## 🚀 Quick Start in Android Studio

### Step 1: Export & Extract the Project
1. In Google AI Studio, open the top-right settings menu and click **Export as ZIP** (or clone via GitHub).
2. Extract the downloaded ZIP file onto your computer (e.g., `~/Documents/LegalMetrologyScanner`).

### Step 2: Open in Android Studio
1. Launch **Android Studio** (Hedgehog, Iguana, Jellyfish, Ladybug or newer).
2. In the Welcome screen, click **Open** (or `File` -> `Open`).
3. Browse to the extracted folder and select the **`android`** folder inside the project.
4. Click **OK**.

### Step 3: Gradle Sync
1. Android Studio will automatically recognize the Gradle project and trigger a build sync.
2. If prompted for JDK version, ensure **JDK 17** or **JDK 21** is selected (`File` -> `Settings` / `Preferences` -> `Build, Execution, Deployment` -> `Build Tools` -> `Gradle` -> `Gradle JDK`).
3. Wait for the Gradle sync to finish ("BUILD SUCCESSFUL").

### Step 4: Run on Android Emulator or Physical Device
1. Connect your Android phone via USB with **USB Debugging** enabled, or start an **Android Virtual Device (AVD)** emulator (API 24 to API 34+).
2. Ensure `app` is selected in the run configuration dropdown.
3. Click the green **Run** button (`Shift + F10` or ▶).
4. The app will launch with full camera permissions, hardware acceleration, and pull-to-refresh!

---

## 📷 Features Included in the Android Studio Module

- **Native Camera & File Picker Support**: Pre-configured `WebChromeClient` supporting HTML5 live video streams and photo captures via `FileProvider`.
- **Statutory Offline & Online Support**: Runs both with locally bundled assets (`file:///android_asset/dist/index.html`) or live API endpoints.
- **Modern Responsive Layout**: Configured for edge-to-edge Android viewport with status bar theming.
- **Swipe-to-Refresh**: Built-in `SwipeRefreshLayout` allowing enforcement officials to quickly reload inspection dockets.
- **Android Back Navigation**: Smoothly navigates through previous inspection screens using `OnBackPressedCallback`.

---

## 🛠️ Building Web Assets for Offline Android Distribution

To bundle the web app assets directly into the Android APK:
```bash
# In the project root directory
npm run build

# Copy dist assets into Android assets directory
mkdir -p android/app/src/main/assets/dist
cp -r dist/* android/app/src/main/assets/dist/
```
Once copied, `MainActivity.kt` will automatically detect and load `dist/index.html` offline!
