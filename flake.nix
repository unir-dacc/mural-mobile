{
  description = "Expo React Native dev env (Linux + macOS)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android-nixpkgs.url = "github:tadfisher/android-nixpkgs";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      android-nixpkgs,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        isDarwin = pkgs.stdenv.isDarwin;

        androidSdk = android-nixpkgs.sdk.${system} (
          sdkPkgs:
          with sdkPkgs;
          [
            cmdline-tools-latest
            platform-tools
            build-tools-36-0-0
            platforms-android-36
          ]
          ++ pkgs.lib.optionals (!isDarwin) [
            emulator
            system-images-android-36-google-apis-x86-64
          ]
          ++ pkgs.lib.optionals (isDarwin) [
            # macOS ARM usa arm64
            system-images-android-36-google-apis-arm64-v8a
          ]
        );

        sdkRoot = "${androidSdk}/share/android-sdk";

        image =
          if isDarwin then
            "system-images;android-36;google_apis;arm64-v8a"
          else
            "system-images;android-36;google_apis;x86_64";

      in
      {
        devShells.default = pkgs.mkShell {

          packages =
            with pkgs;
            [
              nodejs_24
              jdk17
              git
              watchman
            ]
            ++ pkgs.lib.optionals (!isDarwin) [
              androidSdk
            ];

          ANDROID_SDK_ROOT = sdkRoot;
          ANDROID_HOME = sdkRoot;

          shellHook = ''
            export PATH=$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH

            # Em macOS o emulator do nix costuma quebrar → usa o do Android Studio
            if [ "$(uname)" != "Darwin" ]; then
              export PATH=$ANDROID_SDK_ROOT/emulator:$PATH
            fi

            export ANDROID_USER_HOME="$PWD/.android"
            export ANDROID_AVD_HOME="$PWD/.android/avd"

            mkdir -p "$ANDROID_AVD_HOME"

            AVD_NAME="expo-avd"
            IMAGE="${image}"

            if command -v emulator >/dev/null 2>&1; then
              if ! emulator -list-avds | grep -q "$AVD_NAME"; then
                echo "Criando AVD $AVD_NAME..."

                echo "no" | avdmanager create avd \
                  -n "$AVD_NAME" \
                  -k "$IMAGE" \
                  -d pixel_6 || true

                echo "AVD criado."
              else
                echo "AVD $AVD_NAME já existe."
              fi

              echo ""
              echo "Para iniciar o emulador:"
              echo "emulator -avd $AVD_NAME"
              echo ""
            else
              echo "⚠️ Emulator não disponível via Nix no macOS."
              echo "Use o Android Studio para rodar o emulador."
            fi

            if [ -f package.json ]; then
              npm install
              npx husky
              echo "husky initialized"
            fi
          '';
        };
      }
    );
}
