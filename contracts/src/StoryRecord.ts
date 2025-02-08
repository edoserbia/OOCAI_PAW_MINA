import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
  PublicKey,
  Signature,
  Bool,
} from 'o1js';

/**
 * StoryRecord 合约
 * 用于记录用户创建的 story 信息
 * 每个 story 会记录创建者的地址和 story 的哈希值
 */
export class StoryRecord extends SmartContract {
  // 记录最新创建的 story 哈希值
  @state(Field) lastStoryHash = State<Field>();
  // 记录创建 story 的次数
  @state(Field) storyCount = State<Field>();

  /**
   * 部署合约时的初始化
   */
  async deploy(args: DeployArgs) {
    await super.deploy(args);
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  /**
   * 初始化状态
   */
  @method async init() {
    await super.init();
    this.lastStoryHash.set(Field(0));
    this.storyCount.set(Field(0));
  }

  /**
   * 记录新创建的 story
   * @param storyHash story 内容的哈希值
   */
  @method async recordStory(storyHash: Field) {
    // 获取当前的 story 数量
    const currentCount = this.storyCount.get();
    this.storyCount.requireEquals(currentCount);
    
    // 更新最新的 story 哈希
    this.lastStoryHash.set(storyHash);
    // 增加 story 计数
    this.storyCount.set(currentCount.add(1));
  }

  /**
   * 获取最新创建的 story 哈希
   */
  async fetchLastStoryHash(): Promise<Field> {
    return this.lastStoryHash.get();
  }

  /**
   * 获取已创建的 story 总数
   */
  async fetchStoryCount(): Promise<Field> {
    return this.storyCount.get();
  }
} 