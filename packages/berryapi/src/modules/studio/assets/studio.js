const state = {
  apiKey: localStorage.getItem("berry_studio_api_key") || "berryapi_dev_key",
  capabilities: null,
  flows: [],
  currentFlow: null,
  selectedNodeId: null,
  simulatorState: null,
};

const elements = {
  apiKey: document.getElementById("api-key"),
  connectButton: document.getElementById("connect-button"),
  loadButton: document.getElementById("load-button"),
  flowList: document.getElementById("flow-list"),
  nodePalette: document.getElementById("node-palette"),
  newFlowButton: document.getElementById("new-flow-button"),
  flowTitle: document.getElementById("flow-title"),
  canvas: document.getElementById("canvas"),
  edgeLayer: document.getElementById("edge-layer"),
  inspector: document.getElementById("inspector"),
  selectedNodeLabel: document.getElementById("selected-node-label"),
  previewChat: document.getElementById("preview-chat"),
  simulatorChat: document.getElementById("simulator-chat"),
  simulatorInput: document.getElementById("simulator-input"),
  sendSimulatorInput: document.getElementById("send-simulator-input"),
  variablesView: document.getElementById("variables-view"),
  logsView: document.getElementById("logs-view"),
  saveFlowButton: document.getElementById("save-flow-button"),
  publishFlowButton: document.getElementById("publish-flow-button"),
  simulateButton: document.getElementById("simulate-button"),
  autoLayoutButton: document.getElementById("auto-layout-button"),
};

const makeHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${state.apiKey}`,
});

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${state.apiKey}`,
      ...(options.headers || {}),
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Berry Studio request failed.");
  }

  return json.data;
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

const getSelectedNode = () =>
  state.currentFlow?.graph.nodes.find((node) => node.id === state.selectedNodeId) || null;

const getOutgoingEdges = (nodeId) =>
  state.currentFlow.graph.edges.filter((edge) => edge.source === nodeId);

const getNodeById = (nodeId) =>
  state.currentFlow.graph.nodes.find((node) => node.id === nodeId) || null;

const saveApiKey = () => {
  state.apiKey = elements.apiKey.value.trim() || "berryapi_dev_key";
  localStorage.setItem("berry_studio_api_key", state.apiKey);
};

const renderFlowList = () => {
  elements.flowList.innerHTML = "";

  state.flows.forEach((flow) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `flow-item ${state.currentFlow?.id === flow.id ? "active" : ""}`;
    item.innerHTML = `
      <strong>${flow.name}</strong>
      <span>${flow.status}</span>
      <small>${new Date(flow.updated_at).toLocaleString()}</small>
    `;
    item.addEventListener("click", () => loadFlow(flow.id));
    elements.flowList.appendChild(item);
  });
};

const renderNodePalette = () => {
  elements.nodePalette.innerHTML = "";
  const nodeTypes = state.capabilities?.nodeTypes || [];

  nodeTypes.forEach((nodeType) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-item";
    button.draggable = true;
    button.dataset.nodeType = nodeType.id;
    button.innerHTML = `
      <strong>${nodeType.label}</strong>
      <span>${nodeType.description}</span>
    `;
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/node-type", nodeType.id);
    });
    button.addEventListener("click", () => addNode(nodeType.id));
    elements.nodePalette.appendChild(button);
  });
};

const renderCanvas = () => {
  elements.canvas.querySelectorAll(".flow-node").forEach((node) => node.remove());
  if (!state.currentFlow) {
    elements.flowTitle.textContent = "No flow selected";
    elements.edgeLayer.innerHTML = "";
    return;
  }

  elements.flowTitle.textContent = state.currentFlow.name;

  state.currentFlow.graph.nodes.forEach((node) => {
    const nodeElement = document.createElement("article");
    nodeElement.className = `flow-node ${state.selectedNodeId === node.id ? "selected" : ""}`;
    nodeElement.style.left = `${node.position.x}px`;
    nodeElement.style.top = `${node.position.y}px`;
    nodeElement.dataset.nodeId = node.id;

    const summary = getNodeSummary(node);
    nodeElement.innerHTML = `
      <div class="node-type">${node.type}</div>
      <h3 class="node-title">${node.data.label || node.type}</h3>
      <div class="node-summary">${summary}</div>
    `;

    nodeElement.addEventListener("click", () => {
      state.selectedNodeId = node.id;
      renderAll();
    });

    enableNodeDrag(nodeElement, node.id);
    elements.canvas.appendChild(nodeElement);
  });

  renderEdges();
};

