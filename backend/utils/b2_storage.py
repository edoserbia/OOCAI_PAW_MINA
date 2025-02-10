import boto3
from botocore.client import Config
from config.settings import settings
import mimetypes

class B2Storage:
    """
    Backblaze B2存储工具类
    处理文件上传、删除和URL生成等操作
    """
    def __init__(self):
        """
        初始化B2存储客户端
        使用环境变量中的配置信息
        """
        self.s3 = boto3.client(
            service_name='s3',
            aws_access_key_id=settings.B2_KEY_ID,
            aws_secret_access_key=settings.B2_APPLICATION_KEY,
            endpoint_url=f'https://{settings.B2_ENDPOINT_URL}',
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'}
            )
        )
        self.bucket_name = settings.B2_BUCKET_NAME
        self.cdn_url = settings.B2_CDN_URL

    def upload_bytes(self, content: bytes, extension: str) -> str:
        """
        上传二进制内容到B2存储
        
        Args:
            content: 文件二进制内容
            extension: 文件扩展名（包含点，如.jpg）
            
        Returns:
            str: 上传后的文件名，失败返回None
        """
        import uuid
        # 生成唯一文件名
        filename = f"{uuid.uuid4().hex}{extension}"
        
        try:
            # 获取正确的content type
            content_type = mimetypes.guess_type(filename)[0] or f'image/{extension[1:]}'
            
            # 使用put_object直接上传二进制内容
            self.s3.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=content,
                ContentType=content_type
            )
            return filename
        except Exception as e:
            print(f"Failed to upload to B2: {str(e)}")
            return None

    def delete_file(self, filename: str) -> bool:
        """
        从B2存储中删除文件
        
        Args:
            filename: 文件名
            
        Returns:
            bool: 是否删除成功
        """
        try:
            self.s3.delete_object(
                Bucket=self.bucket_name,
                Key=filename
            )
            return True
        except Exception as e:
            print(f"Failed to delete from B2: {str(e)}")
            return False

    def get_url(self, filename: str) -> str:
        """
        获取文件的访问URL
        
        Args:
            filename: 文件名
            
        Returns:
            str: 文件访问URL
        """
        return f"{self.cdn_url}/{filename}"

# 创建全局实例
b2_client = B2Storage() 