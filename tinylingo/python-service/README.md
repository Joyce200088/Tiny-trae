# TinyLingo Background Removal Service

A Python FastAPI microservice for removing backgrounds from images using the `rembg` library.

## Features

- Remove background from single images
- Batch processing for multiple images
- Support for JPG, PNG, WebP formats
- File size limit: 10MB per image
- CORS enabled for Next.js frontend
- Health check endpoint

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

Start the FastAPI server:
```bash
python main.py
```

The service will be available at:
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## API Endpoints

### POST /remove-background
Remove background from a single image.

**Parameters:**
- `file`: Image file (multipart/form-data)

**Response:**
- PNG image with transparent background

### POST /batch-remove-background
Remove background from multiple images (max 10).

**Parameters:**
- `files`: Array of image files

**Response:**
- JSON with results for each image

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "background-removal"
}
```

## Usage with Next.js

The service is configured to accept requests from `http://localhost:3000` (Next.js dev server).

Example usage in Next.js:
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/remove-background', {
  method: 'POST',
  body: formData,
});

const processedImage = await response.blob();
```

## Dependencies

- **FastAPI**: Web framework for building APIs
- **uvicorn**: ASGI server for running FastAPI
- **rembg**: Background removal library
- **Pillow**: Image processing library
- **python-multipart**: For handling file uploads