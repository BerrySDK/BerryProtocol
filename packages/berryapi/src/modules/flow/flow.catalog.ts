export type StudioFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "json";

export interface StudioFieldDefinition {
  key: string;
  label: string;
  type: StudioFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
}

export interface StudioCapability {
  id: string;
  label: string;
  description: string;
  previewKind: string;
  fields: StudioFieldDefinition[];
}

const mediaFields: StudioFieldDefinition[] = [
  {
    key: "url",
    label: "Media URL",
    type: "text",
    placeholder: "https://...",
  },
  {
    key: "path",
    label: "Local path",
    type: "text",
    placeholder: "C:\\media\\image.png",
  },
  {
    key: "base64",
    label: "Base64",
    type: "textarea",
    placeholder: "base64 content",
  },
  {
    key: "caption",
    label: "Caption",
    type: "textarea",
  },
  {
    key: "mimetype",
    label: "Mime type",
    type: "text",
    placeholder: "image/png",
  },
  {
    key: "fileName",
    label: "File name",
    type: "text",
    placeholder: "asset.png",
  },
];

const commonContextFields: StudioFieldDefinition[] = [
  {
    key: "mentions",
    label: "Mentions JSON",
    type: "json",
    placeholder: "[\"5511999999999@s.whatsapp.net\"]",
  },
  {
    key: "contextInfo",
    label: "Context JSON",
    type: "json",
    placeholder: "{\"externalAdReply\": {}}",
  },
  {
    key: "forwardingScore",
    label: "Forwarding score",
    type: "number",
    defaultValue: 0,
  },
  {
    key: "ephemeralExpiration",
    label: "Ephemeral expiration",
    type: "number",
  },
];

