# Lab 11 — Photos and Places in a Conversation (Guided)

DAUST Messenger's conversation screen sends text. This lab lets it send **photos**, from the library or the camera, and the user's **position**, and makes every one of them behave correctly when the user says **no**.

Everything you need was in Lecture 8. Each step tells you **what** to build and gives a skeleton with `TODO`s; the slide numbers point to the code and the reasons. When the slides are not enough, use the Expo reference page of the package, for **your** SDK version.

**Starting point:** DAUST Messenger running in your Android **development build** from Lecture 7. Test on your **phone**: the camera does not work in the emulator (slide 28).

Run the application after every step, and read any red screen or terminal warning before fixing it.

---

## Step 1 — Messages That Are Not Only Text

A conversation now holds three kinds of message. Create the type:

```ts
// types/message.ts
export type Message =
  | { id: string; kind: "text"; text: string }
  | { id: string; kind: "photo"; uri: string }
  | { id: string; kind: "location"; latitude: number; longitude: number; approximate: boolean };
```

**TODO**

- [ ] Change your conversation's messages to this type. Existing text messages get `kind: "text"`
- [ ] Render each message by its `kind`: for now, `"photo"` and `"location"` can show a placeholder `Text`

> **Hint:** a `switch (message.kind)` inside the bubble. TypeScript then knows that `message.uri` exists only in the `"photo"` case.

**Checkpoint 1** — the conversation looks exactly as before.

---

## Step 2 — Install, Declare, Rebuild

```bash
npx expo install expo-image-picker expo-file-system expo-haptics expo-location
```

```json
{
  "expo": {
    "plugins": [
      ["expo-image-picker", {
        "photosPermission": "TODO",
        "cameraPermission": "TODO"
      }],
      ["expo-location", {
        "locationWhenInUsePermission": "TODO"
      }]
    ]
  }
}
```

**TODO**

- [ ] Write each reason **in your own words**: what DAUST Messenger does with the access, and when
- [ ] Rebuild and reinstall the development build

> **Hint:** slide 3. "Allow access to your camera" explains nothing; a reviewer can reject it.

> **Hint:** after `npx expo install`, open `app.json`: neither plugin is listed. They are applied anyway, at build time, with a generic sentence. The entries you write replace it.

> **Question:** why is `expo-camera` not installed in this lab? Look at slide 9: which tool does Step 4 use to take a photo?

**Checkpoint 2** — the application runs in the new build, exactly as before.

---

## Step 3 — Attach From the Library

```tsx
// in chat.tsx
import * as ImagePicker from "expo-image-picker";

const [photoUri, setPhotoUri] = useState<string | null>(null);

async function pickPhoto() {
  const result = await ImagePicker.launchImageLibraryAsync({
    // TODO 1: photos only, cropping allowed, quality 0.7
  });
  // TODO 2: the user closed the picker
  // TODO 3: keep the uri for the preview
}
```

**TODO**

- [ ] TODO 1 to 3 (slide 10)
- [ ] A **📎** button next to the input calls `pickPhoto`
- [ ] Above the input, a **preview** of the chosen photo with a **Remove** button (slide 11)

> **Hint:** the preview does not appear, but no error either? Slide 11: an image from a `uri` has no size of its own.

> **Question:** this step asks for no permission. Why not? (slide 7)

**Checkpoint 3** — pick a photo: the preview appears; **Remove** clears it. Open the picker and close it: nothing changes.

---

## Step 4 — Take a Photo

```tsx
const [notice, setNotice] = useState<string | null>(null);

async function takePhoto() {
  // TODO 1: request the camera permission — here, in the handler
  // TODO 2: refused → a notice, different when it can no longer ask
  // TODO 3: open the system camera, quality 0.7
  // TODO 4: cancelled → nothing; otherwise the same preview as Step 3
}
```

**TODO**

- [ ] TODO 1 to 4 (slide 12)
- [ ] A **📷** button calls `takePhoto`
- [ ] When `canAskAgain` is `false`, the notice comes with an **Open Settings** button (slide 6, both parts)

> **Hint:** do not store "granted" in state. Request every time: when it is already granted, no dialog appears (slide 12).

**Checkpoint 4** — take a photo: the preview appears. Refuse the camera twice: **Open Settings** appears, and opens your app's page in Settings.

