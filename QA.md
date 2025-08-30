# QA Checklist

## Landing Page
- [ ] Verify that the landing page shows only two upload options: "Single Image (Free)" and "Batch Upload (Pro)".
- [ ] Verify that the preset tiles are removed.
- [ ] Verify that the top menu bar is present with links to "Image Resizer", "PDF Merger", and "Image Background Remover".
- [ ] Verify that the "Unlock Pro" button is present in the header for non-Pro users.
- [ ] Verify that the "Unlock Pro" button is hidden for Pro users.
- [ ] Verify that clicking the "Unlock Pro" button redirects to the Stripe checkout page.

## Upload Flow
- [ ] Verify that uploading a single image opens the editor modal.
- [ ] Verify that the uploaded image is displayed in the preview panel.
- [ ] Verify that the batch upload button is disabled for non-Pro users and redirects to the Stripe checkout page.
- [ ] Verify that the batch upload button is enabled for Pro users.
- [ ] Verify that uploading multiple images opens the editor modal.

## Resize: By Size
- [ ] Verify that the width and height input fields are populated with the original image dimensions upon upload.
- [ ] Verify that changing the width updates the height to maintain the aspect ratio when the lock is checked.
- [ ] Verify that changing the height updates the width to maintain the aspect ratio when the lock is checked.
- [ ] Verify that the aspect ratio is not maintained when the lock is unchecked.

## Resize: Percentage
- [ ] Verify that the percentage slider updates the width and height input fields.
- [ ] Verify that the percentage value is displayed next to the slider.
- [ ] Verify that the unit selector is present.

## Resize: Social Presets
- [ ] Verify that the platform dropdown is populated with the correct social media platforms.
- [ ] Verify that selecting a platform populates the preset dropdown with the correct presets.
- [ ] Verify that selecting a preset updates the width and height input fields.

## Export Settings
- [ ] Verify that the target file size and format can be selected.
- [ ] Verify that the exported image has the correct dimensions, format, and approximate file size.

## Crop Tool
- [ ] Verify that clicking the "Crop" button initializes the cropper.
- [ ] Verify that the crop box is draggable and resizable.
- [ ] Verify that the aspect ratio can be changed.
- [ ] Verify that clicking the "Apply Crop" button applies the crop to the image.
- [ ] Verify that clicking the "Reset" button resets the crop.

## Export Pipeline
- [ ] Verify that exporting a single image downloads a single file.
- [ ] Verify that exporting multiple images downloads a zip file.
- [ ] Verify that the exported files have the correct names.