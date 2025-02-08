# Story Record Smart Contract

这个智能合约用于记录用户创建的 story 信息。它是基于 Mina Protocol 的 zkApp 开发的，使用 o1js 框架。

## 功能特性

- 记录用户创建的 story 哈希值
- 追踪已创建的 story 总数
- 支持查询最新创建的 story 哈希
- 支持查询 story 总数

## 开发环境设置

1. 确保已安装 Node.js v20
```bash
nvm use 20
```

2. 安装 zkApp CLI
```bash
npm install -g zkapp-cli
```

3. 安装项目依赖
```bash
cd contract
npm install
```

## 测试

运行单元测试：
```bash
npm run test
```

测试包括：
- 合约部署测试
- 记录单个 story 测试
- 记录多个 stories 测试

## 编译

编译合约和生成证明密钥：
```bash
npm run build
```

## 部署

### 1. 配置部署环境

使用 `zk config` 命令配置部署环境：

```bash
zk config
```

对于 Devnet testnet：
- Deploy alias name: `devnet`
- Mina GraphQL API URL: `https://api.minascan.io/node/devnet/v1/graphql`
- Transaction fee: `0.1`
- 选择创建新的 fee payer account

### 2. 获取测试代币

访问 Mina Protocol Discord 的 #faucet 频道获取测试代币。

### 3. 部署合约

```bash
zk deploy devnet
```

## 合约地址

- Devnet: B62qnFBcDJA52TNz87KK4ZpG44vEWKKr5jrMjSGegXGwiVjX3XhC5A9
- Fee Payer: B62qs1YyfhC8NWC5JxCj6iDnK3vo8ZFqja1n5XooLXnvBocquhdYXKe
- 交易链接: https://minascan.io/devnet/tx/5JtiNjx5nSGbRn27nzYzXdepJpm8dWfVZxS6hYPYCV9GchUm4b3t?type=zk-tx

## 前端集成

在前端创建 story 时，需要：

1. 计算 story 内容的哈希值
2. 调用合约的 `recordStory` 方法记录哈希值
3. 等待交易确认

示例代码：
```typescript
import { StoryRecord } from './StoryRecord';
import { PublicKey, Field, Mina } from 'o1js';

// 初始化合约实例
const zkAppAddress = PublicKey.fromBase58('B62qnFBcDJA52TNz87KK4ZpG44vEWKKr5jrMjSGegXGwiVjX3XhC5A9');
const contract = new StoryRecord(zkAppAddress);

// 记录 story
async function recordStory(storyHash: string) {
  const hash = Field(storyHash);
  const txn = await Mina.transaction(() => {
    contract.recordStory(hash);
  });
  await txn.prove();
  await txn.sign().send();
}
```

## 注意事项

- 确保有足够的 MINA 代币支付交易费用
- 部署和交易可能需要几分钟时间确认
- 在生产环境中使用前确保进行充分的测试

## License

[Apache-2.0](LICENSE)
