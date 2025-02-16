import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
from googletrans import Translator
from PIL import Image
import sys
import json

# Set Tesseract OCR path (Update this if Tesseract is installed in a different location)
# Example: pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
#pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"  # Update if needed

def extract_text(image_path):
    """Extract text from an image using Tesseract OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def translate_text(text, target_language="en"):
    """Translate text using Google Translate API."""
    try:
        translator = Translator()
        translated = translator.translate(text, dest=target_language)
        return translated.text
    except Exception as e:
        return f"Error translating text: {str(e)}"

if __name__ == "__main__":
    # Get image path and target language from command-line arguments
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python translate.py <image_path> <target_language>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    target_language = sys.argv[2]

    # Extract text from image
    extracted_text = extract_text(image_path)

    if "Error" in extracted_text:
        print(json.dumps({"error": extracted_text}))
        sys.exit(1)

    # Translate extracted text
    translated_text = translate_text(extracted_text, target_language)

    # Return JSON response
    result = {"text": extracted_text, "translated": translated_text}
    import sys
    sys.stdout.reconfigure(encoding='utf-8')  # Force UTF-8 encoding
    print(json.dumps(result, ensure_ascii=False))

