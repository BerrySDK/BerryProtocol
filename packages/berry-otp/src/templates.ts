/**
 * @module modulo
 * @description Enhanced message sending capabilities including albums, cards,
 * interactive buttons, and rich media support beyond standard WhatsApp messages.
 * @license Apache-2.0
 * @author Lipe Devv and Berry Protocol
 */
import { type RenderOTPTemplateInput, type RenderOTPTemplateResult } from "./types.js";

export const renderOTPTemplate = ({
  issuer,
  code,
  purpose,
  template,
}: RenderOTPTemplateInput): RenderOTPTemplateResult => {
  switch (template) {
    case "login":
      return {
        text: [
          "Codigo de login",
          "",
          "Use o codigo abaixo para entrar na sua conta:",
          "",
          `*${code}*`,
          "",
          issuer,
        ].join("\n"),
      };
    case "password_reset":
      return {
        text: [
          "Redefinicao de senha",
          "",
          "Use o codigo abaixo para redefinir sua senha:",
          "",
          `*${code}*`,
          "",
          issuer,
        ].join("\n"),
      };
    case "2fa":
      return {
        text: [
          "Verificacao em duas etapas",
          "",
          "Use o codigo abaixo para continuar:",
          "",
          `*${code}*`,
          "",
          issuer,
        ].join("\n"),
      };
    case "generic":
    default:
      return {
        text: [
          "Codigo de verificacao",
          "",
          `Use o codigo abaixo para ${purpose ?? "continuar"}:`,
          "",
          `*${code}*`,
          "",
          issuer,
        ].join("\n"),
      };
  }
};