const renderEdges = () => {
  elements.edgeLayer.innerHTML = "";
  if (!state.currentFlow) {
    return;
  }

  state.currentFlow.graph.edges.forEach((edge) => {
    const source = getNodeById(edge.source);
    const target = getNodeById(edge.target);
    if (!source || !target) {
      return;
    }

    const sourceX = source.position.x + 220;
    const sourceY = source.position.y + 56;
    const targetX = target.position.x;
    const targetY = target.position.y + 56;
    const curve = Math.max(60, Math.abs(targetX - sourceX) / 2);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${sourceX} ${sourceY} C ${sourceX + curve} ${sourceY}, ${targetX - curve} ${targetY}, ${targetX} ${targetY}`,
    );
    path.setAttribute("class", "edge-path");
    elements.edgeLayer.appendChild(path);
  });
};

const getNodeSummary = (node) => {
  if (node.type === "message" || node.type === "action") {
    const capability = state.capabilities.messageCapabilities.find((item) => item.id === node.data.messageType);
    return capability ? capability.label : "Configure payload";
  }

  if (node.type === "input") {
    return `Stores in ${node.data.variableName || "lastInput"}`;
  }

  if (node.type === "condition") {
    return `${node.data.variable || "lastInput"} ${node.data.operator || "equals"} ${node.data.value || ""}`;
  }

  if (node.type === "setVariable") {
    return `${node.data.key || "variable"} = ${node.data.value || ""}`;
  }

  if (node.type === "delay") {
    return `${node.data.delayMs || 1000} ms`;
  }

  return node.data.label || "Ready";
};

const renderInspector = () => {
  const node = getSelectedNode();
  if (!node) {
    elements.selectedNodeLabel.textContent = "Select a node";
    elements.inspector.className = "inspector empty-state";
    elements.inspector.textContent = "Select a node to edit its behavior.";
    return;
  }

  elements.selectedNodeLabel.textContent = `${node.type} • ${node.id}`;
  elements.inspector.className = "inspector";
  elements.inspector.innerHTML = "";

  const labelField = createField({
    key: "label",
    label: "Node label",
    type: "text",
  }, node.data.label || node.type, (value) => {
    node.data.label = value;
    renderCanvas();
  });
  elements.inspector.appendChild(labelField);

  if (node.type === "message" || node.type === "action") {
    renderMessageInspector(node);
  } else if (node.type === "input") {
    renderInputInspector(node);
  } else if (node.type === "condition") {
    renderConditionInspector(node);
  } else if (node.type === "setVariable") {
    renderSetVariableInspector(node);
  } else if (node.type === "delay") {
    renderDelayInspector(node);
  }

  renderEdgeControls(node);
};

const renderMessageInspector = (node) => {
  if (!node.data.messageType) {
    node.data.messageType = node.type === "action" ? "sendReply" : "sendText";
  }
  if (!node.data.payload) {
    node.data.payload = {};
  }

  const options = state.capabilities.messageCapabilities.map((capability) => ({
    label: capability.label,
    value: capability.id,
  }));

  const typeField = createField({
    key: "messageType",
    label: "Berry method",
    type: "select",
    options,
  }, node.data.messageType, (value) => {
    node.data.messageType = value;
    node.data.payload = {};
    renderAll();
  });

  elements.inspector.appendChild(typeField);

  const capability = state.capabilities.messageCapabilities.find((item) => item.id === node.data.messageType);
  if (!capability) {
    return;
  }

  capability.fields.forEach((field) => {
    const value = node.data.payload[field.key] ?? field.defaultValue ?? "";
    const fieldElement = createField(field, value, (nextValue) => {
      node.data.payload[field.key] = nextValue;
      renderPreview();
      renderCanvas();
    });
    elements.inspector.appendChild(fieldElement);
  });
};

const renderInputInspector = (node) => {
  const fields = [
    { key: "prompt", label: "Prompt", type: "textarea" },
    { key: "variableName", label: "Variable name", type: "text" },
  ];

  fields.forEach((field) => {
    elements.inspector.appendChild(createField(field, node.data[field.key] || "", (value) => {
      node.data[field.key] = value;
      renderCanvas();
    }));
  });
};

const renderConditionInspector = (node) => {
  const fields = [
    { key: "variable", label: "Variable", type: "text" },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      options: state.capabilities.conditionOperators,
    },
    { key: "value", label: "Expected value", type: "text" },
  ];

  fields.forEach((field) => {
    const value = node.data[field.key] || (field.key === "operator" ? "equals" : "");
    elements.inspector.appendChild(createField(field, value, (nextValue) => {
      node.data[field.key] = nextValue;
      renderCanvas();
    }));
  });
};

const renderSetVariableInspector = (node) => {
  const fields = [
    { key: "key", label: "Variable key", type: "text" },
    { key: "value", label: "Value / template", type: "textarea" },
  ];

  fields.forEach((field) => {
    elements.inspector.appendChild(createField(field, node.data[field.key] || "", (nextValue) => {
      node.data[field.key] = nextValue;
      renderCanvas();
    }));
  });
};

const renderDelayInspector = (node) => {
  elements.inspector.appendChild(createField({
    key: "delayMs",
    label: "Delay (ms)",
    type: "number",
  }, node.data.delayMs || 1000, (value) => {
    node.data.delayMs = Number(value || 0);
    renderCanvas();
  }));
};

const renderEdgeControls = (node) => {
  const edgeBox = document.createElement("div");
  edgeBox.className = "node-link-row";

  const targets = [
    { label: "No connection", value: "" },
    ...state.currentFlow.graph.nodes
      .filter((candidate) => candidate.id !== node.id)
      .map((candidate) => ({
        label: `${candidate.data.label || candidate.type} (${candidate.id})`,
        value: candidate.id,
      })),
  ];

  if (node.type === "condition") {
    ["true", "false"].forEach((handle) => {
      edgeBox.appendChild(createField({
        key: handle,
        label: `Branch ${handle}`,
        type: "select",
        options: targets,
      }, getEdgeTarget(node.id, handle), (value) => {
        upsertEdge(node.id, value, handle);
      }));
    });
  } else if (node.type !== "end") {
    edgeBox.appendChild(createField({
      key: "next",
      label: "Next node",
      type: "select",
      options: targets,
    }, getEdgeTarget(node.id), (value) => {
      upsertEdge(node.id, value);
    }));
  }

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button-secondary";
  deleteButton.textContent = "Delete node";
  deleteButton.addEventListener("click", () => deleteNode(node.id));
  edgeBox.appendChild(deleteButton);

  elements.inspector.appendChild(edgeBox);
};

const createField = (field, value, onChange) => {
  const wrapper = document.createElement("label");
  wrapper.className = field.type === "checkbox" ? "checkbox-row" : "field";

  const label = document.createElement("span");
  label.textContent = field.label;
  wrapper.appendChild(label);

  let input;

  if (field.type === "textarea" || field.type === "json") {
    input = document.createElement("textarea");
    input.value = field.type === "json"
      ? (typeof value === "string" ? value : JSON.stringify(value || {}, null, 2))
      : value || "";
  } else if (field.type === "select") {
    input = document.createElement("select");
    (field.options || []).forEach((option) => {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = option.label;
      input.appendChild(element);
    });
    input.value = value || "";
  } else {
    input = document.createElement("input");
    input.type = field.type === "number" ? "number" : field.type === "checkbox" ? "checkbox" : "text";
    if (field.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = value ?? "";
    }
  }

  if (field.placeholder) {
    input.placeholder = field.placeholder;
  }

  const handler = () => {
    let nextValue;
    if (field.type === "checkbox") {
      nextValue = input.checked;
    } else if (field.type === "number") {
      nextValue = input.value === "" ? "" : Number(input.value);
    } else if (field.type === "json") {
      nextValue = input.value;
    } else {
      nextValue = input.value;
    }
    onChange(nextValue);
  };

  input.addEventListener("change", handler);
  input.addEventListener("input", handler);
  wrapper.appendChild(input);

  if (field.description) {
    const hint = document.createElement("small");
    hint.className = "hint";
    hint.textContent = field.description;
    wrapper.appendChild(hint);
  }

  return wrapper;
};

const renderPreview = () => {
  elements.previewChat.innerHTML = "";
  const node = getSelectedNode();

  if (!node || !["message", "action", "input", "condition", "setVariable", "delay", "start", "end"].includes(node.type)) {
    elements.previewChat.innerHTML = `<div class="empty-state">Select a node to preview how it behaves in chat.</div>`;
    return;
  }

  const sampleItems = buildPreviewItems(node);
  sampleItems.forEach((item) => {
    elements.previewChat.appendChild(renderChatBubble(item, "wa-message"));
  });
};

const buildPreviewItems = (node) => {
  if (node.type === "message" || node.type === "action") {
    return [{
      role: "assistant",
      type: node.data.messageType || "sendText",
      previewKind: state.capabilities.messageCapabilities.find((item) => item.id === node.data.messageType)?.previewKind || "text",
      payload: normalizePayload(node.data.payload || {}),
    }];
  }

  if (node.type === "input") {
    return [
      { role: "assistant", type: "input_prompt", previewKind: "text", payload: { text: node.data.prompt || "What should we ask?" } },
      { role: "user", type: "text", previewKind: "text", payload: { text: `{{${node.data.variableName || "answer"}}}` } },
    ];
  }

  if (node.type === "condition") {
    return [{ role: "assistant", type: "condition", previewKind: "event", payload: { text: `${node.data.variable || "lastInput"} ${node.data.operator || "equals"} ${node.data.value || ""}` } }];
  }

  if (node.type === "setVariable") {
    return [{ role: "assistant", type: "setVariable", previewKind: "event", payload: { text: `${node.data.key || "variable"} = ${node.data.value || ""}` } }];
  }

  if (node.type === "delay") {
    return [{ role: "assistant", type: "delay", previewKind: "event", payload: { text: `Delay ${node.data.delayMs || 1000} ms` } }];
  }

  return [{ role: "assistant", type: node.type, previewKind: "event", payload: { text: node.type } }];
};

const normalizePayload = (payload) => {
  const output = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (typeof value !== "string") {
      output[key] = value;
      return;
    }

    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        output[key] = JSON.parse(trimmed);
        return;
      } catch {}
    }
    output[key] = value;
  });
  return output;
};

const renderChatBubble = (item, className) => {
  const bubble = document.createElement("div");
  bubble.className = `${className} ${item.role === "user" ? "user" : "assistant"}`;

  const payload = item.payload || {};
  const previewKind = item.previewKind || "text";

  if (previewKind === "text" || previewKind === "status") {
    bubble.innerHTML = `<div>${payload.text || payload.title || "Text message"}</div>`;
  } else if (previewKind === "reply") {
    bubble.innerHTML = `
      <div class="wa-chip">Reply</div>
      <div>${payload.text || "Reply message"}</div>
    `;
  } else if (previewKind === "image" || previewKind === "video") {
    bubble.innerHTML = `
      <div class="wa-media">${previewKind === "image" ? "Image" : "Video"}</div>
      <div>${payload.caption || payload.text || "Media caption"}</div>
    `;
  } else if (previewKind === "audio") {
    bubble.innerHTML = `
      <div class="wa-chip">Audio</div>
      <div>${payload.fileName || payload.url || "Voice note / audio file"}</div>
    `;
  } else if (previewKind === "document") {
    bubble.innerHTML = `
      <div class="wa-chip">Document</div>
      <div>${payload.fileName || "Document attachment"}</div>
      <div>${payload.caption || ""}</div>
    `;
  } else if (previewKind === "sticker") {
    bubble.innerHTML = `<div class="wa-media">Sticker</div>`;
  } else if (previewKind === "buttons") {
    const buttons = Array.isArray(payload.buttons)
      ? payload.buttons
      : payload.copyCode
        ? [{ title: payload.buttonText || "Copy", type: "cta_copy" }]
        : [];
    bubble.innerHTML = `
      <div>${payload.text || "Button message"}</div>
      <div class="wa-buttons">
        ${buttons.map((button) => `<div class="wa-button">${button.title || button.id || "Button"}</div>`).join("")}
      </div>
      <div class="wa-meta">${payload.footer || "Berry Studio"}</div>
    `;
  } else if (previewKind === "list") {
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    bubble.innerHTML = `
      <div>${payload.text || "List message"}</div>
      <div class="wa-button">${payload.buttonText || "Open options"}</div>
      <div class="wa-list">
        ${sections.flatMap((section) => (section.rows || []).map((row) => `<div class="wa-list-row"><strong>${row.title}</strong><div>${row.description || ""}</div></div>`)).join("")}
      </div>
    `;
  } else if (previewKind === "carousel") {
    const cards = Array.isArray(payload.cards) ? payload.cards : [];
    bubble.innerHTML = `
      <div>${payload.text || "Carousel"}</div>
      <div class="wa-carousel">
        ${cards.map((card) => `
          <div class="wa-card">
            <div class="wa-card-cover">${card.image ? "Image card" : "Video card"}</div>
            <h4>${card.title || "Card title"}</h4>
            <p>${card.body || ""}</p>
          </div>
        `).join("")}
      </div>
    `;
  } else if (previewKind === "poll") {
    const options = Array.isArray(payload.options) ? payload.options : payload.values || [];
    bubble.innerHTML = `
      <div>${payload.title || payload.name || "Poll"}</div>
      <div class="wa-options">
        ${options.map((option) => `<div class="wa-option">${typeof option === "string" ? option : option.title}</div>`).join("")}
      </div>
    `;
  } else if (previewKind === "location") {
    bubble.innerHTML = `
      <div class="wa-media">Location</div>
      <div>${payload.name || "Pinned location"}</div>
      <div>${payload.address || `${payload.latitude || ""}, ${payload.longitude || ""}`}</div>
    `;
  } else if (previewKind === "contacts") {
    const contacts = Array.isArray(payload.contacts) ? payload.contacts : payload.vcard ? [{ displayName: payload.displayName }] : [];
    bubble.innerHTML = `
      <div class="wa-chip">Contacts</div>
      <div class="wa-options">
        ${contacts.map((contact) => `<div class="wa-option">${contact.displayName || "Contact"}</div>`).join("")}
      </div>
    `;
  } else if (previewKind === "product") {
    bubble.innerHTML = `
      <div class="wa-card">
        <div class="wa-card-cover">Product</div>
        <h4>${payload.title || "Product title"}</h4>
        <p>${payload.description || ""}</p>
        <strong>${payload.price || ""}</strong>
      </div>
    `;
  } else if (previewKind === "catalog") {
    bubble.innerHTML = `
      <div class="wa-card">
        <div class="wa-card-cover">Catalog</div>
        <h4>${payload.title || "Catalog title"}</h4>
        <p>${payload.collectionId || payload.businessOwnerJid || ""}</p>
      </div>
    `;
  } else if (previewKind === "reaction") {
    bubble.innerHTML = `<div class="wa-chip">${payload.emoji || "👍"} reaction</div>`;
  } else {
    bubble.innerHTML = `<div class="wa-chip">${item.type}</div><div>${payload.text || JSON.stringify(payload)}</div>`;
  }

  const meta = document.createElement("div");
  meta.className = className === "sim-message" ? "sim-meta" : "wa-meta";
  meta.textContent = "12:34";
  bubble.appendChild(meta);
  return bubble;
};

const renderSimulator = () => {
  const transcript = state.simulatorState?.transcript || [];
  if (!transcript.length) {
    elements.simulatorChat.className = "simulator-chat empty-state";
    elements.simulatorChat.textContent = "Run the simulation to see the transcript here.";
  } else {
    elements.simulatorChat.className = "simulator-chat";
    elements.simulatorChat.innerHTML = "";
    transcript.forEach((item) => {
      const bubble = renderChatBubble(item.role ? item : { role: "assistant", previewKind: "event", payload: item }, "sim-message");
      elements.simulatorChat.appendChild(bubble);
    });
  }

  elements.variablesView.textContent = JSON.stringify(state.simulatorState?.variables || {}, null, 2);
  elements.logsView.textContent = JSON.stringify(state.simulatorState?.logs || [], null, 2);
};

const renderAll = () => {
  renderFlowList();
  renderNodePalette();
  renderCanvas();
  renderInspector();
  renderPreview();
  renderSimulator();
};

const addNode = (type, position = null) => {
  if (!state.currentFlow) {
    return;
  }

  const node = {
    id: uid(type),
    type,
    position: position || {
      x: 180 + state.currentFlow.graph.nodes.length * 24,
      y: 120 + state.currentFlow.graph.nodes.length * 24,
    },
    data: {
      label: type === "message" ? "Message node" : type === "action" ? "Action node" : type.charAt(0).toUpperCase() + type.slice(1),
    },
  };

  if (type === "message") {
    node.data.messageType = "sendText";
    node.data.payload = { text: "Hello from Berry Studio" };
  }

  if (type === "action") {
    node.data.messageType = "sendReply";
    node.data.payload = { text: "Reply from Berry Studio", quoted: "{\"remoteJid\":\"5511999999999@s.whatsapp.net\",\"id\":\"MSG_ID\"}" };
  }

  if (type === "input") {
    node.data.prompt = "How can we help you today?";
    node.data.variableName = "reply";
  }

  if (type === "condition") {
    node.data.variable = "reply";
    node.data.operator = "equals";
    node.data.value = "sales";
  }

  if (type === "setVariable") {
    node.data.key = "segment";
    node.data.value = "vip";
  }

  if (type === "delay") {
    node.data.delayMs = 1000;
  }

  state.currentFlow.graph.nodes.push(node);
  state.selectedNodeId = node.id;
  renderAll();
};

const deleteNode = (nodeId) => {
  if (!state.currentFlow) {
    return;
  }

  state.currentFlow.graph.nodes = state.currentFlow.graph.nodes.filter((node) => node.id !== nodeId);
  state.currentFlow.graph.edges = state.currentFlow.graph.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
  state.selectedNodeId = state.currentFlow.graph.nodes[0]?.id || null;
  renderAll();
};

const getEdgeTarget = (source, handle = undefined) =>
  state.currentFlow.graph.edges.find((edge) => edge.source === source && edge.sourceHandle === handle)?.target || "";

const upsertEdge = (source, target, sourceHandle = undefined) => {
  state.currentFlow.graph.edges = state.currentFlow.graph.edges.filter((edge) => !(edge.source === source && edge.sourceHandle === sourceHandle));
  if (target) {
    state.currentFlow.graph.edges.push({
      id: uid("edge"),
      source,
      target,
      sourceHandle,
    });
  }
  renderAll();
};

const enableNodeDrag = (nodeElement, nodeId) => {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  nodeElement.addEventListener("pointerdown", (event) => {
    dragging = true;
    const node = getNodeById(nodeId);
    offsetX = event.clientX - node.position.x;
    offsetY = event.clientY - node.position.y;
    nodeElement.setPointerCapture(event.pointerId);
  });

  nodeElement.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const node = getNodeById(nodeId);
    node.position.x = Math.max(24, event.clientX - offsetX);
    node.position.y = Math.max(24, event.clientY - offsetY - 90);
    renderCanvas();
  });

  nodeElement.addEventListener("pointerup", (event) => {
    dragging = false;
    nodeElement.releasePointerCapture(event.pointerId);
  });
};

const autoLayout = () => {
  if (!state.currentFlow) {
    return;
  }

  state.currentFlow.graph.nodes.forEach((node, index) => {
    node.position.x = 120 + (index % 3) * 280;
    node.position.y = 120 + Math.floor(index / 3) * 180;
  });
  renderAll();
};

const loadCapabilities = async () => {
  state.capabilities = await api("/studio/api/capabilities");
};

const loadFlows = async () => {
  state.flows = await api("/studio/api/flows");
  renderFlowList();
};

const loadFlow = async (flowId) => {
  state.currentFlow = await api(`/studio/api/flows/${flowId}`);
  state.selectedNodeId = state.currentFlow.graph.nodes[0]?.id || null;
  state.simulatorState = null;
  renderAll();
};

const createFlow = async () => {
  const name = window.prompt("Flow name", `Berry Flow ${state.flows.length + 1}`);
  if (!name) {
    return;
  }

  const flow = await api("/studio/api/flows", {
    method: "POST",
    body: JSON.stringify({
      name,
      graph: deepClone(state.capabilities.defaultGraph),
    }),
  });

  await loadFlows();
  state.currentFlow = flow;
  state.selectedNodeId = flow.graph.nodes[0]?.id || null;
  renderAll();
};

const saveCurrentFlow = async () => {
  if (!state.currentFlow) {
    return;
  }

  state.currentFlow = await api(`/studio/api/flows/${state.currentFlow.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: state.currentFlow.name,
      status: state.currentFlow.status,
      graph: state.currentFlow.graph,
    }),
  });
  await loadFlows();
  renderAll();
};

