# Neon Road Racer — 3D Gesture + Keyboard Car Game

## IMPORTANT: How to run on Windows
Do **not** double-click `index.html`. The Three.js JavaScript module is blocked by browsers when opened using a `file:///` address. That is why the game canvas may stay black.

### Easiest method
1. Extract this ZIP.
2. Double-click `RUN_LOCAL.bat`.
3. Your browser should open `http://localhost:8000`.
4. Click **Start Game**.

If Windows says Python is not installed, open the folder in VS Code, install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

## GitHub Pages deployment
1. Upload `index.html`, `style.css`, `game.js`, and `README.md` directly to your repository root.
2. Open Settings → Pages.
3. Choose Deploy from a branch → `main` → `/(root)` → Save.
4. Open the HTTPS GitHub Pages URL. Do not use a `file:///` URL.

## Controls
- Keyboard: Left/Right arrows steer; Up accelerates; Down brakes. WASD is also supported.
- Gesture: move one hand left/right to steer; open palm accelerates; fist brakes.
- Choose Keyboard, Hand Gesture, or Both in the side panel.
- Click Enable Camera and allow camera permission for Gesture/Both.
- Full Screen button expands the game area.

## Requirements / notes
- Internet is required to load Three.js and MediaPipe Hands from jsDelivr.
- Webcam requires HTTPS (GitHub Pages) or localhost.
- This is a lightweight arcade-style 3D prototype.


## Gesture troubleshooting
- Open the site using its HTTPS GitHub Pages URL or `RUN_LOCAL.bat` (`http://localhost:8000`). Do not open `index.html` as a `file:///` URL.
- Click **Enable Camera**, allow camera access, and confirm the preview appears.
- Keep one full hand visible, well lit, and in front of the camera.
- During the race, move your hand to the left, center, or right part of the camera view to steer.
- If the status says the hand tracking library did not load, check internet and reload the page.
