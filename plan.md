# ResizedImage.com Feature Implementation Plan

## 1. Recon & Spec Sync

*   **imageresizer.com Flow:**
    *   Landing page with a "Select Image" box.
    *   Image selection opens a modal editor.
    *   Resize options: By Size, By Percentage, Social Media presets.
    *   Export settings: Target file size and format.
    *   Live preview of original vs. output dimensions.
    *   Crop tool with draggable/resizable box and aspect ratio options.
    *   Export button to process and download.

*   **Editor State JSON Spec:**

    ```json
    {
      "files": [],
      "activeFileIndex": 0,
      "resize": {
        "mode": "size", // "size", "percentage", "social"
        "size": {
          "width": 0,
          "height": 0,
          "lockAspectRatio": true
        },
        "percentage": {
          "value": 100,
          "units": "px" // "px", "in", "cm", "mm"
        },
        "social": {
          "platform": "",
          "preset": ""
        }
      },
      "crop": {
        "enabled": false,
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "aspectRatio": "freeform"
      },
      "export": {
        "targetSize": {
          "value": 0,
          "units": "KB" // "KB", "MB"
        },
        "format": "original" // "jpeg", "png", "webp", "original"
      }
    }
    ```

*   **Component/Route Plan:**
    *   `components/LandingPage.js`: Will contain the two upload buttons.
    *   `components/Editor.js`: The main editor component (modal or route).
    *   `components/ResizePanel.js`: Contains the "By Size", "Percentage", and "Social Media" controls.
    *   `components/CropPanel.js`: Contains the crop tool controls.
    *   `components/ExportPanel.js`: Contains the export settings and button.
    *   `api/upload.js`: New Express route for handling file uploads.
    *   `api/transform.js`: New Express route for image transformations.

## 2. UI Scaffolding

*   Modify `index.html` to include the new landing page layout with "Single Image" and "Batch Upload" buttons.
*   Create a basic structure for the editor modal.
*   Add placeholder panels for the resize, crop, and export settings.

## 3. Upload Flow

*   Implement the client-side logic for single file uploads.
*   Create the `/api/upload` endpoint on the server.
*   Implement the Pro gating for the batch upload button.

## 4. Resize Features

*   Implement the "By Size" resize functionality.
*   Implement the "By Percentage" resize functionality.
*   Create a JSON file with the social media presets and implement the "Social Media" resize functionality.

## 5. Export Settings

*   Implement the UI for selecting the target file size and format.
*   Pass these settings to the server during the export process.

## 6. Crop Tool

*   Implement the crop tool UI with a draggable and resizable box.
*   Add the aspect ratio options and other controls.

## 7. Export Pipeline

*   Create the `/api/transform` endpoint to handle the image processing.
*   Implement the logic for resizing, cropping, and formatting the images.
*   Implement the logic for handling batch exports (zipping files).

## 8. Polish & A11y

*   Add keyboard navigation and ARIA labels.
*   Implement error handling and user feedback.
*   Ensure consistent styling with TailwindCSS.

## 9. QA

*   Perform thorough testing of all features.
*   Create a QA checklist.