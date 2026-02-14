"""
Remove image background server for Label Maker.
Uses rembg + PIL (see reference: pip install rembg, then remove(input) -> output).
Run: python remove_bg_server.py
Then in the app use "Add image (no background)" and ensure the server URL is http://localhost:5050
"""
import io
import sys

try:
    from flask import Flask, request, send_file
    from flask_cors import CORS
    from rembg import remove as rembg_remove
    from PIL import Image
except ImportError as e:
    print("Missing dependency. Install with:", file=sys.stderr)
    print("  pip install -r requirements-remove-bg.txt", file=sys.stderr)
    sys.exit(1)

app = Flask(__name__)
CORS(app)

@app.route("/remove-bg", methods=["POST"])
def remove_bg():
    if "file" not in request.files and not request.data:
        return {"error": "No image provided"}, 400
    try:
        if request.data:
            input_bytes = request.data
        else:
            f = request.files["file"]
            input_bytes = f.read()
        input_img = Image.open(io.BytesIO(input_bytes)).convert("RGBA")
        output_img = rembg_remove(input_img)
        buf = io.BytesIO()
        output_img.save(buf, format="PNG")
        buf.seek(0)
        return send_file(buf, mimetype="image/png")
    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Remove-background server: http://localhost:5050")
    print("Use 'Add image (no background)' in Label Maker when this is running.")
    app.run(host="0.0.0.0", port=5050, debug=False)
