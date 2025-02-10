from datetime import datetime, timedelta
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Security
from pydantic import BaseModel, Field

from models.user import User
from utils.auth import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "unauthorized",
                            "message": "Invalid signature or wallet address"
                        }
                    }
                }
            }
        }
    }
)


class LoginRequest(BaseModel):
    """登录请求模型"""
    wallet_address: str = Field(
        ...,
        description="钱包地址",
        example="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
    )
    signature: str = Field(
        ...,
        description="签名结果",
        example="0x2ac19db245478a06032e69cdaa2dbda4"
    )
    message: str = Field(
        ...,
        description="签名消息",
        example="Welcome to PAW!"
    )
    wallet_type: str = Field(
        default="ethereum",
        description="钱包类型：ethereum 或 mina",
        example="ethereum"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "wallet_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                "signature": "0x2ac19db245478a06032e69cdaa2dbda4",
                "message": "Welcome to PAW!",
                "wallet_type": "ethereum"
            }
        }


class LoginResponse(BaseModel):
    """登录响应模型"""
    access_token: str = Field(..., description="PAW访问令牌")
    wallet_address: str = Field(..., description="钱包地址")
    username: str = Field(..., description="用户名")
    expires_at: datetime = Field(..., description="令牌过期时间（3天后）")
    wallet_type: str = Field(..., description="钱包类型")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "paw_71c7656ec7",
                "wallet_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                "username": "6ec7ab88",
                "expires_at": "2024-01-04T00:00:00Z",
                "wallet_type": "ethereum"
            }
        }


class LogoutResponse(BaseModel):
    """登出响应模型"""
    message: str = Field(..., description="登出结果消息")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Successfully logged out"
            }
        }


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="钱包登录",
    description="使用钱包地址和签名进行登录，支持以太坊和Mina钱包",
    responses={
        200: {
            "description": "登录成功",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "paw_71c7656ec7",
                        "wallet_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
                        "username": "6ec7ab88",
                        "expires_at": "2024-01-04T00:00:00Z",
                        "wallet_type": "ethereum"
                    }
                }
            }
        },
        401: {
            "description": "签名验证失败",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "invalid_signature",
                            "message": "Invalid signature for the given wallet address"
                        }
                    }
                }
            }
        }
    }
)
async def login(request: LoginRequest) -> LoginResponse:
    """钱包登录
    
    Args:
        request: 登录请求，包含钱包地址、签名和钱包类型
        
    Returns:
        LoginResponse: 登录成功响应，包含访问令牌
        
    Raises:
        HTTPException: 签名验证失败时抛出401错误
    """
    # 验证签名（这里需要实现具体的验证逻辑）
    if not verify_signature(request.wallet_address, request.signature, request.message, request.wallet_type):
        raise HTTPException(
            status_code=401,
            detail="Invalid signature for the given wallet address"
        )
    
    # 创建或更新用户
    user = await User.get_by_wallet(request.wallet_address, request.wallet_type)
    if not user:
        user = User(
            wallet_address=request.wallet_address,
            wallet_type=request.wallet_type,
            username=User.generate_default_username(request.wallet_address)
        )
    elif not user.username:  # 如果是旧用户没有用户名
        user.username = User.generate_default_username(request.wallet_address)
    
    # 生成访问令牌
    expires_at = datetime.utcnow() + timedelta(days=3)
    access_token = f"paw_{request.wallet_type}_{request.wallet_address[-8:]}"
    
    # 更新用户令牌
    await user.update_token(access_token, expires_at)
    
    return LoginResponse(
        access_token=access_token,
        wallet_address=request.wallet_address,
        username=user.username,
        expires_at=expires_at,
        wallet_type=user.wallet_type
    )


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="退出登录",
    description="使当前访问令牌失效",
    responses={
        200: {
            "description": "登出成功",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Successfully logged out"
                    }
                }
            }
        }
    }
)
async def logout(
    current_user: User = Security(get_current_user)
) -> LogoutResponse:
    """退出登录
    
    Args:
        current_user: 当前登录用户（通过鉴权获得）
        
    Returns:
        LogoutResponse: 登出成功响应
        
    Raises:
        HTTPException: 未授权时抛出401错误
    """
    # 生成新的访问令牌（使当前令牌失效）
    current_user.paw_access_token = f"paw_{current_user.wallet_address[2:10]}_{datetime.utcnow().timestamp()}"
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return LogoutResponse(message="Successfully logged out")


def verify_signature(wallet_address: str, signature: str, message: str, wallet_type: str = "ethereum") -> bool:
    """验证签名
    
    Args:
        wallet_address: 钱包地址
        signature: 签名结果
        message: 签名消息
        wallet_type: 钱包类型
        
    Returns:
        bool: 验证是否通过
    """
    # TODO: 实现具体的签名验证逻辑
    return True  # 临时返回True，方便测试 