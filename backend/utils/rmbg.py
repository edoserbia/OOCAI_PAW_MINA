import io
import os
import json
import numpy as np
import onnxruntime as ort
from PIL import Image
from threading import Lock
from typing import Optional
from pathlib import Path

class BackgroundRemover:
    """背景去除工具类
    
    使用ONNX量化模型进行背景去除
    实现单例模式，确保模型只被加载一次
    使用锁机制确保模型单进程执行
    """
    _instance = None
    _lock = Lock()
    _session = None
    _config = None
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """初始化ONNX模型和配置"""
        # 获取模型和配置文件路径
        current_dir = Path(__file__).parent.parent
        model_path = current_dir / "onnx_models" / "rmbg" / "model_quantized.onnx"
        config_path = current_dir / "onnx_models" / "rmbg" / "onnx_quantize_config.json"
        
        # 检查文件是否存在
        if not model_path.exists():
            raise FileNotFoundError(f"ONNX model not found at {model_path}")
        if not config_path.exists():
            raise FileNotFoundError(f"ONNX config not found at {config_path}")
        
        # 加载配置文件
        with open(config_path, 'r') as f:
            self._config = json.load(f)
        
        # 创建ONNX运行时会话
        # 使用CUDA提供程序（如果可用）
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        self._session = ort.InferenceSession(
            str(model_path), 
            providers=providers
        )
        
        # 获取模型输入名称
        self._input_name = self._session.get_inputs()[0].name
        self._output_name = self._session.get_outputs()[0].name
    
    def _preprocess_image(self, image: np.ndarray, target_size: tuple = (1024, 1024)) -> np.ndarray:
        """预处理图片
        
        Args:
            image: 输入图片数组
            target_size: 目标大小
            
        Returns:
            np.ndarray: 预处理后的图片数组
        """
        # 确保图片是3通道
        if len(image.shape) < 3:
            image = np.stack([image] * 3, axis=-1)
        elif image.shape[2] == 4:
            image = image[:, :, :3]
        
        # 调整大小
        pil_image = Image.fromarray(image)
        pil_image = pil_image.resize(target_size, Image.Resampling.BILINEAR)
        image = np.array(pil_image)
        
        # 标准化
        image = image.astype(np.float32) / 255.0
        image = (image - 0.5) / 0.5
        
        # 调整维度顺序：HWC -> NCHW
        image = np.transpose(image, (2, 0, 1))
        image = np.expand_dims(image, axis=0)
        
        return image
    
    def _postprocess_mask(self, mask: np.ndarray, original_size: tuple) -> np.ndarray:
        """后处理模型输出的掩码
        
        Args:
            mask: 模型输出的掩码
            original_size: 原始图片大小
            
        Returns:
            np.ndarray: 处理后的掩码数组
        """
        # 调整维度顺序：NCHW -> HW
        mask = np.squeeze(mask)
        
        # 将掩码调整回原始大小
        pil_mask = Image.fromarray(
            (mask * 255).astype(np.uint8), 
            mode='L'
        )
        pil_mask = pil_mask.resize(
            (original_size[1], original_size[0]), 
            Image.Resampling.BILINEAR
        )
        
        return np.array(pil_mask)
    
    def remove_background(self, image_bytes: bytes) -> bytes:
        """去除图片背景
        
        Args:
            image_bytes: 图片二进制数据
            
        Returns:
            bytes: 去除背景后的图片二进制数据
        """
        with self._lock:  # 使用锁确保单进程执行
            try:
                # 将二进制数据转换为PIL Image
                image = Image.open(io.BytesIO(image_bytes))
                # 转换为numpy数组
                image_array = np.array(image)
                original_size = image_array.shape[:2]
                
                # 预处理
                input_tensor = self._preprocess_image(image_array)
                
                # 模型推理
                outputs = self._session.run(
                    [self._output_name], 
                    {self._input_name: input_tensor}
                )
                mask = outputs[0]
                
                # 后处理掩码
                mask = self._postprocess_mask(mask, original_size)
                
                # 应用掩码
                mask_image = Image.fromarray(mask)
                no_bg_image = image.copy()
                no_bg_image.putalpha(mask_image)
                
                # 转换回二进制数据
                output_buffer = io.BytesIO()
                no_bg_image.save(output_buffer, format='PNG')
                return output_buffer.getvalue()
                
            except Exception as e:
                print(f"Background removal failed: {str(e)}")
                return image_bytes  # 如果处理失败，返回原图

# 创建全局实例
background_remover = BackgroundRemover() 