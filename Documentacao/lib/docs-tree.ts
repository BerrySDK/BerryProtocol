export const docsTree = {
  name: "BerrySDK Docs",
  children: [
    {
      type: "folder",
      name: "berryprotocol",
      icon: "Package2",
      children: [
        { type: "page", name: "index", url: "/docs/berryprotocol" },
        { type: "page", name: "getting-started", url: "/docs/berryprotocol/getting-started" },
        { type: "page", name: "messaging", url: "/docs/berryprotocol/messaging" },
        { type: "page", name: "ai-label", url: "/docs/berryprotocol/ai-label" }
      ]
    },
    {
      type: "folder",
      name: "berryotp",
      icon: "ShieldCheck",
      children: [
        { type: "page", name: "index", url: "/docs/berryotp" },
        { type: "page", name: "quick-start", url: "/docs/berryotp/quick-start" },
        { type: "page", name: "flows", url: "/docs/berryotp/flows" },
        { type: "page", name: "security", url: "/docs/berryotp/security" }
      ]
    }
  ]
} as const;
