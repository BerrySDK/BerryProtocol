/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
# `berrysdk` Structure

This repository can stay focused on the WhatsApp SDK layer while the broader `berrysdk` account grows into other products.

## Recommended split

Use `berrysdk` as the umbrella account and npm scope:

- GitHub account: `berrysdk`
- npm scope: `@berrysdk/*`

Keep this repository focused on the WhatsApp stack:

- repository: `berry-protocol`
- packages:
  - `@berrysdk/core`
  - `@berrysdk/proto`
  - `@berrysdk/wa-message`
  - `@berrysdk/socket`
  - `@berrysdk/auth`
  - `@berrysdk/events`
  - `@berrysdk/messages`
  - `@berrysdk/media`
  - `@berrysdk/store`
  - `@berrysdk/gateway`
  - `@berrysdk/cli`

## Future repositories

As new products appear, split them by product line rather than by technical layer.

Examples:

- `berry-ai`
- `berry-storage`
- `berry-ui`
- `berry-automation`
- `berry-cloud`

Each repository can still publish under the same scope:

- `@berrysdk/ai`
- `@berrysdk/storage`
- `@berrysdk/ui`
- `@berrysdk/automation`

## Naming rule

Use this pattern:

- account/scope: `berrysdk`
- product/repository: `berry-protocol`
- package: `@berrysdk/<package-name>`

That gives you one public identity while keeping each product isolated and easier to maintain.
