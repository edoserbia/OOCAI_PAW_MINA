import { Mina, PublicKey, fetchAccount, Field } from 'o1js';
import * as Comlink from "comlink";
import type { StoryRecord } from '@/contracts/src/StoryRecord';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  StoryRecordInstance: null as null | typeof StoryRecord,
  zkappInstance: null as null | StoryRecord,
  transaction: null as null | Transaction,
};

export const api = {
  async setActiveInstanceToDevnet() {
    const Network = Mina.Network('https://api.minascan.io/node/devnet/v1/graphql');
    console.log('Devnet network instance configured');
    Mina.setActiveInstance(Network);
  },
  async loadContract() {
    const { StoryRecord } = await import(
      /* webpackIgnore: true */
      '../../contracts/build/src/StoryRecord.js'
    );
    state.StoryRecordInstance = StoryRecord;
  },
  async compileContract() {
    await state.StoryRecordInstance!.compile();
  },
  async fetchAccount(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    return fetchAccount({ publicKey });
  },
  async initZkappInstance(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    state.zkappInstance = new state.StoryRecordInstance!(publicKey);
  },
  async createRecordStoryTransaction(storyId: string) {
    state.transaction = await Mina.transaction(async () => {
      const storyField = Field.from(storyId);
      await state.zkappInstance!.recordStory(storyField);
    });
  },
  async proveTransaction() {
    await state.transaction!.prove();
  },
  async getTransactionJSON() {
    return state.transaction!.toJSON();
  },
};

// Expose the API to be used by the main thread
Comlink.expose(api);