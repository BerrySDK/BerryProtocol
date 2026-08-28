/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
# WhatsApp Rendering Notes

This document records the BerryProtocol changes that made legacy list messages, reply buttons, copy-code buttons, and CTA URL buttons render correctly in WhatsApp Web and on mobile devices, plus the current status of native-flow interactivity.

## Goal

Fix the WhatsApp client error:

- `Não foi possível carregar a mensagem. Use seu celular para acessá-la.`

The problem was not basic delivery. Text messages already reached `delivered`. The issue was the message rendering path used by rich message types such as:

- `interactiveMessage`
- `nativeFlowMessage`
- `buttonsMessage`
- `listMessage`

## What worked

### Text

Normal text sent through `sock.sendMessage(...)` delivered correctly.

### Legacy list

Legacy `listMessage` started rendering after Berry switched to:

1. `proto.Message.ListMessage.fromObject(...)`
2. `listType: SINGLE_SELECT`
3. `relayMessage(...)` with `additionalNodes`:

```xml
<biz>
  <list type="product_list" v="2"/>
</biz>
```

This was the breakthrough that made the list render on both WhatsApp Web and mobile.

## Current status

### Legacy list

Status: working

Berry now sends lists through the legacy path by default:

- file: [packages/wa-message/src/index.ts](C:/Users/felip/BerryProtocol/packages/wa-message/src/index.ts)
- file: [packages/socket/src/index.ts](C:/Users/felip/BerryProtocol/packages/socket/src/index.ts)

Relevant builder:

```ts
listMessage: proto.Message.ListMessage.fromObject({
  title,
  description,
  buttonText,
  listType: proto.Message.ListMessage.ListType.SINGLE_SELECT,
  footerText,
  sections,
})
```

Relevant relay metadata:

```ts
additionalNodes: [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "list",
        attrs: { type: "product_list", v: "2" },
      },
    ],
  },
]
```

### Reply buttons

Status: working

Berry reply buttons render correctly when sent through native-flow interactive payloads using `quick_reply` buttons plus the `biz/interactive/native_flow` relay metadata.

Working builder:

```ts
interactivePayloadToMessageContent({
  body: {
    text,
  },
  footer: footer ? { text: footer } : undefined,
  nativeFlowMessage: {
    buttons: buttons.map((button) => ({
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: button.title,
        id: button.id,
      }),
    })),
    messageParamsJson: "",
    messageVersion: 1,
  },
})
```

Working relay metadata:

```ts
additionalNodes: [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: { type: "native_flow", v: "1" },
        content: [
          {
            tag: "native_flow",
            attrs: { v: "9", name: "mixed" },
          },
        ],
      },
    ],
  },
]
```

Legacy builder kept as historical reference:

```ts
buttonsMessage: proto.Message.ButtonsMessage.fromObject({
  contentText: text,
  footerText: footer,
  buttons: [
    {
      buttonId,
      buttonText: { displayText },
      type: proto.Message.ButtonsMessage.Button.Type.RESPONSE,
    },
  ],
  headerType: proto.Message.ButtonsMessage.HeaderType.EMPTY,
})
```

### Copy code buttons

Status: working

Berry copy-code buttons render correctly when sent through the same native-flow interactive path used for reply buttons, but with the native button name `cta_copy`.

Working builder:

```ts
interactivePayloadToMessageContent({
  body: {
    text,
  },
  footer: footer ? { text: footer } : undefined,
  nativeFlowMessage: {
    buttons: [
      {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
          display_text: title,
          copy_code: code,
        }),
      },
    ],
    messageParamsJson: "",
    messageVersion: 1,
  },
})
```

Working relay metadata:

```ts
additionalNodes: [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: { type: "native_flow", v: "1" },
        content: [
          {
            tag: "native_flow",
            attrs: { v: "9", name: "mixed" },
          },
        ],
      },
    ],
  },
]
```

### CTA URL buttons

Status: working

Berry CTA URL buttons render correctly when sent through the same native-flow interactive path used for reply and copy-code buttons, but with the native button name `cta_url`.

Working builder:

```ts
interactivePayloadToMessageContent({
  body: {
    text,
  },
  footer: footer ? { text: footer } : undefined,
  nativeFlowMessage: {
    buttons: [
      {
        name: "cta_url",
        buttonParamsJson: JSON.stringify({
          display_text: title,
          url,
          merchant_url: url,
        }),
      },
    ],
    messageParamsJson: "",
    messageVersion: 1,
  },
})
```

Working relay metadata:

```ts
additionalNodes: [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: { type: "native_flow", v: "1" },
        content: [
          {
            tag: "native_flow",
            attrs: { v: "9", name: "mixed" },
          },
        ],
      },
    ],
  },
]
```

### Native-flow interactive messages

Status: still unstable for current clients

Berry now uses:

1. `proto.Message.InteractiveMessage.create(...)`
2. `relayMessage(...)`
3. `additionalNodes`:

