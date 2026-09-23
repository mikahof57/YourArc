import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(path.join(root, relativePath));
const text = (relativePath: string) => read(relativePath).toString('utf8');

function pngInfo(relativePath: string) {
  const data = read(relativePath);
  assert.equal(data.subarray(1, 4).toString('ascii'), 'PNG', `${relativePath} is not a PNG`);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
  };
}

function assertPng(relativePath: string, width: number, height: number, rgb = true) {
  const info = pngInfo(relativePath);
  assert.deepEqual([info.width, info.height], [width, height], `${relativePath} dimensions`);
  if (rgb) assert.equal(info.colorType, 2, `${relativePath} must be RGB without alpha`);
}

const iconMaster = read('resources/app-icon.png');
const splashMaster = read('resources/splash.png');
assert.equal(createHash('sha256').update(iconMaster).digest('hex'), '51f95aa471ccad1b2ce62eedbbf86ec68bff3b7c1ed34c1cb09201dee704af37');
assert.equal(createHash('sha256').update(splashMaster).digest('hex'), '8d5cc2109c024f8e7c9fd09ea6662ea7fe3b0c624db9a8466eb13692d62d0186');
assertPng('resources/app-icon.png', 1254, 1254);
assertPng('resources/splash.png', 941, 1672);

assertPng('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, 1024);
assert.match(text('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json'), /AppIcon-512@2x\.png/);
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  assertPng(`ios/App/App/Assets.xcassets/Splash.imageset/${name}`, 2732, 2732);
}
const launchStoryboard = text('ios/App/App/Base.lproj/LaunchScreen.storyboard');
assert.match(launchStoryboard, /image="Splash"/);
assert.match(launchStoryboard, /red="0\.01176470588"/);
assert.doesNotMatch(launchStoryboard, /systemBackgroundColor/);

const densities = {
  mdpi: [48, 108],
  hdpi: [72, 162],
  xhdpi: [96, 216],
  xxhdpi: [144, 324],
  xxxhdpi: [192, 432],
} as const;
for (const [density, [legacySize, foregroundSize]] of Object.entries(densities)) {
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
    assertPng(`android/app/src/main/res/mipmap-${density}/${name}`, legacySize, legacySize);
  }
  assertPng(`android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`, foregroundSize, foregroundSize);
}
for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const adaptive = text(`android/app/src/main/res/mipmap-anydpi-v26/${name}`);
  assert.match(adaptive, /@color\/ic_launcher_background/);
  assert.match(adaptive, /@mipmap\/ic_launcher_foreground/);
}
assert.match(text('android/app/src/main/res/values/ic_launcher_background.xml'), /#03070D/);
assert.match(text('android/app/src/main/res/values-v31/styles.xml'), /windowSplashScreenAnimatedIcon/);
assert.match(text('android/app/src/main/AndroidManifest.xml'), /android:icon="@mipmap\/ic_launcher"/);
assert.match(text('android/app/src/main/AndroidManifest.xml'), /android:roundIcon="@mipmap\/ic_launcher_round"/);

const portraitSplashes = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] } as const;
const landscapeSplashes = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1600, 960], xxxhdpi: [1920, 1280] } as const;
for (const [density, [width, height]] of Object.entries(portraitSplashes)) assertPng(`android/app/src/main/res/drawable-port-${density}/splash.png`, width, height);
for (const [density, [width, height]] of Object.entries(landscapeSplashes)) assertPng(`android/app/src/main/res/drawable-land-${density}/splash.png`, width, height);
assertPng('android/app/src/main/res/drawable/splash.png', 480, 320);

assertPng('public/favicon.png', 32, 32);
assertPng('public/apple-touch-icon.png', 180, 180);
assertPng('public/app-icon-192.png', 192, 192);
assertPng('public/app-icon-512.png', 512, 512);
const html = text('index.html');
assert.match(html, /href="\/favicon\.png"/);
assert.match(html, /href="\/apple-touch-icon\.png"/);
assert.match(html, /#03070d/);

assert.match(text('capacitor.config.ts'), /appId: 'com\.yourarc\.arc'/);
assert.match(text('android/app/build.gradle'), /namespace\s*=\s*"com\.yourarc\.arc"/);
assert.match(text('android/app/build.gradle'), /applicationId "com\.yourarc\.arc"/);

const brandingFiles = [
  'capacitor.config.ts', 'index.html',
  'ios/App/App/Base.lproj/LaunchScreen.storyboard',
  'android/app/src/main/res/values/styles.xml',
  'android/app/src/main/res/values-v31/styles.xml',
];
for (const file of brandingFiles) {
  assert.doesNotMatch(text(file), /https?:\/\//i, `${file} must not reference remote branding`);
}

console.log('ARC branding static validation passed.');
