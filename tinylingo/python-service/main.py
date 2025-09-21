from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
from rembg import remove, new_session
from PIL import Image, ImageEnhance, ImageFilter
import io
import logging
import numpy as np
from typing import Optional

def upscale_image(image: Image.Image, scale_factor: int = 2) -> Image.Image:
    """
    Upscale image using high-quality resampling
    
    Args:
        image: Input image to upscale
        scale_factor: Factor by which to upscale (2, 3, or 4)
        
    Returns:
        Upscaled image with improved resolution
    """
    try:
        if scale_factor not in [2, 3, 4]:
            scale_factor = 2
            
        # Get original dimensions
        width, height = image.size
        new_width = width * scale_factor
        new_height = height * scale_factor
        
        # Use LANCZOS resampling for high-quality upscaling
        upscaled = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Apply slight sharpening to enhance details
        upscaled = upscaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=2))
        
        return upscaled
        
    except Exception as e:
        logger.error(f"Error upscaling image: {str(e)}")
        return image  # Return original if upscaling fails

def enhance_image_quality(image: Image.Image, original_image: Image.Image) -> Image.Image:
    """
    Enhance the processed image to preserve colors and details
    
    Args:
        image: Processed image with transparent background
        original_image: Original image for color reference
        
    Returns:
        Enhanced image with better color preservation
    """
    try:
        # Ensure both images are in RGBA mode
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        if original_image.mode != 'RGBA':
            original_image = original_image.convert('RGBA')
        
        # Get alpha channel (transparency mask)
        alpha = image.split()[-1]
        
        # Create a mask for non-transparent areas
        mask = alpha.point(lambda x: 255 if x > 128 else 0)
        
        # Enhance color saturation for non-transparent areas
        enhancer = ImageEnhance.Color(image)
        enhanced_image = enhancer.enhance(1.2)  # Increase saturation by 20%
        
        # Enhance contrast slightly
        contrast_enhancer = ImageEnhance.Contrast(enhanced_image)
        enhanced_image = contrast_enhancer.enhance(1.1)  # Increase contrast by 10%
        
        # Apply slight sharpening to preserve details
        enhanced_image = enhanced_image.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
        
        # Preserve the original alpha channel
        r, g, b, _ = enhanced_image.split()
        enhanced_image = Image.merge('RGBA', (r, g, b, alpha))
        
        return enhanced_image
        
    except Exception as e:
        logger.warning(f"Image enhancement failed, returning original: {e}")
        return image

def refine_image_edges(image: Image.Image) -> Image.Image:
    """
    Refine edges to reduce artifacts and improve quality
    
    Args:
        image: Image with transparent background
        
    Returns:
        Image with refined edges
    """
    try:
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Get alpha channel
        alpha = image.split()[-1]
        
        # Apply slight blur to alpha channel to soften edges
        blurred_alpha = alpha.filter(ImageFilter.GaussianBlur(radius=1.5))
        
        # Sharpen the alpha channel to preserve details
        sharpened_alpha = blurred_alpha.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
        
        # Combine with original image
        r, g, b, _ = image.split()
        refined_image = Image.merge('RGBA', (r, g, b, sharpened_alpha))
        
        return refined_image
        
    except Exception as e:
        logger.warning(f"Edge refinement failed, returning original: {e}")
        return image

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
async def remove_background(
    file: UploadFile = File(...), 
    model: Optional[str] = Query("isnet-general-use", description="Model to use for background removal"),
    enhance: Optional[bool] = Query(True, description="Apply post-processing enhancement"),
    refine_edges: Optional[bool] = Query(True, description="Apply edge refinement"),
    upscale: Optional[int] = Query(1, description="Upscale factor (1=no upscaling, 2=2x, 3=3x, 4=4x)")
):
    """
    Remove background from uploaded image
    
    Args:
        file: Uploaded image file (JPG, PNG, WebP)
        model: Model to use for background removal (default: isnet-general-use)
        enhance: Apply post-processing enhancement to preserve colors (default: True)
        refine_edges: Apply edge refinement to reduce artifacts (default: True)
        upscale: Upscale factor for higher resolution output (1=no upscaling, 2=2x, 3=3x, 4=4x)
        
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
        
        # Validate upscale parameter
        if upscale not in [1, 2, 3, 4]:
            raise HTTPException(status_code=400, detail="Upscale factor must be 1, 2, 3, or 4")
        
        # Read the uploaded file
        contents = await file.read()
        
        # Validate file size (10MB limit)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        logger.info(f"Processing image: {file.filename}, size: {len(contents)} bytes, model: {model}, enhance: {enhance}, refine_edges: {refine_edges}, upscale: {upscale}x")
        
        # Store original image for enhancement reference
        original_image = Image.open(io.BytesIO(contents))
        
        # Create session with specified model
        session = new_session(model)
        
        # Remove background using rembg with specified model
        output_data = remove(contents, session=session)
        
        # Optional: Process with PIL for additional optimization
        try:
            # Convert to PIL Image for potential processing
            processed_image = Image.open(io.BytesIO(output_data))
            
            # Ensure RGBA mode for transparency
            if processed_image.mode != 'RGBA':
                processed_image = processed_image.convert('RGBA')
            
            # Apply post-processing enhancements if requested
            if enhance:
                logger.info("Applying color and detail enhancement")
                processed_image = enhance_image_quality(processed_image, original_image)
            
            if refine_edges:
                logger.info("Applying edge refinement")
                processed_image = refine_image_edges(processed_image)
            
            # Apply upscaling if requested
            if upscale > 1:
                logger.info(f"Applying {upscale}x upscaling")
                processed_image = upscale_image(processed_image, upscale)
            
            # Save optimized PNG
            output_buffer = io.BytesIO()
            processed_image.save(output_buffer, format='PNG', optimize=True)
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
async def bg_remove(
    file: UploadFile = File(...), 
    model: Optional[str] = Query("isnet-general-use", description="Model to use for background removal"),
    enhance: Optional[bool] = Query(True, description="Apply post-processing enhancement"),
    refine_edges: Optional[bool] = Query(True, description="Apply edge refinement")
):
    """
    Remove background from uploaded image (alternative endpoint)
    
    Args:
        file: Uploaded image file
        model: Model to use for background removal (default: isnet-general-use)
        enhance: Apply post-processing enhancement to preserve colors (default: True)
        refine_edges: Apply edge refinement to reduce artifacts (default: True)
        
    Returns:
        PNG image with transparent background
    """
    return await remove_background(file, model, enhance, refine_edges)

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