export function createConversationMemory() {
  const historyByUser = new Map();
  const leadStateByUser = new Map();

  function getHistory(userId) {
    if (!historyByUser.has(userId)) {
      historyByUser.set(userId, []);
    }

    return historyByUser.get(userId);
  }

  function append(userId, role, content) {
    const history = getHistory(userId);
    history.push({ role, content });
    return history;
  }

  function trim(userId, maxItems) {
    const history = getHistory(userId);
    if (history.length > maxItems) {
      history.splice(0, history.length - maxItems);
    }
  }

  function getLeadState(userId) {
    if (!leadStateByUser.has(userId)) {
      leadStateByUser.set(userId, {
        name: null,
        email: null,
        goal: null,
        preferredLanguage: null,
      });
    }

    return leadStateByUser.get(userId);
  }

  function updateLeadState(userId, patch) {
    const current = getLeadState(userId);
    const next = { ...current, ...patch };
    leadStateByUser.set(userId, next);
    return next;
  }

  return {
    getHistory,
    append,
    trim,
    getLeadState,
    updateLeadState,
  };
}