---

## Step 5 — Keep the Photo, Then Send It

```tsx
import { File, Paths } from "expo-file-system";

async function keepPhoto(tempUri: string): Promise<string> {
  // TODO: copy into the document directory, keep the extension, return the copy's uri
}

async function sendPhoto() {
  if (!photoUri) return;
  const uri = await keepPhoto(photoUri);
  // TODO: add a "photo" message with THIS uri, then clear the preview
}
```

**TODO**

- [ ] `keepPhoto` (slide 13, *Keeping the Photo*)
- [ ] When a photo is in the preview, **Send** sends the photo
- [ ] Replace the `"photo"` placeholder from Step 1 with the image itself, with a fixed size

> **Question:** why copy on **send** and not as soon as the photo is picked? What happens to a copy when the user presses **Remove**?

**Checkpoint 5** — send two photos. Close the application completely and reopen it: both photos are still shown, if your messages are saved (Lecture 6).

---

## Step 6 — Share the Position

```tsx
import * as Location from "expo-location";

const [locating, setLocating] = useState(false);

async function shareLocation() {
  // TODO 1: request the foreground permission; refused → a notice, return
  setLocating(true);
  try {
    // TODO 2: read the position once, accuracy High
    // TODO 3: approximate? (slide 20, *What Can Happen*)
    // TODO 4: add a "location" message
  } catch {
    // TODO 5: the position could not be found
  } finally {
    setLocating(false);
  }
}
```

**TODO**

- [ ] TODO 1 to 5 (slide 20, both parts)
- [ ] A **📍** button calls `shareLocation`; while `locating`, it shows a loading state and is disabled
- [ ] The `"location"` bubble shows **📍 Location**, with **(approximate)** when it is

> **Hint:** for TODO 3, the answer is in the **permission** response, not in the position. Check both `android` and `ios`.

> **Question:** why is the button disabled while `locating`? Tap it three times quickly with the line removed.

**Checkpoint 6** — tap 📍: a loading state, then a location message.

---

## Step 7 — Open the Position in Maps

**TODO**

- [ ] Tapping a location bubble opens the maps application at that position (slide 23)

> **Hint:** `Linking` from `react-native`, and the URL format on slide 23. No map library is needed.

**Checkpoint 7** — tap a location message: the maps application opens at the right place.

---

## Step 8 — A Haptic on Send

**TODO**

- [ ] A `Success` notification haptic when a message (text, photo, or location) is sent (slide 25)

> **Question:** slide 25, *When to Use Them*, says "every key press: nothing". Why?

**Checkpoint 8** — sending a message is felt in the hand.

---

## Step 9 — Every Outcome

The assessment of this lab is this table. Anyone can make the camera work when the user says yes; a finished application also works when the user says no.

| Do this on your phone | Expected |
|---|---|
| Uninstall, reinstall, tap 📷 | The dialog appears now, not at launch, with **your** sentence |
| Refuse the camera | A notice; text, photos from the library, and location still work |
| Refuse until the dialog no longer appears | **Open Settings** appears |
| Turn the camera off in Settings, return to the app, tap 📷 | The notice — not a crash, not a silent button |
| Open the picker, close it | Nothing changes: no error, no empty preview |
| Turn location services off, tap 📍 | "Could not find your position…"; the conversation still works |
| Allow location as **approximate** only | The message is sent, marked **(approximate)** |
| Close and reopen the application | Photos sent earlier are still shown |

Slide 29 says how to reset and revoke a permission for each test.

**Checkpoint 9** — every line passes. Commit and push.

---

## Stretch

A **Scan** screen that adds a contact from a QR code in the format `daust-contact:<id>` (slides 14 to 18):

- install `expo-camera`, add its plugin with your own `cameraPermission` sentence, and rebuild once more
- the four permission states with `useCameraPermissions` (slide 15)
- the ref guard, so one code opens one screen (slide 17)
- the format check: any other QR code shows "This is not a DAUST Messenger code." (slide 17)
- `useIsFocused`, if the screen is a tab (slide 18)

---

## Deliverables

The updated DAUST Messenger repository.

Be ready to explain, on your phone:

1. Where each permission is **declared**, and where it is **requested**
2. What the screen shows when the camera is refused, and when it is refused for good
3. Why a photo sent last week still appears today
