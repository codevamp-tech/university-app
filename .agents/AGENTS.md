# Strict Build & Deployment Rules

- **STRICT PROHIBITION ON AUTOMATIC BINARY / APK BUILDS & EAS UPDATES**:
  NEVER execute `eas build`, `npx eas build`, `expo build`, `./gradlew assemble`, `eas update`, or `npx eas update` automatically.
  Even if code changes are committed, DO NOT trigger an OTA update or binary build unless the user explicitly types a directive in their current turn instructing to publish/update.
  Only run `eas update` or `eas build` when explicitly commanded by the user.

