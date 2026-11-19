# Lab 11 — Photos and Places in a Conversation (DAUST Messenger)

## Overview

This repository updates **DAUST Messenger** so a conversation can send and display:
- **Text messages** (`kind: "text"`)
- **Photos** (`kind: "photo"`) picked from the system photo library (`📎`) or captured with the camera (`📷`), previewed before sending, and persisted into `Paths.document` when sent
- **Locations** (`kind: "location"`) fetched on demand (`📍`) with accurate/approximate detection and one-tap opening in the Maps application
- **Haptic feedback** (`Haptics.NotificationFeedbackType.Success`) whenever any message is sent
- **Stretch Goal — QR Code Contact Scanner (`Scan` tab)**: scans `daust-contact:<id>` QR codes using `expo-camera`, handles all four permission states with `useCameraPermissions()`, uses a `useRef` guard so one QR scan opens one screen, validates the QR prefix, and unmounts the camera when the tab is unfocused (`useIsFocused()`).

---

## Lab Questions & Deliverable Answers

### 1. Where each permission is declared, and where it is requested
- **Declared (Build time)**: In [`app.json`](./app.json) inside the `expo.plugins` array (`expo-image-picker`, `expo-location`, and `expo-camera`), providing human-readable reasons explaining what DAUST Messenger does with the access and when.
- **Requested (Runtime, in the user action handler)**:
  - **Photo Library (`pickPhoto`)**: No runtime permission is requested because `ImagePicker.launchImageLibraryAsync()` uses the system out-of-process photo picker, which grants temporary read access only to the single photo the user selects.
  - **System Camera (`takePhoto`)**: Requested inside `takePhoto()` via `ImagePicker.requestCameraPermissionsAsync()` right when the user taps `📷` (never on app launch).
  - **Foreground Location (`shareLocation`)**: Requested inside `shareLocation()` via `Location.requestForegroundPermissionsAsync()` right when the user taps `📍`.
  - **QR Scanner (`ScanScreen`)**: Checked via `useCameraPermissions()` and requested when the user taps **Allow Camera** on the Scan tab.

### 2. What the screen shows when the camera is refused, and when it is refused for good
- **Refused once (`!permission.granted && permission.canAskAgain`)**: An inline notice banner appears explaining that camera access was refused while confirming that text messages, library photos, and location sharing still work.
- **Refused for good / turned off in Settings (`!permission.granted && !permission.canAskAgain`)**: The notice banner explains that camera permission is turned off in system settings and renders an **Open Settings** button (`Linking.openSettings()`) that opens the app's system settings page directly.

### 3. Why a photo sent last week still appears today
- `expo-image-picker` writes picked or captured photos into a **temporary cache directory** that the OS can purge at any time.
- When the user presses **Send**, `keepPhoto(tempUri)` copies the file from the temporary cache URI into the app's permanent `Paths.document` directory (`new File(Paths.document, ...)`), preserving its file extension, and stores the permanent `destination.uri` in the message object (which is also persisted to `Paths.document/messages.json`).
- Copying only happens on **Send** (not on pick), so if the user presses **Remove** on the preview, no permanent storage in `Paths.document` is wasted by abandoned drafts.

### Additional Lab Questions
- **Step 2 — Why is `expo-camera` not installed for Steps 1–8?**
  Step 4 uses `ImagePicker.launchCameraAsync()`, which delegates taking a photo to the OS's built-in camera application rather than embedding a custom camera viewfinder inside our React tree. `expo-camera` is only needed when embedding a live camera preview inside the app (such as the Stretch QR code scanner).
- **Step 6 — Why is the `📍` button disabled while `locating`?**
  Reading GPS position is asynchronous and can take several seconds. Without `disabled={locating}`, tapping `📍` three times quickly launches three concurrent `getCurrentPositionAsync` requests and sends three duplicate location messages once they resolve.
- **Step 8 — Why no haptic on every key press?**
  The OS keyboard already provides its own subtle feedback if the user wants it; triggering app-level notification haptics on every keystroke overwhelms the user, drains battery, and dulls the meaning of haptics, which should be reserved for meaningful outcomes like completing a send action.
# lab11mobiledev
# lab11mobiledev
