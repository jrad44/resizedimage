# QA Checklist

## Upload Flow
- [ ] Single image upload works as expected.
- [ ] Batch image upload is gated for Pro users.
- [ ] Error message is displayed for files larger than 10MB.
- [ ] Error message is displayed for unsupported file types.

## Resize Features
- [ ] "By Size" resize works correctly.
- [ ] "By Percentage" resize works correctly.
- [ ] "Social Media" presets populate correctly.
- [ ] Aspect ratio lock works as expected.

## Crop Tool
- [ ] Crop tool opens with the selected image.
- [ ] Draggable and resizable crop box works correctly.
- [ ] Aspect ratio options work as expected.
- [ ] Applying the crop updates the image in the editor.

## Export Pipeline
- [ ] Exporting with "By Size" settings works correctly.
- [ ] Exporting with "By Percentage" settings works correctly.
- [ ] Exporting with "Social Media" presets works correctly.
- [ ] Exporting with crop applied works correctly.
- [ ] Target file size and format options work as expected.

## Polish & A11y
- [ ] Keyboard navigation in the editor modal is intuitive.
- [ ] ARIA labels are present and correct for all interactive elements.
- [ ] The UI is responsive and looks good on all screen sizes.
- [ ] Error messages are clear and helpful.

## Pro Features
- [ ] Batch upload is disabled for free users.
- [ ] Pro users can access batch upload.
- [ ] Pro status is correctly identified and displayed.