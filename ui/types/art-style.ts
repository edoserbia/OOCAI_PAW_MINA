// 艺术风格状态类型
export type ArtStyleStatus = 'active' | 'inactive';

// 艺术风格数据接口
export interface ArtStyle {
  name: string;          // 风格名称
  image: string;         // 风格示例图片URL
  keyword: string;       // 生成图片时使用的关键词
  status: ArtStyleStatus;// 状态
  created_at: string;    // 创建时间
  updated_at: string;    // 更新时间
}

// 获取艺术风格列表的请求参数
export interface GetArtStylesParams {
  status?: ArtStyleStatus;
}

// 获取艺术风格列表的响应数据
export interface GetArtStylesResponse {
  art_styles: ArtStyle[];
  total: number;
} 