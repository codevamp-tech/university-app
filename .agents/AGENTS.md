# Strict Build & Deployment Rules

- **STRICT PROHIBITION ON AUTOMATIC BINARY / APK BUILDS**:
  NEVER execute `eas build`, `npx eas build`, `expo build`, `./gradlew assemble`, or any Android/iOS binary compilation command automatically.
  Even if code changes or OTA updates are published, DO NOT trigger an APK or binary build unless the user explicitly types a directive in their current turn instructing to build an APK.
  Always ask for explicit confirmation and wait for approval before running any build command.
