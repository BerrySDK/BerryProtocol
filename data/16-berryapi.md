# BerryAPI

## Goal

This file explains the purpose of BerryAPI as the REST/API surface above BerryProtocol.

## When to use

Use this file when:

- exposing BerryProtocol capabilities externally
- integrating with n8n, Typebot, or backend systems
- designing webhooks and automation endpoints

## Confirmed

The repository includes a BerryAPI package intended to provide an API-oriented layer around BerryProtocol.

## Explanation

BerryAPI should be treated as:

- the external integration surface
- the place for REST endpoints, webhooks, and event streaming
- the bridge between product UIs and transport runtimes

BerryProtocol should be treated as:

- the SDK runtime
- the session and message transport engine
- the source of real-time message behavior

## Example conceptual

Possible layering:

- BerryProtocol
  - handles session, auth, events, and sends
- BerryAPI
  - exposes instance management, webhooks, and message endpoints
- BerryAgent
  - consumes both the SDK and the knowledge base for intelligent behavior

## Best practices

- keep BerryAPI stateless where possible
- centralize session ownership in a manager
- forward important runtime events to webhooks or WebSocket clients

## Common mistakes

- treating API requests as the only source of truth for runtime state
- not reconciling webhook delivery failures

## Important notes

BerryAgent can run:

- behind BerryAPI as an API-powered assistant
- or directly against BerryProtocol for local/private deployments
