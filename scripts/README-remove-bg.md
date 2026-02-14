# Remove image background (Python + rembg)

This uses the same approach as your reference: **rembg** + **PIL** to remove image backgrounds.

## Setup

1. Install dependencies (one-time):

   ```bash
   pip install -r requirements-remove-bg.txt
   ```

   Or manually:

   ```bash
   pip install rembg Pillow flask flask-cors
   ```

2. Start the server:

   ```bash
   python remove_bg_server.py
   ```

   Server runs at **http://localhost:5050**.

## Use in Label Maker

1. Keep the server running.
2. In the app: **Images & Assets** → **Remove background** → choose an image → **Add image (no background)**.
3. The image is sent to the Python server, background is removed with rembg, and the result (PNG with transparency) is added to the canvas.

If the server is not running, the app will show an error and remind you to start it.
