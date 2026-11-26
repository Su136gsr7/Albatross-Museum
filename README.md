# Albatross-Museum — Our Little Universe

> *"Every picture holds a memory. Every memory holds us."*

A 3D interactive personal couple's memory museum for **Munna & Azhagi** built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Zustand, Tailwind CSS, IndexedDB, PWA, and Capacitor Android.

## Features
- Stylized 3D cartoon **Munna & Azhagi** walking **hand-in-hand** through the museum (`HoldHandsIdle`, `HoldHandsWalk`, `Wave`, `Sit`).
- 6 connected galleries (**Our Beginning**, **First Memories**, **Beautiful Moments**, **Our Adventures**, **My Favourite Pictures**, **Forever Us**) plus the **Secret Forever Us Room**.
- Full-screen **Memory Viewer**, owner **Photo Manager** (IndexedDB + JSON backup/restore), live **Museum Floorplan** mini-map, procedural Web Audio ambient music & SFX, and touch/mobile virtual joystick + drag-look controls.

## Development & Web Build
```bash
npm install
npm run dev
npm run build
```

## Android App (Capacitor + APK)
- Local sync:
  ```bash
  npm run cap:sync
  npm run android:open
  ```
- **Automatic Cloud APK Build (GitHub Actions)**: Every push to `main` runs `.github/workflows/android-apk.yml` using Node.js 20, Java 17, Android SDK, and Gradle `assembleDebug`, producing the downloadable `OurLittleUniverse-debug-apk` (`app-debug.apk`) artifact under the **Actions** tab.
