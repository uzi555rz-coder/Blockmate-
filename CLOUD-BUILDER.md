# Free cloud APK builder

BlockMate includes `.github/workflows/build-android.yml`. It uses a temporary GitHub-hosted Linux runner, so there is no always-on server to pay for. The workflow runs `expo prebuild`, compiles the native Kotlin AccessibilityService, and uploads an APK artifact.

## One-time setup from a phone

1. Create or open a GitHub repository that you control.
2. Upload the BlockMate source into the repository, including `.github/workflows/build-android.yml`.
3. Open the repository's **Actions** tab.
4. Select **Build BlockMate Android APK**.
5. Tap **Run workflow**.
6. Choose `debug` for the first personal install.
7. Wait for the workflow to finish.
8. Open the completed run and download the artifact named `blockmate-<run>-apk`.
9. Extract the APK and install it on the OnePlus 8.

A debug APK is suitable for the first phone test. For repeated updates, use a stable release signing keystore; a release APK built without a persistent signing key may not update an existing installation.

## Cost

GitHub documents standard GitHub-hosted Actions runners as free for public repositories. Private repositories use the account's included Actions allowance. The workflow is not an always-on server: it runs only while a build is active and then shuts down.

## Important limitation

This workflow builds the APK, but it does not create a public app store listing or automatically install the APK on the phone. The user downloads the artifact and installs it manually.
