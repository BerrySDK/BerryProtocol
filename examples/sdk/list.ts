import { BerryClient } from "@berrysdk/core";

async function main(): Promise<void> {
  const client = new BerryClient({
    sessionId: "store-001",
  });

  await client.connect();

  await client.sendList("5516999999999@s.whatsapp.net", {
    title: "Cardápio",
    text: "Escolha uma opção",
    buttonText: "Ver opções",
    sections: [
      {
        title: "Lanches",
        rows: [
          {
            id: "xburger",
            title: "X-Burger",
            description: "Pão, carne e queijo",
          },
        ],
      },
    ],
  });
}

void main();
