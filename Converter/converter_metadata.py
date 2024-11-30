from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from wand.image import Image as WandImage
from PIL import Image, TiffTags
import os
import warnings
from fractions import Fraction

app = Flask(__name__)
CORS(app)

OUTPUT_DIR = "output_images"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

warnings.filterwarnings("ignore", category=UserWarning, module='wand.image')


@app.route("/convert-tiff", methods=["POST"])
def convert_tiff():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Save the uploaded TIFF file temporarily for conversion
        tiff_path = os.path.join(OUTPUT_DIR, "temp.tif")
        file.save(tiff_path)

        path_metadata = os.path.join(OUTPUT_DIR, f"metadata.txt")
        extract_pixel_spacing(tiff_path, path_metadata)
        
        page_files = []
        with WandImage(filename=tiff_path) as img:
            for i in range(len(img.sequence)):
                with WandImage(img.sequence[i]) as page:
                    page.gamma(1.5)
                    page.modulate(brightness=110, saturation=100, hue=100)
                    page.format = 'png'
                    page_path = os.path.join(OUTPUT_DIR, f"page_{i}.png")
                    page.save(filename=page_path)
                    page_files.append(page_path)

        # Clean up the temporary TIFF file
        os.remove(tiff_path)

        page_urls = [f"/get-page/{i}" for i in range(len(page_files))]
        return jsonify({"pages": page_urls})

    except Exception as e:
        print("Error during TIFF conversion:", e)
        return jsonify({"error": str(e)}), 500


def extract_pixel_spacing(tiff_path, output_path):
    try:
        with Image.open(tiff_path) as img:
            # Open the output file for writing metadata
            with open(output_path, 'w') as file:
                file.write("All available metadata:\n")
                
                # Loop through metadata and write to file
                for tag, value in img.tag_v2.items():
                    tag_name = TiffTags.TAGS_V2.get(tag, f"Unknown Tag {tag}")
                    
                    # Check for XResolution and YResolution tags
                    if tag_name in ['XResolution', 'YResolution']:
                        if isinstance(value, tuple) and len(value) == 2:
                            # Parse the RATIONAL value
                            resolution = Fraction(value[0], value[1])
                            readable_value = float(resolution)
                            file.write(f"{tag_name}: {value} (Parsed: {readable_value} units/pixel)\n")
                        else:
                            file.write(f"{tag_name}: {value} (Scalar or Unknown Format)\n")
                    else:
                        # Write other tags as-is
                        file.write(f"{tag_name}: {value}\n")
            
            print(f"Metadata written to {output_path}")
    except Exception as e:
        print(f"Error extracting metadata: {e}")


@app.route("/get-page/<int:page_num>", methods=["GET"])
def get_page(page_num):
    try:
        page_path = os.path.join(OUTPUT_DIR, f"page_{page_num}.png")
        return send_file(page_path, mimetype="image/png")

    except FileNotFoundError:
        return jsonify({"error": f"Page {page_num} not found"}), 404
    except Exception as e:
        print("Error retrieving page:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5010)
