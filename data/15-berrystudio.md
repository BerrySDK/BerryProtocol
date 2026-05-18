# BerryStudio

## Goal

This file documents the role of BerryStudio inside the ecosystem as a management, orchestration, or product-layer surface above BerryProtocol.

## When to use

Consult this file when:

- describing the ecosystem to users
- deciding where flow-building logic belongs
- separating SDK concerns from UI concerns

## Confirmed

The BerryProtocol codebase and prior project context indicate BerryStudio as a product/application layer rather than the transport SDK itself.

## Explanation

BerryStudio should be understood as:

- an operator-facing application
- a workflow, session, or automation management surface
- a place where users configure behavior instead of implementing low-level protocol code

BerryProtocol remains the runtime SDK beneath that layer.

## Example conceptual

BerryStudio might manage:

- sessions
- message templates
- automation flows
- AI assistants
- dashboards

while BerryProtocol is responsible for:

- connectivity
- event handling
- transport-safe message delivery

## Best practices

- keep BerryStudio business logic separate from core transport abstractions
- use a service layer when BerryStudio calls BerryProtocol
- store operator settings and runtime state independently

## Common mistakes

- putting UI concerns inside the protocol layer
- assuming BerryStudio and BerryProtocol should share the same deployment topology

## Important notes

### Suggestion of implementation

BerryAgent may use BerryStudio as an orchestration and operations surface, but BerryProtocol should remain the runtime source of truth for WhatsApp session behavior.
