{
  description = "Expo React Native dev env with automatic AVD";

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

        androidSdk = android-nixpkgs.sdk.${system} (
          sdkPkgs: with sdkPkgs; [
            cmdline-tools-latest
            platform-tools
            emulator
            build-tools-36-0-0
            platforms-android-36
            system-images-android-36-google-apis-x86-64
          ]
        );

      in
      {
        devShells.default = pkgs.mkShell {

          packages = with pkgs; [
            nodejs_24
            jdk17
            git
            watchman
            androidSdk
          ];

          ANDROID_SDK_ROOT = "${androidSdk}/share/android-sdk";
          ANDROID_HOME = "${androidSdk}/share/android-sdk";

          shellHook = ''
            export PATH=$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH

            export ANDROID_USER_HOME="$PWD/.android"
            export ANDROID_AVD_HOME="$PWD/.android/avd"

            mkdir -p "$ANDROID_AVD_HOME"

            AVD_NAME="expo-avd"
            IMAGE="system-images;android-36;google_apis;x86_64"

            echo ""
            echo "Para iniciar o emulador:"
            echo "emulator -avd $AVD_NAME"
            echo ""

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