const publishCurrentFlow = async () => {
  if (!state.currentFlow) {
    return;
  }

  state.currentFlow = await api(`/studio/api/flows/${state.currentFlow.id}/publish`, {
    method: "POST",
  });
  await loadFlows();
  renderAll();
};

const startSimulation = async () => {
  if (!state.currentFlow) {
    return;
  }

  state.simulatorState = await api("/studio/api/simulate/start", {
    method: "POST",
    body: JSON.stringify({
      flow: state.currentFlow.graph,
      contact: {
        jid: "5511999999999@s.whatsapp.net",
        name: "Berry Demo",
      },
    }),
  });
  renderSimulator();
};

const continueSimulation = async () => {
  if (!state.currentFlow || !state.simulatorState) {
    return;
  }

  const inputText = elements.simulatorInput.value.trim();
  if (!inputText) {
    return;
  }

  state.simulatorState = await api("/studio/api/simulate/continue", {
    method: "POST",
    body: JSON.stringify({
      flow: state.currentFlow.graph,
      state: state.simulatorState,
      inputText,
    }),
  });

  elements.simulatorInput.value = "";
  renderSimulator();
};

const bindEvents = () => {
  elements.apiKey.value = state.apiKey;
  elements.connectButton.addEventListener("click", async () => {
    try {
      saveApiKey();
      await boot();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.loadButton.addEventListener("click", async () => {
    try {
      saveApiKey();
      await loadFlows();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.newFlowButton.addEventListener("click", async () => {
    try {
      await createFlow();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.saveFlowButton.addEventListener("click", async () => {
    try {
      await saveCurrentFlow();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.publishFlowButton.addEventListener("click", async () => {
    try {
      await publishCurrentFlow();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.simulateButton.addEventListener("click", async () => {
    try {
      await startSimulation();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.sendSimulatorInput.addEventListener("click", async () => {
    try {
      await continueSimulation();
    } catch (error) {
      alert(error.message);
    }
  });

  elements.simulatorInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      try {
        await continueSimulation();
      } catch (error) {
        alert(error.message);
      }
    }
  });

  elements.autoLayoutButton.addEventListener("click", autoLayout);

  elements.canvas.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  elements.canvas.addEventListener("drop", (event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData("text/node-type");
    if (!nodeType) {
      return;
    }

    const rect = elements.canvas.getBoundingClientRect();
    addNode(nodeType, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  });
};

const boot = async () => {
  await loadCapabilities();
  await loadFlows();
  if (!state.currentFlow && state.flows[0]?.id) {
    await loadFlow(state.flows[0].id);
  } else {
    renderAll();
  }
};

bindEvents();
boot().catch((error) => {
  elements.flowList.innerHTML = `<div class="empty-state">${error.message}</div>`;
});
