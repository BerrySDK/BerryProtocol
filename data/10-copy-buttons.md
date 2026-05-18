# Copy Buttons

## Goal

This file documents copy-code style buttons and how they fit into business flows such as OTP and coupon delivery.

## Confirmed

The event contracts currently include button kinds such as:

- `copy_code`
- `cta_url`
- `quick_reply`
- `reply`

BerryOTP also uses copy-oriented interaction patterns in its current implementation.

## When to use

Use copy buttons when:

- sending one-time codes
- sharing coupons
- reducing typing errors for end users

## Example conceptual

The exact public high-level method for standalone copy-button composition may evolve.
Until the public API is finalized, treat this example as conceptual.

```js
import BerryProtocol from "berryprotocol";

const client = new BerryProtocol({
  sessionId: "copy-button-session",
});

await client.connectWithQr();

await client.sendButtons("5511999999999@s.whatsapp.net", {
  text: "Your verification code is ready",
  footer: "Tap to copy",
  buttons: [
    {
      id: "copy_login_code",
      title: "Copy code",
      kind: "copy_code",
      code: "483921",
    },
  ],
});
```

## Best practices

- use copy buttons for high-friction inputs
- log the flow state separately from the button press itself
- pair copy buttons with expiration guidance when the value is temporary

## Common mistakes

- using copy buttons for actions that should be replies
- exposing long-lived sensitive values without expiration or revocation logic

## Important notes

### Confirmed

BerryOTP is currently the best confirmed reference for copy-code style flows in the BerrySDK ecosystem.

### Implementation suggestion

If BerryAgent sends verification or secure action codes, it should also store:

- issuance timestamp
- expiration timestamp
- code purpose
- denial/cancel status
