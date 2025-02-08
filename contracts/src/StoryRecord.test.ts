import { StoryRecord } from './StoryRecord';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'o1js';

/*
 * 这个文件包含了基本的合约测试
 * 运行 `npm run test` 来执行这些测试
 */

let proofsEnabled = false;

describe('StoryRecord', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: StoryRecord;

  beforeAll(async () => {
    if (proofsEnabled) await StoryRecord.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new StoryRecord(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy({});
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `StoryRecord` smart contract', async () => {
    await localDeploy();
    const storyCount = await zkApp.fetchStoryCount();
    expect(storyCount).toEqual(Field(0));
  });

  it('correctly records a new story', async () => {
    await localDeploy();

    // 创建一个模拟的 story hash
    const storyHash = Field(123456789);

    // 记录 story
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.recordStory(storyHash);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // 验证 story hash 和计数
    const lastStoryHash = await zkApp.fetchLastStoryHash();
    const storyCount = await zkApp.fetchStoryCount();

    expect(lastStoryHash).toEqual(storyHash);
    expect(storyCount).toEqual(Field(1));
  });

  it('correctly updates story count for multiple stories', async () => {
    await localDeploy();

    // 记录多个 stories
    for (let i = 1; i <= 3; i++) {
      const storyHash = Field(i * 1000);
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.recordStory(storyHash);
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
    }

    // 验证最后的 story hash 和总数
    const lastStoryHash = await zkApp.fetchLastStoryHash();
    const storyCount = await zkApp.fetchStoryCount();

    expect(lastStoryHash).toEqual(Field(3000));
    expect(storyCount).toEqual(Field(3));
  });
}); 