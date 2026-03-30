"use strict";
(() => {
  // src/code.ts
  var LOCAL_STORAGE_KEY = "local-classes";
  function serializePaint(paint) {
    var _a;
    let def;
    if (paint.type === "SOLID") {
      const p2 = paint;
      def = { type: "SOLID", color: { r: p2.color.r, g: p2.color.g, b: p2.color.b }, opacity: (_a = p2.opacity) != null ? _a : 1 };
    } else if (paint.type === "GRADIENT_LINEAR" || paint.type === "GRADIENT_RADIAL" || paint.type === "GRADIENT_ANGULAR" || paint.type === "GRADIENT_DIAMOND") {
      const p2 = paint;
      def = {
        type: paint.type,
        gradientStops: p2.gradientStops.map((s) => ({
          position: s.position,
          color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a }
        }))
      };
    } else {
      def = { type: paint.type };
    }
    const p = paint;
    if (p.boundVariables && Object.keys(p.boundVariables).length > 0) {
      def.boundVariables = JSON.parse(JSON.stringify(p.boundVariables));
    }
    return def;
  }
  function serializeEffect(effect) {
    var _a;
    if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
      const e = effect;
      const def = {
        type: effect.type,
        color: { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a },
        offset: { x: e.offset.x, y: e.offset.y },
        radius: e.radius,
        spread: (_a = e.spread) != null ? _a : 0,
        blendMode: e.blendMode,
        visible: e.visible
      };
      if (e.boundVariables && Object.keys(e.boundVariables).length > 0) {
        def.boundVariables = JSON.parse(JSON.stringify(e.boundVariables));
      }
      return def;
    }
    return null;
  }
  function safeCornerRadius(node) {
    return typeof node.cornerRadius === "symbol" ? -1 : node.cornerRadius || 0;
  }
  function safeStrokeWeight(node) {
    return typeof node.strokeWeight === "symbol" ? 1 : node.strokeWeight || 0;
  }
  function safeFills(node) {
    return typeof node.fills === "symbol" ? [] : node.fills.map(serializePaint);
  }
  function safeStrokes(node) {
    return typeof node.strokes === "symbol" ? [] : node.strokes.map(serializePaint);
  }
  function serializeNode(node) {
    const base = {
      type: node.type,
      name: node.name,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: "rotation" in node ? node.rotation : 0,
      opacity: "opacity" in node ? node.opacity : 1,
      blendMode: "blendMode" in node ? node.blendMode : "NORMAL",
      visible: node.visible,
      layoutAlign: "layoutAlign" in node ? node.layoutAlign : "INHERIT",
      layoutGrow: "layoutGrow" in node ? node.layoutGrow : 0,
      layoutPositioning: "layoutPositioning" in node ? node.layoutPositioning : "AUTO"
    };
    if ("boundVariables" in node && node.boundVariables) {
      const bv = node.boundVariables;
      if (Object.keys(bv).length > 0) {
        base.boundVariables = JSON.parse(JSON.stringify(bv));
      }
    }
    if ("fills" in node) {
      base.fills = safeFills(node);
      base.strokes = safeStrokes(node);
      base.strokeWeight = safeStrokeWeight(node);
      base.strokeAlign = node.strokeAlign;
      if ("strokeTopWeight" in node) base.strokeTopWeight = node.strokeTopWeight;
      if ("strokeRightWeight" in node) base.strokeRightWeight = node.strokeRightWeight;
      if ("strokeBottomWeight" in node) base.strokeBottomWeight = node.strokeBottomWeight;
      if ("strokeLeftWeight" in node) base.strokeLeftWeight = node.strokeLeftWeight;
      if ("effects" in node) {
        base.effects = node.effects.map(serializeEffect).filter((e) => e !== null);
      }
    }
    if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
      const r = node;
      base.cornerRadius = safeCornerRadius(r);
      base.topLeftRadius = r.topLeftRadius;
      base.topRightRadius = r.topRightRadius;
      base.bottomLeftRadius = r.bottomLeftRadius;
      base.bottomRightRadius = r.bottomRightRadius;
    }
    if (node.type === "FRAME" || node.type === "COMPONENT") {
      const f = node;
      base.layoutMode = f.layoutMode === "GRID" ? "NONE" : f.layoutMode;
      base.primaryAxisSizingMode = f.primaryAxisSizingMode;
      base.counterAxisSizingMode = f.counterAxisSizingMode;
      base.primaryAxisAlignItems = f.primaryAxisAlignItems;
      base.counterAxisAlignItems = f.counterAxisAlignItems;
      base.paddingTop = f.paddingTop;
      base.paddingBottom = f.paddingBottom;
      base.paddingLeft = f.paddingLeft;
      base.paddingRight = f.paddingRight;
      base.itemSpacing = f.itemSpacing;
      base.itemReverseZIndex = f.itemReverseZIndex;
      base.strokesIncludedInLayout = f.strokesIncludedInLayout;
      base.clipsContent = f.clipsContent;
      base.children = f.children.map(serializeNode);
    }
    if (node.type === "GROUP") {
      const g = node;
      base.children = g.children.map(serializeNode);
    }
    if (node.type === "TEXT") {
      const t = node;
      base.characters = t.characters;
      if (typeof t.textStyleId === "string" && t.textStyleId !== "") {
        base.textStyleId = t.textStyleId;
      }
      base.fontSize = typeof t.fontSize === "symbol" ? 14 : t.fontSize;
      const fn = typeof t.fontName === "symbol" ? { family: "Inter", style: "Regular" } : t.fontName;
      base.fontName = { family: fn.family, style: fn.style };
      base.textAlignHorizontal = t.textAlignHorizontal;
      base.textAlignVertical = t.textAlignVertical;
      const ls = typeof t.letterSpacing === "symbol" ? { value: 0, unit: "PIXELS" } : t.letterSpacing;
      base.letterSpacing = { value: ls.value, unit: ls.unit };
      const lh = typeof t.lineHeight === "symbol" ? { unit: "AUTO" } : t.lineHeight;
      if (lh.unit === "AUTO") {
        base.lineHeight = { unit: "AUTO" };
      } else {
        base.lineHeight = { value: lh.value, unit: lh.unit };
      }
      base.textCase = typeof t.textCase === "symbol" ? "ORIGINAL" : t.textCase;
      base.textDecoration = typeof t.textDecoration === "symbol" ? "NONE" : t.textDecoration;
    }
    return base;
  }
  function applyBaseLayout(node, data) {
    if (data.layoutAlign !== void 0) node.layoutAlign = data.layoutAlign;
    if (data.layoutGrow !== void 0) node.layoutGrow = data.layoutGrow;
    if (data.layoutPositioning !== void 0) node.layoutPositioning = data.layoutPositioning;
  }
  function applyBoundVariables(node, boundVariables) {
    if (!boundVariables) return;
    for (const [prop, value] of Object.entries(boundVariables)) {
      try {
        if (Array.isArray(value)) {
        } else {
          const alias = value;
          if (alias && alias.id) {
            const variable = figma.variables.getVariableById(alias.id);
            if (variable) {
              node.setBoundVariable(prop, variable);
            }
          }
        }
      } catch (e) {
        console.warn(`[class-manager] could not bind ${prop}:`, e);
      }
    }
  }
  function applyPaint(def) {
    let paint = null;
    if (def.type === "SOLID") {
      const d = def;
      paint = { type: "SOLID", color: d.color, opacity: d.opacity };
    }
    if (paint && def.boundVariables) {
      for (const [prop, value] of Object.entries(def.boundVariables)) {
        try {
          const variable = figma.variables.getVariableById(value.id);
          if (variable) {
            paint = figma.variables.setBoundVariableForPaint(paint, prop, variable);
          }
        } catch (e) {
          console.warn(`[class-manager] could not bind paint property ${prop}:`, e);
        }
      }
    }
    return paint;
  }
  function applyFills(node, fills) {
    if (!fills) return;
    node.fills = fills.map(applyPaint).filter((p) => p !== null);
  }
  function applyStrokes(node, strokes, weight, align, individualWeights) {
    if (!strokes) return;
    node.strokes = strokes.map(applyPaint).filter((p) => p !== null);
    if (weight !== void 0) node.strokeWeight = weight;
    if (individualWeights) {
      if (individualWeights.top !== void 0 && "strokeTopWeight" in node) node.strokeTopWeight = individualWeights.top;
      if (individualWeights.right !== void 0 && "strokeRightWeight" in node) node.strokeRightWeight = individualWeights.right;
      if (individualWeights.bottom !== void 0 && "strokeBottomWeight" in node) node.strokeBottomWeight = individualWeights.bottom;
      if (individualWeights.left !== void 0 && "strokeLeftWeight" in node) node.strokeLeftWeight = individualWeights.left;
    }
    if (align !== void 0) node.strokeAlign = align;
  }
  function applyEffects(node, effects) {
    if (!effects) return;
    node.effects = effects.map((e) => {
      let effect;
      if (e.type === "DROP_SHADOW") {
        effect = {
          type: "DROP_SHADOW",
          color: e.color,
          offset: e.offset,
          radius: e.radius,
          spread: e.spread,
          blendMode: e.blendMode,
          visible: e.visible,
          showShadowBehindNode: false
        };
      } else {
        effect = {
          type: "INNER_SHADOW",
          color: e.color,
          offset: e.offset,
          radius: e.radius,
          spread: e.spread,
          blendMode: e.blendMode,
          visible: e.visible
        };
      }
      if (e.boundVariables) {
        for (const [prop, value] of Object.entries(e.boundVariables)) {
          try {
            const variable = figma.variables.getVariableById(value.id);
            if (variable) {
              effect = figma.variables.setBoundVariableForEffect(effect, prop, variable);
            }
          } catch (err) {
            console.warn(`[class-manager] could not bind effect property ${prop}:`, err);
          }
        }
      }
      return effect;
    });
  }
  function applyCorners(node, data) {
    const cr = data.cornerRadius;
    if (cr !== void 0 && cr >= 0 && cr === data.topLeftRadius) {
      node.cornerRadius = cr;
    } else {
      if (data.topLeftRadius !== void 0) node.topLeftRadius = data.topLeftRadius;
      if (data.topRightRadius !== void 0) node.topRightRadius = data.topRightRadius;
      if (data.bottomLeftRadius !== void 0) node.bottomLeftRadius = data.bottomLeftRadius;
      if (data.bottomRightRadius !== void 0) node.bottomRightRadius = data.bottomRightRadius;
    }
  }
  function applyFrameLayout(frame, data) {
    if (data.layoutMode !== void 0) frame.layoutMode = data.layoutMode;
    if (data.layoutMode && data.layoutMode !== "NONE") {
      if (data.primaryAxisSizingMode) frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
      if (data.counterAxisSizingMode) frame.counterAxisSizingMode = data.counterAxisSizingMode;
      if (data.primaryAxisAlignItems) frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
      if (data.counterAxisAlignItems) frame.counterAxisAlignItems = data.counterAxisAlignItems;
      if (data.itemSpacing !== void 0) frame.itemSpacing = data.itemSpacing;
      if (data.itemReverseZIndex !== void 0) frame.itemReverseZIndex = data.itemReverseZIndex;
      if (data.strokesIncludedInLayout !== void 0) frame.strokesIncludedInLayout = data.strokesIncludedInLayout;
      if (data.paddingTop !== void 0) frame.paddingTop = data.paddingTop;
      if (data.paddingBottom !== void 0) frame.paddingBottom = data.paddingBottom;
      if (data.paddingLeft !== void 0) frame.paddingLeft = data.paddingLeft;
      if (data.paddingRight !== void 0) frame.paddingRight = data.paddingRight;
    }
    if (data.clipsContent !== void 0) frame.clipsContent = data.clipsContent;
  }
  async function collectFonts(node, set) {
    if (node.type === "TEXT") {
      if (node.fontName) {
        set.add(`${node.fontName.family}::${node.fontName.style}`);
      }
      if (node.textStyleId) {
        try {
          const style = await figma.getStyleByIdAsync(node.textStyleId);
          if (style) {
            set.add(`${style.fontName.family}::${style.fontName.style}`);
          }
        } catch (e) {
        }
      }
    }
    if (node.children) {
      for (const child of node.children) await collectFonts(child, set);
    }
  }
  async function restoreNode(data, parent) {
    let node = null;
    if (data.type === "FRAME" || data.type === "COMPONENT") {
      const frame = figma.createFrame();
      frame.name = data.name;
      frame.resize(data.width, data.height);
      frame.x = data.x;
      frame.y = data.y;
      frame.rotation = data.rotation;
      frame.opacity = data.opacity;
      frame.blendMode = data.blendMode;
      frame.visible = data.visible;
      applyFills(frame, data.fills);
      applyStrokes(frame, data.strokes, data.strokeWeight, data.strokeAlign, {
        top: data.strokeTopWeight,
        right: data.strokeRightWeight,
        bottom: data.strokeBottomWeight,
        left: data.strokeLeftWeight
      });
      applyEffects(frame, data.effects);
      applyCorners(frame, data);
      applyFrameLayout(frame, data);
      applyBaseLayout(frame, data);
      applyBoundVariables(frame, data.boundVariables);
      parent.appendChild(frame);
      if (data.children) {
        for (const childData of data.children) {
          await restoreNode(childData, frame);
        }
      }
      node = frame;
    } else if (data.type === "GROUP") {
      const tempFrame = figma.createFrame();
      tempFrame.name = "__temp__";
      tempFrame.resize(data.width, data.height);
      parent.appendChild(tempFrame);
      const childNodes = [];
      if (data.children) {
        for (const childData of data.children) {
          const child = await restoreNode(childData, tempFrame);
          if (child) childNodes.push(child);
        }
      }
      if (childNodes.length > 0) {
        const group = figma.group(childNodes, parent);
        group.name = data.name;
        group.x = data.x;
        group.y = data.y;
        group.opacity = data.opacity;
        group.blendMode = data.blendMode;
        group.visible = data.visible;
        tempFrame.remove();
        node = group;
      } else {
        tempFrame.name = data.name;
        applyFills(tempFrame, data.fills);
        applyStrokes(tempFrame, data.strokes, data.strokeWeight, data.strokeAlign, {
          top: data.strokeTopWeight,
          right: data.strokeRightWeight,
          bottom: data.strokeBottomWeight,
          left: data.strokeLeftWeight
        });
        node = tempFrame;
      }
    } else if (data.type === "RECTANGLE") {
      const rect = figma.createRectangle();
      rect.name = data.name;
      rect.resize(data.width, data.height);
      rect.x = data.x;
      rect.y = data.y;
      rect.rotation = data.rotation;
      rect.opacity = data.opacity;
      rect.blendMode = data.blendMode;
      rect.visible = data.visible;
      applyFills(rect, data.fills);
      applyStrokes(rect, data.strokes, data.strokeWeight, data.strokeAlign, {
        top: data.strokeTopWeight,
        right: data.strokeRightWeight,
        bottom: data.strokeBottomWeight,
        left: data.strokeLeftWeight
      });
      applyEffects(rect, data.effects);
      applyCorners(rect, data);
      applyBaseLayout(rect, data);
      applyBoundVariables(rect, data.boundVariables);
      parent.appendChild(rect);
      node = rect;
    } else if (data.type === "ELLIPSE") {
      const el = figma.createEllipse();
      el.name = data.name;
      el.resize(data.width, data.height);
      el.x = data.x;
      el.y = data.y;
      el.rotation = data.rotation;
      el.opacity = data.opacity;
      el.blendMode = data.blendMode;
      el.visible = data.visible;
      applyFills(el, data.fills);
      applyStrokes(el, data.strokes, data.strokeWeight, data.strokeAlign);
      applyEffects(el, data.effects);
      applyBaseLayout(el, data);
      applyBoundVariables(el, data.boundVariables);
      parent.appendChild(el);
      node = el;
    } else if (data.type === "LINE") {
      const line = figma.createLine();
      line.name = data.name;
      line.resize(data.width || 100, 0);
      line.x = data.x;
      line.y = data.y;
      line.rotation = data.rotation;
      line.opacity = data.opacity;
      line.blendMode = data.blendMode;
      line.visible = data.visible;
      applyStrokes(line, data.strokes, data.strokeWeight, data.strokeAlign);
      applyBaseLayout(line, data);
      applyBoundVariables(line, data.boundVariables);
      parent.appendChild(line);
      node = line;
    } else if (data.type === "TEXT") {
      const text = figma.createText();
      text.name = data.name;
      if (data.fontName) {
        text.fontName = { family: data.fontName.family, style: data.fontName.style };
      }
      if (data.characters !== void 0) text.characters = data.characters;
      if (data.fontSize !== void 0) text.fontSize = data.fontSize;
      if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal;
      if (data.textAlignVertical) text.textAlignVertical = data.textAlignVertical;
      if (data.letterSpacing) text.letterSpacing = data.letterSpacing;
      if (data.lineHeight) text.lineHeight = data.lineHeight;
      if (data.textCase) text.textCase = data.textCase;
      if (data.textDecoration) text.textDecoration = data.textDecoration;
      text.x = data.x;
      text.y = data.y;
      text.rotation = data.rotation;
      text.opacity = data.opacity;
      text.blendMode = data.blendMode;
      text.visible = data.visible;
      if (data.textStyleId) {
        try {
          text.textStyleId = data.textStyleId;
        } catch (e) {
          console.warn(`[class-manager] could not apply text style ${data.textStyleId}:`, e);
        }
      }
      applyFills(text, data.fills);
      applyEffects(text, data.effects);
      applyBaseLayout(text, data);
      applyBoundVariables(text, data.boundVariables);
      parent.appendChild(text);
      node = text;
    } else {
      const placeholder = figma.createRectangle();
      placeholder.name = data.name;
      placeholder.resize(Math.max(data.width, 1), Math.max(data.height, 1));
      placeholder.x = data.x;
      placeholder.y = data.y;
      placeholder.opacity = data.opacity;
      placeholder.visible = data.visible;
      applyFills(placeholder, data.fills);
      parent.appendChild(placeholder);
      node = placeholder;
    }
    return node;
  }
  var GLOBAL_STORAGE_KEY = "global-classes";
  async function loadPersonalClasses() {
    const raw = await figma.clientStorage.getAsync(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  async function savePersonalClasses(classes) {
    await figma.clientStorage.setAsync(LOCAL_STORAGE_KEY, JSON.stringify(classes));
  }
  function loadGlobalClasses() {
    const raw = figma.root.getPluginData(GLOBAL_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  function saveGlobalClasses(classes) {
    figma.root.setPluginData(GLOBAL_STORAGE_KEY, JSON.stringify(classes));
  }
  function mergeClasses(existing, imported) {
    const map = /* @__PURE__ */ new Map();
    for (const cls of [...existing, ...imported]) {
      const prev = map.get(cls.id);
      if (!prev || new Date(cls.updatedAt) >= new Date(prev.updatedAt)) {
        map.set(cls.id, cls);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  function generateId() {
    return "cls_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
  }
  figma.showUI(__html__, { width: 320, height: 560, title: "Styles Managers", themeColors: true });
  var pinnedNode = null;
  function getValidNode(sel) {
    const node = sel[0];
    if (!node) return null;
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
      return node;
    }
    return null;
  }
  function sendSelection() {
    const node = getValidNode(figma.currentPage.selection);
    if (node) pinnedNode = node;
    figma.ui.postMessage({
      type: "selection-changed",
      hasValidSelection: node !== null,
      nodeName: node ? node.name : ""
    });
  }
  async function loadClasses(scope) {
    if (scope === "global") return loadGlobalClasses();
    return loadPersonalClasses();
  }
  async function saveClasses(scope, classes) {
    if (scope === "global") saveGlobalClasses(classes);
    else await savePersonalClasses(classes);
  }
  function notifyLoaded(scope, classes) {
    figma.ui.postMessage({
      type: scope === "global" ? "global-classes-loaded" : "personal-classes-loaded",
      classes
    });
  }
  (async () => {
    const [globalCls, personalCls] = await Promise.all([
      loadClasses("global"),
      loadClasses("personal")
    ]);
    figma.ui.postMessage({ type: "global-classes-loaded", classes: globalCls });
    figma.ui.postMessage({ type: "personal-classes-loaded", classes: personalCls });
    sendSelection();
  })();
  figma.on("selectionchange", sendSelection);
  figma.ui.onmessage = async (msg) => {
    if (msg.type === "resize") {
      figma.ui.resize(msg.width, msg.height);
      return;
    }
    const scope = msg.scope === "personal" ? "personal" : "global";
    if (msg.type === "save-class") {
      try {
        const node = pinnedNode;
        if (!node) {
          figma.ui.postMessage({ type: "error", message: "Select a Frame on the canvas first." });
          return;
        }
        try {
          node.name;
        } catch (e) {
          pinnedNode = null;
          figma.ui.postMessage({ type: "error", message: "Selected frame no longer exists." });
          return;
        }
        const nodeTree = serializeNode(node);
        const classes = await loadClasses(scope);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const existingIdx = classes.findIndex((c) => c.name === msg.name);
        if (existingIdx >= 0) {
          classes[existingIdx].nodeTree = nodeTree;
          classes[existingIdx].label = msg.label || classes[existingIdx].label;
          classes[existingIdx].version = classes[existingIdx].version + 1;
          classes[existingIdx].updatedAt = now;
        } else {
          classes.unshift({
            id: generateId(),
            name: msg.name,
            label: msg.label || "",
            nodeTree,
            version: 1,
            updatedAt: now,
            createdAt: now
          });
        }
        await saveClasses(scope, classes);
        notifyLoaded(scope, classes);
        figma.ui.postMessage({ type: "success", message: `Class "${msg.name}" saved (${scope}).` });
      } catch (err) {
        figma.ui.postMessage({ type: "error", message: `Save failed: ${String(err)}` });
      }
    }
    if (msg.type === "insert-class") {
      try {
        const classes = await loadClasses(scope);
        const cls = classes.find((c) => c.id === msg.id);
        if (!cls) {
          figma.ui.postMessage({ type: "error", message: "Class not found." });
          return;
        }
        const tree = cls.nodeTree;
        if (!tree) {
          figma.ui.postMessage({ type: "error", message: "Class has no node data." });
          return;
        }
        const fontSet = /* @__PURE__ */ new Set();
        await collectFonts(tree, fontSet);
        await Promise.all(
          Array.from(fontSet).map((key) => {
            const [family, style] = key.split("::");
            return figma.loadFontAsync({ family, style });
          })
        );
        const created = await restoreNode(tree, figma.currentPage);
        if (created) {
          const center = figma.viewport.center;
          created.x = center.x - tree.width / 2;
          created.y = center.y - tree.height / 2;
          figma.currentPage.selection = [created];
          figma.viewport.scrollAndZoomIntoView([created]);
        }
        figma.ui.postMessage({ type: "success", message: `"${cls.name}" inserted.` });
      } catch (err) {
        const e = String(err);
        if (e.includes("layoutMode") || e.includes("itemReverseZIndex")) {
          figma.ui.postMessage({ type: "error", message: "Frame must use Auto Layout\u2014select the frame and enable Auto Layout in the right panel." });
        } else {
          figma.ui.postMessage({ type: "error", message: `Insert failed: ${e}` });
        }
      }
    }
    if (msg.type === "delete-class") {
      let classes = await loadClasses(scope);
      classes = classes.filter((c) => c.id !== msg.id);
      await saveClasses(scope, classes);
      notifyLoaded(scope, classes);
      figma.ui.postMessage({ type: "success", message: "Class deleted." });
    }
    if (msg.type === "delete-classes") {
      const ids = msg.ids || [];
      if (ids.length === 0) return;
      let classes = await loadClasses(scope);
      classes = classes.filter((c) => !ids.includes(c.id));
      await saveClasses(scope, classes);
      notifyLoaded(scope, classes);
      figma.ui.postMessage({ type: "success", message: `${ids.length} class${ids.length > 1 ? "es" : ""} deleted.` });
    }
    if (msg.type === "import-classes") {
      try {
        if (!Array.isArray(msg.classes)) throw new Error("Invalid format");
        const existing = await loadClasses(scope);
        const merged = mergeClasses(existing, msg.classes);
        await saveClasses(scope, merged);
        notifyLoaded(scope, merged);
        figma.ui.postMessage({ type: "success", message: `Imported ${scope} presets successfully.` });
      } catch (e) {
        figma.ui.postMessage({ type: "error", message: `Import failed: ${e}` });
      }
    }
  };
})();
