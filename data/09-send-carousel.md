# Sending Carousel Messages

## Goal

This file explains how to send modern WhatsApp carousel messages in BerryProtocol.

## Confirmed

The current client supports:

- `sendCarousel(to, payload)`
- `sendMessage(to, { text, footer, cards, carouselCardType, ai })`

The current event contracts also include carousel payload types such as:

- `CarouselMessagePayload`
- `CarouselCard`
- `CarouselButton`
- `CarouselCardType`

## When to use

Use carousels when:

- you need multiple product or offer cards
- you want richer browsing inside WhatsApp
- each card needs its own image/video and action

## Practical example

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "carousel-session",
});

await client.connectWithQr();

await client.sendCarousel("5511999999999@s.whatsapp.net", {
  text: "Check out our featured products",
  footer: "Swipe to see more",
  carouselCardType: "image",
  cards: [
    {
      title: "Calabresa Pizza",
      body: "Large size with premium ingredients",
      footer: "R$ 39,90",
      image: {
        url: "https://example.com/media/calabresa.jpg",
      },
      buttons: [
        {
          id: "buy_calabresa",
          title: "Choose",
          kind: "quick_reply",
        },
      ],
    },
  ],
});
```

## Best practices

- keep cards visually consistent
- do not mix image and video unless the business case is strong
- define stable button IDs per card
- keep each card focused on one decision

## Common mistakes

- building cards without image or video
- using too many cards for a simple task
- turning a carousel into a dense text wall

## Important notes

### Confirmed

BerryProtocol validates important carousel constraints internally, including maximum cards and media requirements.

### Confirmed

AI label can be attached at the message/container level of a carousel.

### Example conceptual

Per-card AI label rendering should be treated as unsupported unless a future protocol-confirmed implementation exists.
