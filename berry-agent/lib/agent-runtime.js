import fs from "node:fs/promises";
import path from "node:path";
import { loadPrompt } from "./prompts.js";
import { searchKnowledgeBase } from "./retrieval.js";
import { wantsOnlineSearch, webSearch } from "./web-search.js";
import { sanitizeFileName, shortId, wantsCode, ensureDir } from "./utils.js";
import { sendButtons, sendFile, sendList, sendText } from "./sender.js";
import { detectUserLanguage, formatLanguageLabel } from "./language.js";

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function extractLeadSignals(text, leadState) {
  const emailMatch = String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const maybeName =
    !leadState.name && /^[a-zà-ÿ]{2,}(?:\s+[a-zà-ÿ]{2,}){0,2}$/i.test(String(text).trim())
      ? String(text).trim()
      : null;

  return {
    name: maybeName,
    email: emailMatch?.[0] ?? null,
  };
}

function actionFallbackText() {
  return {
    type: "text",
    text: "I had trouble deciding the best answer right now. Can you send that again in a more direct way?",
  };
}

export function createAgentRuntime({
  config,
  paths,
  memory,
  modelGateway,
  client,
}) {
  async function buildPromptContext(query, { withWebSearch = false, limit } = {}) {
    const db = await searchKnowledgeBase(
      paths,
      config,
      query,
      limit ?? config.behavior.maxRetrievedChunks,
    );

    const web = withWebSearch
      ? await webSearch(query)
      : { enabled: false, context: "" };

    return { db, web };
  }

  async function decideAction({ userId, text }) {
    const history = memory.getHistory(userId);
    const leadState = memory.getLeadState(userId);
    const context = await buildPromptContext(text, {
      withWebSearch: wantsOnlineSearch(text),
    });

    const leadSignals = extractLeadSignals(text, leadState);
    const detectedLanguage = detectUserLanguage(text, leadState.preferredLanguage || "pt-BR");
    memory.updateLeadState(userId, {
      ...leadSignals,
      preferredLanguage: detectedLanguage,
    });

    const systemPrompt = await loadPrompt(paths, "system", {
      companyName: config.company.name,
      assistantName: config.company.assistantName,
      maxEmojisPerMessage: config.style.maxEmojisPerMessage,
      brandEmojis: config.company.primaryEmojis.join(" "),
      messageCadence: config.style.messageCadence,
      companyTone: config.style.tone,
      styleExamples: (config.style.styleExamples || []).map((item) => `- ${item}`).join("\n"),
      userLanguage: formatLanguageLabel(detectedLanguage),
      sourcesList: context.db.sources.length
        ? context.db.sources.map((source) => `- ${source}`).join("\n")
        : "- No local sources retrieved.",
      databaseContext: context.db.context || "No relevant local knowledge found.",
      webContext: context.web.context || "No web context available.",
    });

    const actionPlannerPrompt = await loadPrompt(paths, "action-planner", {
      buttonsWhenOptionsUpTo: config.interactiveRules.buttonsWhenOptionsUpTo,
      listWhenOptionsAbove: config.interactiveRules.listWhenOptionsAbove,
    });

    const completion = await modelGateway.client.chat.completions.create({
      model: modelGateway.resolveModel("default"),
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: actionPlannerPrompt },
        ...history.slice(-config.behavior.historyWindow),
        {
          role: "user",
          content: text,
        },
      ],
    });

    return safeJsonParse(completion.choices?.[0]?.message?.content || "{}", actionFallbackText());
  }

  async function generateCodeFile({ userId, text, fileName }) {
    const history = memory.getHistory(userId);
    const leadState = memory.getLeadState(userId);
    const db = await searchKnowledgeBase(paths, config, text, 8);
    const prompt = await loadPrompt(paths, "code-generator", {
      databaseContext: db.context || "No relevant local knowledge found.",
    });

    const completion = await modelGateway.client.chat.completions.create({
      model: modelGateway.resolveModel("code"),
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        ...history.slice(-8),
        {
          role: "user",
          content: `Generate a practical BerryProtocol file for this request.\nPreferred response language: ${formatLanguageLabel(
            leadState.preferredLanguage || detectUserLanguage(text),
          )}\n\nRequest:\n${text}\n\nSuggested file name: ${fileName || "berry-example.js"}`,
        },
      ],
    });

    const parsed = safeJsonParse(completion.choices?.[0]?.message?.content || "{}", {
      fileName: `berry-example-${shortId()}.js`,
      language: "javascript",
      content: 'console.log("Could not generate code safely.");\n',
    });

    const finalName = sanitizeFileName(parsed.fileName || fileName || `berry-example-${shortId()}.js`);
    const safeFileName = finalName.includes(".") ? finalName : `${finalName}.js`;

    await ensureDir(paths.generatedDir);
    const filePath = path.join(paths.generatedDir, safeFileName);
    await fs.writeFile(filePath, parsed.content || "", "utf8");

    return {
      filePath,
      fileName: safeFileName,
      language: parsed.language || "javascript",
    };
  }

  async function answerWithContext({ userId, text, extraContext = "" }) {
    const history = memory.getHistory(userId);
    const leadState = memory.getLeadState(userId);
    const db = await searchKnowledgeBase(paths, config, text, config.behavior.maxRetrievedChunks);
    const prompt = await loadPrompt(paths, "answer", {
      databaseContext: db.context || "No relevant local knowledge found.",
      webContext: extraContext || "No web context available.",
      maxEmojisPerMessage: config.style.maxEmojisPerMessage,
      brandEmojis: config.company.primaryEmojis.join(" "),
      messageCadence: config.style.messageCadence,
      companyTone: config.style.tone,
    });

    const completion = await modelGateway.client.chat.completions.create({
      model: modelGateway.resolveModel("default"),
      temperature: 0.3,
      messages: [
        { role: "system", content: prompt },
        ...history.slice(-config.behavior.historyWindow),
        {
          role: "user",
          content: `Preferred reply language: ${formatLanguageLabel(
            leadState.preferredLanguage || detectUserLanguage(text),
          )}\n\nUser message:\n${text}`,
        },
      ],
    });

    return completion.choices?.[0]?.message?.content?.trim() || "I could not answer right now. Please try again.";
  }

  async function executeAction(to, action, originalText) {
    if (!action?.type) {
      await sendText(client, to, actionFallbackText().text);
      return;
    }

    if (action.type === "text") {
      await sendText(client, to, action.text || actionFallbackText().text);
      return;
    }

    if (action.type === "buttons") {
      await sendButtons(client, to, action);
      return;
    }

    if (action.type === "list") {
      await sendList(client, to, action);
      return;
    }

    if (action.type === "code_file") {
      await sendText(
        client,
        to,
        action.text || "I will generate a code file for you now.",
      );

      const generated = await generateCodeFile({
        userId: to,
        text: action.codePrompt || originalText,
        fileName: action.fileName,
      });

      const sent = await sendFile(client, to, generated.filePath, generated.fileName);

      if (sent) {
        await sendText(
          client,
          to,
          `Done. I sent the file *${generated.fileName}*. If you want, I can also generate a TypeScript version or add more comments.`,
        );
        return;
      }

      const content = await fs.readFile(generated.filePath, "utf8");
      await sendText(
        client,
        to,
        `I generated *${generated.fileName}*, but I could not attach it through the current method.\n\n\`\`\`js\n${content.slice(0, 3000)}\n\`\`\``,
      );
      return;
    }

    if (action.type === "web_search") {
      await sendText(client, to, action.text || "I will check that online quickly.");
      const web = await webSearch(action.query || originalText);
      const answer = await answerWithContext({
        userId: to,
        text: originalText,
        extraContext: web.context,
      });
      await sendText(client, to, answer);
      return;
    }

    await sendText(client, to, action.text || actionFallbackText().text);
  }

  async function handleInbound({ userId, chatId, text }) {
    const history = memory.getHistory(userId);
    const leadState = memory.getLeadState(userId);
    const detectedLanguage = detectUserLanguage(text, leadState.preferredLanguage || "pt-BR");
    memory.updateLeadState(userId, {
      preferredLanguage: detectedLanguage,
    });
    memory.append(userId, "user", text);

    const action = wantsCode(text)
      ? {
          type: "code_file",
          text: "I will generate a practical code file for you.",
          fileName: `berry-${shortId()}.js`,
          codePrompt: text,
        }
      : await decideAction({ userId, text });

    await executeAction(chatId, action, text);

    history.push({
      role: "assistant",
      content: JSON.stringify(action),
    });
    memory.trim(userId, config.behavior.historyWindow * 2);
  }

  return {
    handleInbound,
    decideAction,
    generateCodeFile,
    answerWithContext,
  };
}
