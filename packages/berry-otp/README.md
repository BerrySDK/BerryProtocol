# @berrysdk/berry-otp

Official OTP flows for Berry SDK using WhatsApp Web transport, native-flow interactive buttons, and fallback legacy mode.

## Important notes

- This package does **not** use the official WhatsApp Business API.
- It relies on WhatsApp Web behavior observed in real tests.
- `copy-code` was validated in real tests on WhatsApp Web `2.3000.x`.
- WhatsApp can change protocol behavior at any time.
- `stable` mode exists as a fallback.
- `editOnExpire` requires `client.editMessage(...)` support in the SDK.
- Once `verify()` succeeds, the OTP becomes `used`, so it will not expire and edit afterward.

## Modes

- `stable`
- `copy-code`
- `experimental-copy-code`

Recommended default:

- `copy-code`

## Example

```ts
import { BerryClient } from "@berrysdk/core";
import { BerryOTP } from "@berrysdk/berry-otp";

const client = new BerryClient({
  sessionId: "otp-session",
});

await client.connectWithQr();

const otp = BerryOTP.createLoginFlow(client, {
  issuer: "BerryProtocol",
  ttlMs: 2 * 60 * 1000,
  mode: "copy-code",
});

const sent = await otp.sendLoginCode("5511999999999@s.whatsapp.net", {
  userId: "user-001",
  metadata: { source: "example" },
});

console.log(sent);
```
