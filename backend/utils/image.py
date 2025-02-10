import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from PIL import Image
import imghdr

from config.settings import settings
from utils.b2_storage import b2_client

# 支持的图片格式
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
}

async def save_upload_file(file: UploadFile) -> str:
    """保存上传的图片文件到B2存储
    
    Args:
        file: 上传的文件对象
        
    Returns:
        str: 保存后的文件名，如果保存失败返回None
    """
    # 读取文件内容
    content = await file.read()
    
    # 检查是否是有效的图片文件
    image_type = imghdr.what(None, content)
    if not image_type:
        return None
    
    # 上传到B2存储
    extension = f".{image_type}"
    return b2_client.upload_bytes(content, extension)

async def save_download_file(content: bytes) -> str:
    """保存下载的图片文件到B2存储
    
    Args:
        content: 图片二进制内容
        
    Returns:
        str: 保存后的文件名，如果保存失败返回None
    """
    # 检查是否是有效的图片文件
    image_type = imghdr.what(None, content)
    if not image_type:
        return None
    
    # 上传到B2存储
    extension = f".{image_type}"
    return b2_client.upload_bytes(content, extension)

def get_image_url(filename: str) -> str:
    """获取B2存储图片访问URL
    
    Args:
        filename: 图片文件名
        
    Returns:
        str: 图片访问URL
    """
    return b2_client.get_url(filename)

def delete_image(filename: str) -> bool:
    """从B2存储删除图片
    
    Args:
        filename: 图片文件名
        
    Returns:
        bool: 是否删除成功
    """
    return b2_client.delete_file(filename) 