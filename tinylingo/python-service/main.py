from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
from rembg import remove, new_session
from PIL import Image
import io
import logging
from typing import Optional

# Available rembg models - 只保留最佳模型
AVAILABLE_MODELS = {
    "isnet-general-use": "ISNet model (better for complex objects and small details)"
}

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

@app.get("/models")
async def get_available_models():
    """
    Get list of available rembg models
    
    Returns:
        Dictionary of available models with descriptions
    """
    return {"models": AVAILABLE_MODELS}

@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...), model: Optional[str] = Query("isnet-general-use", description="Model to use for background removal")):
    """
    Remove background from uploaded image
    
    Args:
        file: Uploaded image file (JPG, PNG, WebP)
        model: Model to use for background removal (default: isnet-general-use)
        
    Returns:
        PNG image with transparent background
    """
    try:
        # Validate model
        if model not in AVAILABLE_MODELS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model '{model}'. Available models: {list(AVAILABLE_MODELS.keys())}"
            )
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read the uploaded file
        contents = await file.read()
        
        # Validate file size (10MB limit)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        logger.info(f"Processing image: {file.filename}, size: {len(contents)} bytes, model: {model}")
        
        # Create session with specified model
        session = new_session(model)
        
        # Remove background using rembg with specified model
        output_data = remove(contents, session=session)
        
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
        
        # Create safe filename for download
        safe_filename = "no_bg_image.png"
        if file.filename:
            try:
                # Extract base name and create safe filename
                base_name = file.filename.split('.')[0]
                # Use only ASCII characters for filename
                safe_filename = f"no_bg_{base_name.encode('ascii', 'ignore').decode('ascii')}.png"
                if not safe_filename.replace('no_bg_', '').replace('.png', ''):
                    safe_filename = "no_bg_image.png"
            except:
                safe_filename = "no_bg_image.png"
        
        # Return the processed image
        return Response(
            content=output_data,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename={safe_filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/bg/remove")
async def bg_remove(file: UploadFile = File(...), model: Optional[str] = Query("isnet-general-use", description="Model to use for background removal")):
    """
    Remove background from uploaded image (alternative endpoint)
    
    Args:
        file: Uploaded image file (JPG, PNG, WebP)
        model: Model to use for background removal (default: isnet-general-use)
        
    Returns:
        PNG image with transparent background
    """
    return await remove_background(file, model)

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