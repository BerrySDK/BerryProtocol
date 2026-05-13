/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { Command } from "commander";
import qrcode from "qrcode-terminal";
import { BerryClient, type BerryAuthMethod } from "@berrysdk/core";

const program = new Command();

const createClient = (sessionId: string, method: BerryAuthMethod, phoneNumber?: string) =>
  new BerryClient({
    sessionId,
    authFolder: process.env.BERRY_AUTH_FOLDER,
    auth: {
      method,
      phoneNumber,
    },
  });

const formatError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const attachCommonListeners = (
  client: BerryClient,
  method: BerryAuthMethod,
  phoneNumber?: string,
): void => {
  client.on("auth.link", ({ value }) => {
    if (method === "link") {
      console.log(value);
    }
  });

  client.on("auth.qr", ({ value }) => {
    if (method === "qr") {
      qrcode.generate(value, { small: true });
    }
  });

  client.on("auth.pairing_code", ({ code }) => {
    if (method === "pairing_code") {
      console.log(`Pairing code (${phoneNumber}): ${code}`);
    }
  });

  client.on("connection.open", (state) => console.log("open", state));
  client.on("connection.close", (state) => console.log("close", state));
  client.on("message.received", (message) => console.log(JSON.stringify(message, null, 2)));
  client.on("auth.error", (error) => console.error(error));
};

program.name("berry").description("BerryProtocol CLI").requiredOption("-s, --session <id>", "session id");

program
  .command("connect")
  .option("--auth <method>", "auth method: link | qr | pairing_code", "link")
  .option("--phone <number>", "phone number for pairing code")
  .option("--pairing-code <code>", "custom pairing code with 8 numeric digits")
  .action(async (options, command) => {
    const root = command.parent?.opts() as { session?: string } | undefined;
    if (!root?.session) {
      throw new Error("Session id is required.");
    }

    const method = options.auth as BerryAuthMethod;
    if (method === "pairing_code" && !options.phone) {
      throw new Error("--phone is required when --auth pairing_code is used.");
    }

    const client = createClient(root.session, method, options.phone);
    attachCommonListeners(client, method, options.phone);
    try {
      await client.connect({
        method,
        phoneNumber: options.phone,
        customPairingCode: options.pairingCode,
      });
    } catch (error) {
      console.error(`Connection failed: ${formatError(error)}`);
      if (method === "pairing_code") {
        console.error(
          "Tip: use a new --session or logout the existing one before requesting a new pairing code.",
        );
      }
      process.exitCode = 1;
    }
  });

program
  .command("send-text")
  .requiredOption("-t, --to <jid>", "recipient jid")
  .requiredOption("-m, --message <text>", "text")
  .action(async (options, command) => {
    const root = command.parent?.opts() as { session?: string } | undefined;
    if (!root?.session) {
      throw new Error("Session id is required.");
    }

    const client = new BerryClient({
      sessionId: root.session,
      authFolder: process.env.BERRY_AUTH_FOLDER,
    });
    await client.connect();
    await client.sendText(options.to, options.message);
    await client.disconnect();
  });

program.parseAsync(process.argv);
