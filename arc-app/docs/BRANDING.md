# ARC production branding

The approved, unmodified source artwork lives in `resources/`:

- `app-icon.png` — 1254 × 1254 RGB PNG; SHA-256 `51f95aa471ccad1b2ce62eedbbf86ec68bff3b7c1ed34c1cb09201dee704af37`
- `splash.png` — 941 × 1672 RGB PNG; SHA-256 `8d5cc2109c024f8e7c9fd09ea6662ea7fe3b0c624db9a8466eb13692d62d0186`

Generated copies are checked into the native iOS and Android resource trees. The iOS App Store icon is 1024 × 1024 without alpha. Android includes density-specific legacy, round, and safely inset adaptive foreground icons. Native splash images use a `#03070D` background and preserve the source aspect ratio; Android 12 uses the ARC adaptive foreground on the same dark background.

The approved icon artwork itself contains a rounded-square dark plate. Platform masking can therefore produce a subtle double-rounded appearance on some Android launchers. Confirm the adaptive icon preview and installed icon on representative devices before release. Do not replace or crop the master artwork without product approval.

Store prices, game data, and runtime behavior are unrelated to these assets. All branding is bundled locally and requires no network request.
