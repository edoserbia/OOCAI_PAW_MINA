from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, HTTPException, Response, Depends, Security
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer

from config.settings import settings
from utils.image import save_upload_file, get_image_url
from models.user import User
from utils.auth import get_current_user

router = APIRouter(
    prefix="/images",
    tags=["images"],
    responses={
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "unauthorized",
                            "message": "Invalid API key or token."
                        }
                    }
                }
            }
        }
    }
)


class ImageUploadResponse(BaseModel):
    """图片上传响应模型"""
    url: str
    filename: str

    class Config:
        json_schema_extra = {
            "example": {
                "url": "http://vd1261kq672.vicp.fun:45271/images/123e4567-e89b-12d3-a456-426614174000.jpg",
                "filename": "123e4567-e89b-12d3-a456-426614174000.jpg"
            }
        }


@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    summary="上传图片",
    description="上传图片文件（支持jpg/png/gif/webp格式），返回图片访问URL",
    responses={
        200: {
            "description": "成功上传图片",
            "content": {
                "application/json": {
                    "example": {
                        "url": "http://vd1261kq672.vicp.fun:45271/images/123e4567-e89b-12d3-a456-426614174000.jpg",
                        "filename": "123e4567-e89b-12d3-a456-426614174000.jpg"
                    }
                }
            }
        },
        400: {
            "description": "无效的图片文件",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "invalid_file",
                            "message": "Invalid image file. Only jpg/png/gif/webp formats are allowed."
                        }
                    }
                }
            }
        }
    }
)
async def upload_image(
    file: UploadFile,
    current_user: User = Security(get_current_user)
) -> ImageUploadResponse:
    """上传图片
    
    Args:
        file: 上传的图片文件，支持jpg/png/gif/webp格式
        current_user: 当前登录用户（通过鉴权获得）
        
    Returns:
        ImageUploadResponse: 包含图片URL和文件名
        
    Raises:
        HTTPException: 上传失败时抛出400错误
        HTTPException: 未授权时抛出401错误
    """
    filename = await save_upload_file(file)
    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. Only jpg/png/gif/webp formats are allowed."
        )
    
    return ImageUploadResponse(
        url=get_image_url(filename),
        filename=filename
    )


@router.get(
    "/{filename}",
    summary="获取图片",
    description="通过文件名获取图片文件，无需鉴权",
    responses={
        200: {
            "description": "图片文件",
            "content": {
                "image/*": {}
            }
        },
        404: {
            "description": "图片不存在",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "not_found",
                            "message": "Image not found"
                        }
                    }
                }
            }
        }
    }
)
async def get_image(
    filename: str
) -> Response:
    """获取图片
    
    Args:
        filename: 图片文件名
        
    Returns:
        FileResponse: 图片文件响应
        
    Raises:
        HTTPException: 图片不存在时抛出404错误
    """
    file_path = Path(settings.IMAGE_STORAGE_PATH) / filename
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )
    
    return FileResponse(
        file_path,
        media_type=f"image/{file_path.suffix[1:]}"  # 根据文件扩展名设置Content-Type
    ) 