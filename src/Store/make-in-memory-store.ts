import type {
  ChatRecord,
  ContactRecord,
  GroupRecord,
  IncomingMessage,
  MessageAck,
} from "@berrysdk/events";

export interface InMemoryStoreState {
  chats: Map<string, ChatRecord>;
  contacts: Map<string, ContactRecord>;
  groups: Map<string, GroupRecord>;
  messages: Map<string, IncomingMessage>;
  acks: Map<string, MessageAck>;
}

export const makeInMemoryStore = (): InMemoryStoreState => ({
  chats: new Map(),
  contacts: new Map(),
  groups: new Map(),
  messages: new Map(),
  acks: new Map(),
});
