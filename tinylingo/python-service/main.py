from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
from rembg import remove
from PIL import Image
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TinyLingo Background Removal Service",
    description="Python microservice for removing backgrounds from images using rembg",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "TinyLingo Background Removal Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "background-removal"}

@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    """
    Remove background from uploaded image
    
    Args:
        file: Uploaded image file (JPG, PNG, WebP)
        
    Returns:
        PNG image with transparent background
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read the uploaded file
        contents = await file.read()
        
        # Validate file size (10MB limit)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        logger.info(f"Processing image: {file.filename}, size: {len(contents)} bytes")
        
        # Remove background using rembg
        output_data = remove(contents)
        
        # Optional: Process with PIL for additional optimization
        try:
            # Convert to PIL Image for potential processing
            input_image = Image.open(io.BytesIO(output_data))
            
            # Ensure RGBA mode for transparency
            if input_image.mode != 'RGBA':
                input_image = input_image.convert('RGBA')
            
            # Save optimized PNG
            output_buffer = io.BytesIO()
            input_image.save(output_buffer, format='PNG', optimize=True)
            output_data = output_buffer.getvalue()
            
        except Exception as pil_error:
            logger.warning(f"PIL processing failed, using rembg output directly: {pil_error}")
        
        logger.info(f"Background removal completed, output size: {len(output_data)} bytes")
        
        # Return the processed image
        return Response(
            content=output_data,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=no_bg_{file.filename.split('.')[0]}.png"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/batch-remove-background")
async def batch_remove_background(files: list[UploadFile] = File(...)):
    """
    Remove background from multiple images
    
    Args:
        files: List of uploaded image files
        
    Returns:
        List of processed images with metadata
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch")
    
    results = []
    
    for i, file in enumerate(files):
        try:
            # Process each file
            contents = await file.read()
            
            if len(contents) > 10 * 1024 * 1024:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": "File size exceeds 10MB limit"
                })
                continue
            
            output_data = remove(contents)
            
            # Encode as base64 for JSON response
            import base64
            encoded_image = base64.b64encode(output_data).decode('utf-8')
            
            results.append({
                "filename": file.filename,
                "status": "success",
                "data": f"data:image/png;base64,{encoded_image}",
                "size": len(output_data)
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e)
            })
    
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )