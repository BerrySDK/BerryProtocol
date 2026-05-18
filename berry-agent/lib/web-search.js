function cleanHtmlText(text) {
  return String(text)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function wantsOnlineSearch(text) {
  return /\b(web|internet|online|latest|current|updated|documentation|docs|search online|search the web|web search|documentacao atual|busca online|buscar na web|ultima versao|versao atual)\b/i.test(
    text,
  );
}

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey === "sua_key_tavily") {
    return null;
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 5,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const json = await response.json();
  const results = (json.results || []).map((result, index) => {
    return `# Online result ${index + 1}\nTitle: ${result.title}\nURL: ${result.url}\nSnippet: ${result.content}`;
  });

  return {
    enabled: true,
    provider: "tavily",
    context: results.join("\n\n"),
  };
}

async function duckDuckGoSearch(query) {
  const url = "https://duckduckgo.com/html/?q=" + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed with status ${response.status}`);
  }

  const html = await response.text();
  const matches = [
    ...html.matchAll(/<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>/g),
  ];

  const results = matches.slice(0, 5).map((match, index) => {
    let link = match[1];
    if (link.includes("uddg=")) {
      link = decodeURIComponent(link.split("uddg=")[1].split("&")[0]);
    }

    return `# Online result ${index + 1}\nTitle: ${cleanHtmlText(match[2])}\nURL: ${link}`;
  });

  return {
    enabled: true,
    provider: "duckduckgo",
    context: results.length ? results.join("\n\n") : "No online results found.",
  };
}

export async function webSearch(query) {
  try {
    const tavily = await tavilySearch(query);
    if (tavily) {
      return tavily;
    }
  } catch (error) {
    return {
      enabled: true,
      provider: "tavily",
      context: `Online search error: ${error.message}`,
    };
  }

  try {
    return await duckDuckGoSearch(query);
  } catch (error) {
    return {
      enabled: true,
      provider: "duckduckgo",
      context: `Online search error: ${error.message}`,
    };
  }
}
