export const createInstanceExample = {
  instanceName: "store-01",
  authMethod: "qr",
};

export const setWebhookExample = {
  enabled: true,
  url: "https://example.com/berryapi/webhook",
  events: ["messages.upsert", "connection.update"],
};

export const sendTextExample = {
  to: "5511999999999@s.whatsapp.net",
  text: "Ola! Sua instancia BerryAPI esta funcionando.",
};

export const sendMediaExample = {
  to: "5511999999999@s.whatsapp.net",
  url: "https://example.com/image.png",
  caption: "Imagem enviada pela BerryAPI",
  mimetype: "image/png",
};

export const sendButtonsExample = {
  to: "5511999999999@s.whatsapp.net",
  text: "Escolha uma opcao",
  footer: "BerryAPI",
  buttons: [
    { id: "support", title: "Suporte" },
    { id: "sales", title: "Vendas" },
  ],
};

export const sendTemplateButtonsExample = {
  to: "5511999999999@s.whatsapp.net",
  text: "Escolha uma acao",
  footer: "BerryAPI template",
  buttons: [
    { id: "support", title: "Suporte", type: "reply" },
    { id: "catalog", title: "Catalogo", type: "cta_url", url: "https://berrysdk.com" },
    { id: "otp", title: "Copiar codigo", type: "cta_copy", copyCode: "051272" },
  ],
};

export const sendCopyButtonExample = {
  to: "5511999999999@s.whatsapp.net",
  text: "Use o codigo abaixo para entrar na sua conta.",
  footer: "BerryOTP",
  buttonText: "Copiar codigo",
  buttonId: "login_code",
  copyCode: "051272",
};

export const sendListExample = {
  to: "5511999999999@s.whatsapp.net",
  title: "Menu BerryAPI",
  text: "Escolha uma opcao",
  buttonText: "Abrir menu",
  sections: [
    {
      title: "Atendimento",
      rows: [
        { id: "support", title: "Suporte", description: "Falar com suporte" },
      ],
    },
  ],
};

export const sendPollExample = {
  to: "5511999999999@s.whatsapp.net",
  title: "Qual sabor voce prefere?",
  options: ["Calabresa", "Frango", "Portuguesa"],
  selectableCount: 1,
};

export const sendCarouselExample = {
  to: "5511999999999@s.whatsapp.net",
  text: "Confira nossas pizzas!",
  footer: "BerryAPI carousel",
  carouselCardType: "mixed",
  cards: [
    {
      title: "Pizza Calabresa",
      body: "Calabresa premium",
      footer: "R$ 39,90",
      image: {
        url: "https://images.unsplash.com/photo-1513104890138-7c749659a591",
      },
      buttons: [
        {
          id: "pizza_calabresa",
          title: "Escolher",
          kind: "quick_reply",
        },
      ],
    },
  ],
};

export const sendAiTextExample = {
  to: "5511999999999@s.whatsapp.net",
  text: "Ola! Essa mensagem deve aparecer com AI label em chat privado.",
};
