import { generateWAMessageFromContent } from "baileys";
import {
  buttonsPayloadToLegacyButtonsMessageContent,
  buttonsPayloadToTemplateMessageContent,
  interactivePayloadToMessageContent,
  listToLegacyListMessageContent,
  listToInteractiveMessageContent,
  listToInteractivePayload,
} from "../../packages/wa-message/dist/index.js";

const recipient = process.env.BERRY_TEST_TO ?? "5511999999999@s.whatsapp.net";
const userJid = process.env.BERRY_TEST_USER_JID ?? "5511999999999:31@s.whatsapp.net";

const sampleList = {
  title: "Menu BerryProtocol",
  text: "Escolha uma opcao na lista",
  footer: "BerryProtocol",
  buttonText: "Abrir lista",
  sections: [
    {
      title: "Lanches",
      rows: [
        {
          id: "xburger",
          title: "X-Burger",
          description: "Pao, carne e queijo",
        },
        {
          id: "xbacon",
          title: "X-Bacon",
          description: "Com bacon crocante",
        },
      ],
    },
  ],
};

const sampleButtons = {
  text: "Escolha uma opcao",
  footer: "BerryProtocol",
  buttons: [
    { id: "reply_1", title: "Opcao 1" },
    { id: "reply_2", title: "Opcao 2" },
  ],
};

function printComparison(label, berryContent, baileysContent) {
  const berry = generateWAMessageFromContent(recipient, berryContent, { userJid });
  const baileys = generateWAMessageFromContent(recipient, baileysContent, { userJid });

  const berryJson = JSON.stringify(berry.message, null, 2);
  const baileysJson = JSON.stringify(baileys.message, null, 2);

  console.log(`\n=== ${label} ===`);
  console.log("\nBerry message:");
  console.log(berryJson);
  console.log("\nBaileys message:");
  console.log(baileysJson);
  console.log("\nEqual:", berryJson === baileysJson);
}

function main() {
  const berryInteractiveList = listToInteractiveMessageContent(sampleList);
  const berryLegacyList = listToLegacyListMessageContent(sampleList);
  const baileysInteractiveList = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
        },
        interactiveMessage: {
          header: {
            title: sampleList.title,
            hasMediaAttachment: false,
          },
          body: {
            text: sampleList.text,
          },
          footer: {
            text: sampleList.footer,
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: sampleList.buttonText,
                  sections: sampleList.sections,
                }),
              },
            ],
            messageParamsJson: "",
            messageVersion: 1,
          },
        },
      },
    },
  };
  const baileysLegacyList = {
    listMessage: {
      title: sampleList.title,
      description: sampleList.text,
      buttonText: sampleList.buttonText,
      footerText: sampleList.footer,
      sections: sampleList.sections.map((section) => ({
        title: section.title,
        rows: section.rows.map((row) => ({
          rowId: row.id,
          title: row.title,
          description: row.description ?? "",
        })),
      })),
    },
  };

  const berryTemplateButtons = buttonsPayloadToTemplateMessageContent(sampleButtons);
  const baileysTemplateButtons = {
    templateMessage: {
      hydratedTemplate: {
        hydratedContentText: sampleButtons.text,
        hydratedFooterText: sampleButtons.footer,
        hydratedButtons: [
          {
            index: 0,
            quickReplyButton: {
              displayText: "Opcao 1",
              id: "reply_1",
            },
          },
          {
            index: 1,
            quickReplyButton: {
              displayText: "Opcao 2",
              id: "reply_2",
            },
          },
        ],
      },
    },
  };
  const berryLegacyButtons = buttonsPayloadToLegacyButtonsMessageContent(sampleButtons);
  const baileysLegacyButtons = {
    buttonsMessage: {
      contentText: sampleButtons.text,
      footerText: sampleButtons.footer,
      buttons: [
        {
          buttonId: "reply_1",
          buttonText: {
            displayText: "Opcao 1",
          },
          type: "RESPONSE",
        },
        {
          buttonId: "reply_2",
          buttonText: {
            displayText: "Opcao 2",
          },
          type: "RESPONSE",
        },
      ],
      headerType: "EMPTY",
    },
  };

  const berryInteractive = interactivePayloadToMessageContent(listToInteractivePayload(sampleList));
  const baileysInteractive = baileysInteractiveList;

  printComparison("list legacy", berryLegacyList, baileysLegacyList);
  printComparison("list interactive", berryInteractiveList, baileysInteractiveList);
  printComparison("buttons legacy", berryLegacyButtons, baileysLegacyButtons);
  printComparison("buttons template", berryTemplateButtons, baileysTemplateButtons);
  printComparison("interactive", berryInteractive, baileysInteractive);
}

main();