```xml
<biz>
  <interactive type="native_flow" v="1">
    <native_flow v="9" name="mixed"/>
  </interactive>
</biz>
```

Current relay metadata:

```ts
additionalNodes: [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: { type: "native_flow", v: "1" },
        content: [
          {
            tag: "native_flow",
            attrs: { v: "9", name: "mixed" },
          },
        ],
      },
    ],
  },
]
```

Important note:

- Berry no longer wraps this interactive payload in `viewOnceMessage` for the native-flow path.
- This change was based on recent reports that the wrapper can break rendering in newer clients.
- The same native-flow relay path is now also used for working reply, copy-code, and CTA URL buttons.

## Files involved

### Core builders

- [packages/wa-message/src/index.ts](C:/Users/felip/BerryProtocol/packages/wa-message/src/index.ts)

Contains:

- `listToLegacyListMessageContent`
- `legacyListAdditionalNodes`
- `buttonsPayloadToNativeFlowInteractiveContent`
- `buttonsPayloadToLegacyButtonsMessageContent`
- `interactivePayloadToMessageContent`
- `interactiveNativeFlowAdditionalNodes`

### Transport

- [packages/socket/src/index.ts](C:/Users/felip/BerryProtocol/packages/socket/src/index.ts)

Contains:

- `sendListMessage(...)`
- `sendReplyButtonsMessage(...)`
- `sendInteractiveMessage(...)`

These methods call `generateWAMessageFromContent(...)` and then `relayMessage(...)` with the required extra nodes.

## Why list started working

The most important changes were:

1. stop using `interactiveMessage + single_select` as the default list format
2. use legacy `listMessage`
3. set `listType: SINGLE_SELECT`
4. inject the `biz/list` node through `additionalNodes`

That combination was what finally rendered correctly in current WhatsApp Web and mobile tests.

## Safe defaults for Berry right now

Use these as the default public behavior:

- `list` -> legacy `listMessage`
- `listMessage` -> legacy `listMessage`
- `buttonsMessage` -> native-flow interactive buttons
- `interactiveMessage` -> explicit advanced path only

Working button variants already validated:

- `quick_reply`
- `cta_copy`
- `cta_url`

This keeps the public API stable while steering users into the paths that currently render best.

## Test flow used

Primary test script:

- [examples/sdk/test-berry-new-ways.js](C:/Users/felip/BerryProtocol/examples/sdk/test-berry-new-ways.js)

Baileys reference test:

- [examples/sdk/test-baileys-same-session.js](C:/Users/felip/BerryProtocol/examples/sdk/test-baileys-same-session.js)

Payload comparison:

- [examples/sdk/compare-berry-vs-baileys.js](C:/Users/felip/BerryProtocol/examples/sdk/compare-berry-vs-baileys.js)

## Next steps

Priority order:

1. document and stabilize the validated button variants
2. add documented helpers for working button types
3. expand to other advanced interactive formats
4. keep a compatibility matrix for Web/Desktop/mobile behavior

## Practical conclusion

To make WhatsApp rich messages render in current clients, payload shape alone is not enough. The relay path and the extra business nodes matter.

The working rule discovered so far is:

- use legacy list for list UIs
- use native-flow quick reply for reply buttons
- use native-flow `cta_copy` for copy-code buttons
- use native-flow `cta_url` for CTA URL buttons
- use native-flow only as an explicit advanced path with the correct `additionalNodes`

## AI label

Status: working in real private-chat tests

Berry now supports an experimental AI label path in the patched local Baileys flow.

Working usage:

```ts
await sock.sendMessage("5511999999999@s.whatsapp.net", {
  text: "Ola! Essa mensagem deve aparecer com label de AI.",
  ai: true,
});
```

Rules validated so far:

- only private chats are allowed
- groups, newsletters, status, and non-user JIDs must be blocked
- the message must receive `messageContextInfo.supportPayload`
- the relay must include:

```xml
<bot biz_bot="1" />
```

Implementation status in this workspace:

- `ai?: boolean` was added to the accepted message content type in the local patched Baileys install
- `sendMessage(...)` removes `content.ai` before the final payload is generated
- `relayMessage(...)` injects the `bot` additional node
- BerryProtocol forwards `ai: true` on supported `sendMessage(...)` paths

Local test files:

- [examples/sdk/test-baileys-ai-label.js](C:/Users/felip/BerryProtocol/examples/sdk/test-baileys-ai-label.js)
- [examples/sdk/test-berry-ai-label.ts](C:/Users/felip/BerryProtocol/examples/sdk/test-berry-ai-label.ts)

Distribution note:

- the publish-safe strategy now lives in [packages/socket/scripts/patch-installed-baileys.mjs](C:/Users/felip/BerryProtocol/packages/socket/scripts/patch-installed-baileys.mjs)
- `@berrysdk/socket` runs this patch in `postinstall`
- this makes the AI label patch travel with the published Berry packages that depend on `@berrysdk/socket`
- the feature should still be treated as experimental because WhatsApp can change the required metadata at any time
