import { Field } from 'o1js';
import * as Comlink from "comlink";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------
  worker: Worker;
  // Proxy to interact with the worker's methods as if they were local
  remoteApi: Comlink.Remote<typeof import('./zkappWorker').api>;

  constructor() {
    // 使用动态导入来创建worker
    if (typeof window !== 'undefined') {
      // @ts-ignore
      this.worker = new Worker(new URL('./zkappWorker.ts?worker', import.meta.url));
      this.remoteApi = Comlink.wrap(this.worker);
    } else {
      // 服务器端渲染时的处理
      this.worker = null as any;
      this.remoteApi = null as any;
    }
  }

  // 设置Devnet网络
  async setActiveInstanceToDevnet() {
    return this.remoteApi.setActiveInstanceToDevnet();
  }

  // 加载合约
  async loadContract() {
    return this.remoteApi.loadContract();
  }

  // 编译合约
  async compileContract() {
    return this.remoteApi.compileContract();
  }

  // 获取账户信息
  async fetchAccount(publicKeyBase58: string) {
    return this.remoteApi.fetchAccount(publicKeyBase58);
  }

  // 初始化合约实例
  async initZkappInstance(publicKeyBase58: string) {
    return this.remoteApi.initZkappInstance(publicKeyBase58);
  }

  // 创建记录Story的交易
  async createRecordStoryTransaction(storyId: string) {
    return this.remoteApi.createRecordStoryTransaction(storyId);
  }

  // 证明交易
  async proveTransaction() {
    return this.remoteApi.proveTransaction();
  }

  // 获取交易JSON
  async getTransactionJSON() {
    return this.remoteApi.getTransactionJSON();
  }
}