export const studioMessageCapabilities: StudioCapability[] = [
  {
    id: "sendText",
    label: "Text",
    description: "Basic WhatsApp text message.",
    previewKind: "text",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "linkPreview", label: "Link preview", type: "checkbox" },
      ...commonContextFields,
    ],
  },
  {
    id: "sendExtendedText",
    label: "Extended Text",
    description: "Extended text using the same payload as text.",
    previewKind: "text",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      ...commonContextFields,
    ],
  },
  {
    id: "sendReply",
    label: "Reply",
    description: "Text reply linked to another message.",
    previewKind: "reply",
    fields: [
      { key: "text", label: "Reply text", type: "textarea", required: true },
      {
        key: "quoted",
        label: "Quoted message JSON",
        type: "json",
        required: true,
        placeholder: "{\"remoteJid\":\"5511...@s.whatsapp.net\",\"id\":\"MSG_ID\"}",
      },
      ...commonContextFields,
    ],
  },
  {
    id: "sendForward",
    label: "Forward",
    description: "Forward an existing raw message payload.",
    previewKind: "event",
    fields: [
      {
        key: "message",
        label: "Forward message JSON",
        type: "json",
        required: true,
        placeholder: "{\"conversation\":\"Forwarded content\"}",
      },
      ...commonContextFields,
    ],
  },
  {
    id: "delete",
    label: "Delete",
    description: "Delete a message in the conversation.",
    previewKind: "event",
    fields: [
      { key: "messageId", label: "Message ID", type: "text", required: true },
      { key: "fromMe", label: "From me", type: "checkbox", defaultValue: true },
      { key: "participant", label: "Participant", type: "text" },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    description: "Edit an existing message.",
    previewKind: "event",
    fields: [
      { key: "messageId", label: "Message ID", type: "text", required: true },
      { key: "text", label: "New text", type: "textarea", required: true },
    ],
  },
  {
    id: "sendReaction",
    label: "Reaction",
    description: "React to an existing message.",
    previewKind: "reaction",
    fields: [
      { key: "emoji", label: "Emoji", type: "text", required: true, placeholder: "👍" },
      { key: "targetMessageId", label: "Target message ID", type: "text", required: true },
    ],
  },
  {
    id: "sendImage",
    label: "Image",
    description: "Send an image with optional caption.",
    previewKind: "image",
    fields: mediaFields,
  },
  {
    id: "sendVideo",
    label: "Video",
    description: "Send a video with optional caption.",
    previewKind: "video",
    fields: mediaFields,
  },
  {
    id: "sendAudio",
    label: "Audio",
    description: "Send an audio clip.",
    previewKind: "audio",
    fields: [
      ...mediaFields,
      { key: "ptt", label: "Voice note (PTT)", type: "checkbox" },
    ],
  },
  {
    id: "sendWhatsAppAudio",
    label: "WhatsApp Audio",
    description: "Alias for WhatsApp-style audio send.",
    previewKind: "audio",
    fields: [
      ...mediaFields,
      { key: "ptt", label: "Voice note (PTT)", type: "checkbox", defaultValue: true },
    ],
  },
  {
    id: "sendDocument",
    label: "Document",
    description: "Send a document.",
    previewKind: "document",
    fields: mediaFields,
  },
  {
    id: "sendSticker",
    label: "Sticker",
    description: "Send a sticker asset.",
    previewKind: "sticker",
    fields: mediaFields,
  },
  {
    id: "sendGif",
    label: "GIF",
    description: "Send a gif/video with gif playback.",
    previewKind: "video",
    fields: mediaFields,
  },
  {
    id: "sendMedia",
    label: "Media Alias",
    description: "Generic media alias routed as image.",
    previewKind: "image",
    fields: mediaFields,
  },
  {
    id: "sendButtons",
    label: "Buttons",
    description: "Quick replies, CTA URLs, copy buttons and native-flow style buttons.",
    previewKind: "buttons",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      { key: "ai", label: "AI label", type: "checkbox" },
      {
        key: "buttons",
        label: "Buttons JSON",
        type: "json",
        required: true,
        placeholder: "[{\"title\":\"Buy now\",\"type\":\"reply\"}]",
      },
    ],
  },
  {
    id: "sendTemplateButtons",
    label: "Template Buttons",
    description: "Template buttons with reply, URL or copy code.",
    previewKind: "buttons",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      {
        key: "buttons",
        label: "Buttons JSON",
        type: "json",
        required: true,
        placeholder: "[{\"title\":\"Open site\",\"type\":\"cta_url\",\"url\":\"https://...\"}]",
      },
    ],
  },
  {
    id: "sendCTAButton",
    label: "CTA Button",
    description: "CTA button payload using the button schema.",
    previewKind: "buttons",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      {
        key: "buttons",
        label: "Buttons JSON",
        type: "json",
        required: true,
        placeholder: "[{\"title\":\"Visit\",\"type\":\"cta_url\",\"url\":\"https://...\"}]",
      },
    ],
  },
  {
    id: "sendCopyButton",
    label: "Copy Button",
    description: "Single copy-code button.",
    previewKind: "buttons",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      { key: "copyCode", label: "Copy code", type: "text", required: true },
      { key: "buttonText", label: "Button text", type: "text", required: true },
      { key: "buttonId", label: "Button ID", type: "text" },
    ],
  },
  {
    id: "sendList",
    label: "List",
    description: "WhatsApp list message with sections and rows.",
    previewKind: "list",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      { key: "buttonText", label: "Button text", type: "text", required: true },
      {
        key: "sections",
        label: "Sections JSON",
        type: "json",
        required: true,
        placeholder: "[{\"title\":\"Products\",\"rows\":[{\"id\":\"sku-1\",\"title\":\"Starter\"}]}]",
      },
    ],
  },
  {
    id: "sendCarousel",
    label: "Carousel",
    description: "Cards with image/video and buttons.",
    previewKind: "carousel",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      {
        key: "carouselCardType",
        label: "Card type",
        type: "select",
        options: [
          { label: "Image", value: "image" },
          { label: "Video", value: "video" },
          { label: "Mixed", value: "mixed" },
        ],
      },
      { key: "ai", label: "AI label", type: "checkbox" },
      {
        key: "cards",
        label: "Cards JSON",
        type: "json",
        required: true,
        placeholder: "[{\"title\":\"Card 1\",\"body\":\"Body\",\"image\":{\"url\":\"https://...\"},\"buttons\":[{\"title\":\"Buy\",\"kind\":\"reply\"}]}]",
      },
    ],
  },
  {
    id: "sendAiText",
    label: "AI Text",
    description: "Text with AI label enabled.",
    previewKind: "text",
    fields: [{ key: "text", label: "Text", type: "textarea", required: true }],
  },
  {
    id: "sendAiCarousel",
    label: "AI Carousel",
    description: "Carousel with AI label enabled.",
    previewKind: "carousel",
    fields: [
      { key: "text", label: "Text", type: "textarea", required: true },
      { key: "footer", label: "Footer", type: "text" },
      {
        key: "cards",
        label: "Cards JSON",
        type: "json",
        required: true,
        placeholder: "[{\"title\":\"AI Card\",\"body\":\"Generated card\",\"image\":{\"url\":\"https://...\"}}]",
      },
    ],
  },
  {
    id: "sendPoll",
    label: "Poll",
    description: "Poll with options and selectable count.",
    previewKind: "poll",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      {
        key: "options",
        label: "Options JSON",
        type: "json",
        required: true,
        placeholder: "[\"Option 1\", \"Option 2\"]",
      },
      { key: "selectableCount", label: "Selectable count", type: "number", defaultValue: 1 },
    ],
  },
  {
    id: "sendLocation",
    label: "Location",
    description: "Static location pin.",
    previewKind: "location",
    fields: [
      { key: "latitude", label: "Latitude", type: "number", required: true },
      { key: "longitude", label: "Longitude", type: "number", required: true },
      { key: "name", label: "Name", type: "text" },
      { key: "address", label: "Address", type: "textarea" },
    ],
  },
  {
    id: "sendLiveLocation",
    label: "Live Location",
    description: "Live location message with speed/accuracy.",
    previewKind: "location",
    fields: [
      { key: "latitude", label: "Latitude", type: "number", required: true },
      { key: "longitude", label: "Longitude", type: "number", required: true },
      { key: "name", label: "Name", type: "text" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "speedInMps", label: "Speed m/s", type: "number" },
      { key: "accuracyInMeters", label: "Accuracy meters", type: "number" },
      { key: "degreesClockwiseFromMagneticNorth", label: "Heading", type: "number" },
    ],
  },
  {
    id: "sendContact",
    label: "Contact",
    description: "Single vCard contact.",
    previewKind: "contacts",
    fields: [
      { key: "displayName", label: "Display name", type: "text", required: true },
      { key: "vcard", label: "vCard", type: "textarea", required: true },
    ],
  },
  {
    id: "sendContacts",
    label: "Contacts",
    description: "Bundle of vCard contacts.",
    previewKind: "contacts",
    fields: [
      { key: "displayName", label: "Display name", type: "text" },
      {
        key: "contacts",
        label: "Contacts JSON",
        type: "json",
        required: true,
        placeholder: "[{\"displayName\":\"Berry\",\"vcard\":\"BEGIN:VCARD...\"}]",
      },
    ],
  },
  {
    id: "sendStatus",
    label: "Status",
    description: "Status text or media payload.",
    previewKind: "status",
    fields: [
      { key: "text", label: "Text", type: "textarea" },
      {
        key: "media",
        label: "Media JSON",
        type: "json",
        placeholder: "{\"url\":\"https://...\",\"caption\":\"Status\"}",
      },
    ],
  },
  {
    id: "sendViewOnceImage",
    label: "View Once Image",
    description: "Image visible once.",
    previewKind: "image",
    fields: mediaFields,
  },
  {
    id: "sendViewOnceVideo",
    label: "View Once Video",
    description: "Video visible once.",
    previewKind: "video",
    fields: mediaFields,
  },
  {
    id: "sendProduct",
    label: "Product",
    description: "Product message payload.",
    previewKind: "product",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "price", label: "Price", type: "text" },
      { key: "retailerId", label: "Retailer ID", type: "text" },
      {
        key: "productImage",
        label: "Product image JSON",
        type: "json",
        placeholder: "{\"url\":\"https://...\"}",
      },
    ],
  },
  {
    id: "sendCatalog",
    label: "Catalog",
    description: "Catalog message payload.",
    previewKind: "catalog",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "businessOwnerJid", label: "Business owner JID", type: "text" },
    ],
  },
  {
    id: "sendCollection",
    label: "Collection",
    description: "Collection message payload.",
    previewKind: "catalog",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "businessOwnerJid", label: "Business owner JID", type: "text" },
      { key: "collectionId", label: "Collection ID", type: "text" },
    ],
  },
];

export const studioNodeTypes = [
  {
    id: "start",
    label: "Start",
    description: "Entry point of the flow.",
  },
  {
    id: "message",
    label: "Message",
    description: "Any BerryProtocol message payload.",
  },
  {
    id: "input",
    label: "Input",
    description: "Waits for a user answer and stores it in a variable.",
  },
  {
    id: "condition",
    label: "Condition",
    description: "Branch based on variables or the last user input.",
  },
  {
    id: "setVariable",
    label: "Set Variable",
    description: "Store a literal or template value in a variable.",
  },
  {
    id: "delay",
    label: "Delay",
    description: "Adds a wait marker in the flow.",
  },
  {
    id: "action",
    label: "Action",
    description: "Non-message methods like edit, delete or reaction.",
  },
  {
    id: "end",
    label: "End",
    description: "Finish the execution.",
  },
];

export const studioConditionOperators = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "notEquals" },
  { label: "Contains", value: "contains" },
  { label: "Starts with", value: "startsWith" },
  { label: "Ends with", value: "endsWith" },
  { label: "Regex", value: "regex" },
  { label: "Exists", value: "exists" },
  { label: "Greater than", value: "gt" },
  { label: "Less than", value: "lt" },
];
