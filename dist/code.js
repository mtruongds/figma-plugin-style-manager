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
    var _a, _b;
    const def = {
      type: effect.type,
      visible: effect.visible
    };
    if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
      const e2 = effect;
      def.radius = e2.radius;
      def.color = { r: e2.color.r, g: e2.color.g, b: e2.color.b, a: e2.color.a };
      def.offset = { x: e2.offset.x, y: e2.offset.y };
      def.spread = (_a = e2.spread) != null ? _a : 0;
      def.blendMode = e2.blendMode;
      def.showShadowBehindNode = (_b = e2.showShadowBehindNode) != null ? _b : false;
    } else if (effect.type === "LAYER_BLUR" || effect.type === "BACKGROUND_BLUR") {
      const e2 = effect;
      def.radius = e2.radius;
    } else {
      return null;
    }
    const e = effect;
    if (e.boundVariables && Object.keys(e.boundVariables).length > 0) {
      def.boundVariables = JSON.parse(JSON.stringify(e.boundVariables));
    }
    return def;
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
    if (node.type === "INSTANCE") {
      const inst = node;
      if (inst.mainComponent) {
        base.mainComponentKey = inst.mainComponent.key;
        base.mainComponentId = inst.mainComponent.id;
      }
    }
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
      if ("dashPattern" in node) {
        const dp = node.dashPattern;
        base.dashPattern = typeof dp === "symbol" ? [] : [...dp];
      }
      if ("strokeCap" in node) {
        const sc = node.strokeCap;
        base.strokeCap = typeof sc === "symbol" ? "NONE" : sc;
      }
      if ("strokeJoin" in node) {
        const sj = node.strokeJoin;
        base.strokeJoin = typeof sj === "symbol" ? "MITER" : sj;
      }
      if ("strokeMiterLimit" in node) {
        const sml = node.strokeMiterLimit;
        base.strokeMiterLimit = typeof sml === "symbol" ? 4 : sml;
      }
    }
    if ("fillStyleId" in node && node.fillStyleId) base.fillStyleId = node.fillStyleId;
    if ("strokeStyleId" in node && node.strokeStyleId) base.strokeStyleId = node.strokeStyleId;
    if ("effectStyleId" in node && node.effectStyleId) base.effectStyleId = node.effectStyleId;
    if ("effects" in node) {
      base.effects = node.effects.map(serializeEffect).filter((e) => e !== null);
    }
    if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
      const r = node;
      base.cornerRadius = safeCornerRadius(r);
      base.topLeftRadius = r.topLeftRadius;
      base.topRightRadius = r.topRightRadius;
      base.bottomLeftRadius = r.bottomLeftRadius;
      base.bottomRightRadius = r.bottomRightRadius;
    }
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
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
    try {
      if (data.layoutAlign !== void 0) node.layoutAlign = data.layoutAlign;
    } catch (e) {
    }
    try {
      if (data.layoutGrow !== void 0) node.layoutGrow = data.layoutGrow;
    } catch (e) {
    }
    try {
      if (data.layoutPositioning !== void 0) node.layoutPositioning = data.layoutPositioning;
    } catch (e) {
    }
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
    try {
      node.fills = fills.map(applyPaint).filter((p) => p !== null);
    } catch (e) {
    }
  }
  function applyStrokes(node, data) {
    if (!data.strokes) return;
    try {
      node.strokes = data.strokes.map(applyPaint).filter((p) => p !== null);
      if (data.strokeWeight !== void 0) node.strokeWeight = data.strokeWeight;
      if (data.strokeTopWeight !== void 0 && "strokeTopWeight" in node) node.strokeTopWeight = data.strokeTopWeight;
      if (data.strokeRightWeight !== void 0 && "strokeRightWeight" in node) node.strokeRightWeight = data.strokeRightWeight;
      if (data.strokeBottomWeight !== void 0 && "strokeBottomWeight" in node) node.strokeBottomWeight = data.strokeBottomWeight;
      if (data.strokeLeftWeight !== void 0 && "strokeLeftWeight" in node) node.strokeLeftWeight = data.strokeLeftWeight;
      if (data.strokeAlign !== void 0) node.strokeAlign = data.strokeAlign;
      if (data.dashPattern !== void 0 && "dashPattern" in node) node.dashPattern = data.dashPattern;
      if (data.strokeCap !== void 0 && "strokeCap" in node) node.strokeCap = data.strokeCap;
      if (data.strokeJoin !== void 0 && "strokeJoin" in node) node.strokeJoin = data.strokeJoin;
      if (data.strokeMiterLimit !== void 0 && "strokeMiterLimit" in node) node.strokeMiterLimit = data.strokeMiterLimit;
    } catch (e) {
    }
  }
  function applyEffects(node, effects) {
    if (!effects) return;
    node.effects = effects.map((e) => {
      var _a, _b;
      let effect;
      if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
        effect = {
          type: e.type,
          color: e.color,
          offset: e.offset,
          radius: e.radius,
          spread: (_a = e.spread) != null ? _a : 0,
          blendMode: e.blendMode || "NORMAL",
          visible: e.visible
        };
        if (e.type === "DROP_SHADOW") {
          effect.showShadowBehindNode = (_b = e.showShadowBehindNode) != null ? _b : false;
        }
      } else {
        effect = {
          type: e.type,
          radius: e.radius,
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
    try {
      if (cr !== void 0 && cr >= 0 && cr === data.topLeftRadius) {
        node.cornerRadius = cr;
      } else {
        if (data.topLeftRadius !== void 0) node.topLeftRadius = data.topLeftRadius;
        if (data.topRightRadius !== void 0) node.topRightRadius = data.topRightRadius;
        if (data.bottomLeftRadius !== void 0) node.bottomLeftRadius = data.bottomLeftRadius;
        if (data.bottomRightRadius !== void 0) node.bottomRightRadius = data.bottomRightRadius;
      }
    } catch (e) {
    }
  }
  function applyFrameLayout(frame, data) {
    try {
      if (data.layoutMode !== void 0) frame.layoutMode = data.layoutMode;
    } catch (e) {
    }
    if (data.layoutMode && data.layoutMode !== "NONE") {
      try {
        if (data.primaryAxisSizingMode) frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
      } catch (e) {
      }
      try {
        if (data.counterAxisSizingMode) frame.counterAxisSizingMode = data.counterAxisSizingMode;
      } catch (e) {
      }
      try {
        if (data.primaryAxisAlignItems) frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
      } catch (e) {
      }
      try {
        if (data.counterAxisAlignItems) frame.counterAxisAlignItems = data.counterAxisAlignItems;
      } catch (e) {
      }
      try {
        if (data.itemSpacing !== void 0) frame.itemSpacing = data.itemSpacing;
      } catch (e) {
      }
      try {
        if (data.itemReverseZIndex !== void 0) frame.itemReverseZIndex = data.itemReverseZIndex;
      } catch (e) {
      }
      try {
        if (data.strokesIncludedInLayout !== void 0) frame.strokesIncludedInLayout = data.strokesIncludedInLayout;
      } catch (e) {
      }
      try {
        if (data.paddingTop !== void 0) frame.paddingTop = data.paddingTop;
      } catch (e) {
      }
      try {
        if (data.paddingBottom !== void 0) frame.paddingBottom = data.paddingBottom;
      } catch (e) {
      }
      try {
        if (data.paddingLeft !== void 0) frame.paddingLeft = data.paddingLeft;
      } catch (e) {
      }
      try {
        if (data.paddingRight !== void 0) frame.paddingRight = data.paddingRight;
      } catch (e) {
      }
    }
    try {
      if (data.clipsContent !== void 0) frame.clipsContent = data.clipsContent;
    } catch (e) {
    }
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
    if (data.type === "FRAME" || data.type === "COMPONENT" || data.type === "INSTANCE" || data.type === "COMPONENT_SET") {
      let frame;
      if (data.type === "COMPONENT") {
        frame = figma.createComponent();
      } else if (data.type === "INSTANCE") {
        let comp = null;
        if (data.mainComponentKey) {
          try {
            comp = await figma.importComponentByKeyAsync(data.mainComponentKey);
          } catch (e) {
          }
        }
        if (!comp && data.mainComponentId) {
          try {
            const found = figma.getNodeById(data.mainComponentId);
            if (found && found.type === "COMPONENT") comp = found;
          } catch (e) {
          }
        }
        if (comp) {
          frame = comp.createInstance();
        } else {
          frame = figma.createFrame();
        }
      } else if (data.type === "COMPONENT_SET") {
        frame = figma.createFrame();
      } else {
        frame = figma.createFrame();
      }
      frame.name = data.name;
      frame.resize(data.width, data.height);
      frame.x = data.x;
      frame.y = data.y;
      frame.rotation = data.rotation;
      frame.opacity = data.opacity;
      frame.blendMode = data.blendMode;
      frame.visible = data.visible;
      applyFills(frame, data.fills);
      applyStrokes(frame, data);
      applyEffects(frame, data.effects);
      if (data.fillStyleId) try {
        frame.fillStyleId = data.fillStyleId;
      } catch (e) {
      }
      if (data.strokeStyleId) try {
        frame.strokeStyleId = data.strokeStyleId;
      } catch (e) {
      }
      if (data.effectStyleId) try {
        frame.effectStyleId = data.effectStyleId;
      } catch (e) {
      }
      applyCorners(frame, data);
      applyFrameLayout(frame, data);
      applyBaseLayout(frame, data);
      applyBoundVariables(frame, data.boundVariables);
      parent.appendChild(frame);
      if (data.children) {
        if (frame.type === "INSTANCE") {
          const inst = frame;
          for (const childData of data.children) {
            const found = inst.children.find((c) => c.name === childData.name);
            if (found) {
              await applyOverrides(found, childData);
            }
          }
        } else {
          for (const childData of data.children) {
            await restoreNode(childData, frame);
          }
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
        applyEffects(group, data.effects);
        if (data.effectStyleId) try {
          group.effectStyleId = data.effectStyleId;
        } catch (e) {
        }
        tempFrame.remove();
        node = group;
      } else {
        tempFrame.name = data.name;
        applyFills(tempFrame, data.fills);
        applyStrokes(tempFrame, data);
        applyEffects(tempFrame, data.effects);
        if (data.fillStyleId) try {
          tempFrame.fillStyleId = data.fillStyleId;
        } catch (e) {
        }
        if (data.strokeStyleId) try {
          tempFrame.strokeStyleId = data.strokeStyleId;
        } catch (e) {
        }
        if (data.effectStyleId) try {
          tempFrame.effectStyleId = data.effectStyleId;
        } catch (e) {
        }
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
      applyStrokes(rect, data);
      applyEffects(rect, data.effects);
      if (data.fillStyleId) try {
        rect.fillStyleId = data.fillStyleId;
      } catch (e) {
      }
      if (data.strokeStyleId) try {
        rect.strokeStyleId = data.strokeStyleId;
      } catch (e) {
      }
      if (data.effectStyleId) try {
        rect.effectStyleId = data.effectStyleId;
      } catch (e) {
      }
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
      applyStrokes(el, data);
      applyEffects(el, data.effects);
      if (data.fillStyleId) try {
        el.fillStyleId = data.fillStyleId;
      } catch (e) {
      }
      if (data.strokeStyleId) try {
        el.strokeStyleId = data.strokeStyleId;
      } catch (e) {
      }
      if (data.effectStyleId) try {
        el.effectStyleId = data.effectStyleId;
      } catch (e) {
      }
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
      applyStrokes(line, data);
      applyEffects(line, data.effects);
      if (data.strokeStyleId) try {
        line.strokeStyleId = data.strokeStyleId;
      } catch (e) {
      }
      if (data.effectStyleId) try {
        line.effectStyleId = data.effectStyleId;
      } catch (e) {
      }
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
      if (data.fillStyleId) try {
        text.fillStyleId = data.fillStyleId;
      } catch (e) {
      }
      if (data.effectStyleId) try {
        text.effectStyleId = data.effectStyleId;
      } catch (e) {
      }
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
      applyEffects(placeholder, data.effects);
      if (data.fillStyleId) try {
        placeholder.fillStyleId = data.fillStyleId;
      } catch (e) {
      }
      if (data.effectStyleId) try {
        placeholder.effectStyleId = data.effectStyleId;
      } catch (e) {
      }
      parent.appendChild(placeholder);
      node = placeholder;
    }
    return node;
  }
  async function applyOverrides(node, data) {
    if (node.type === "INSTANCE" && data.type === "INSTANCE" && data.mainComponentKey) {
      const inst = node;
      if (!inst.mainComponent || inst.mainComponent.key !== data.mainComponentKey) {
        try {
          const newComp = await figma.importComponentByKeyAsync(data.mainComponentKey);
          inst.swapComponent(newComp);
        } catch (e) {
          console.warn("[class-manager] could not swap nested instance component:", e);
        }
      }
    }
    if ("fills" in node) applyFills(node, data.fills);
    if ("strokes" in node) applyStrokes(node, data);
    if ("effects" in node) applyEffects(node, data.effects);
    if ("fillStyleId" in node && data.fillStyleId) try {
      node.fillStyleId = data.fillStyleId;
    } catch (e) {
    }
    if ("strokeStyleId" in node && data.strokeStyleId) try {
      node.strokeStyleId = data.strokeStyleId;
    } catch (e) {
    }
    if ("effectStyleId" in node && data.effectStyleId) try {
      node.effectStyleId = data.effectStyleId;
    } catch (e) {
    }
    if ("opacity" in node && data.opacity !== void 0) node.opacity = data.opacity;
    if ("visible" in node && data.visible !== void 0) node.visible = data.visible;
    if ("blendMode" in node && data.blendMode !== void 0) node.blendMode = data.blendMode;
    if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
      applyCorners(node, data);
    }
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
      applyFrameLayout(node, data);
      applyBaseLayout(node, data);
    }
    if (node.type === "TEXT" && data.type === "TEXT") {
      const t = node;
      if (data.characters !== void 0) t.characters = data.characters;
      if (data.fontSize !== void 0) t.fontSize = data.fontSize;
      if (data.fontName) {
        await figma.loadFontAsync(data.fontName);
        t.fontName = data.fontName;
      }
    }
    if (data.children && "children" in node) {
      const children = node.children;
      for (const childData of data.children) {
        const found = children.find((c) => c.name === childData.name);
        if (found) {
          await applyOverrides(found, childData);
        }
      }
    }
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
  async function loadGlobalClasses() {
    const raw = await figma.clientStorage.getAsync(GLOBAL_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  async function saveGlobalClasses(classes) {
    await figma.clientStorage.setAsync(GLOBAL_STORAGE_KEY, JSON.stringify(classes));
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
  figma.showUI(__html__, { width: 365, height: 570, title: "Styles Managers", themeColors: true });
  var pinnedNode = null;
  function getValidNode(sel) {
    const node = sel[0];
    if (!node) return null;
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
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
      nodeName: node ? node.name : "",
      parentName: node && node.parent && node.parent.type !== "PAGE" ? node.parent.name : ""
    });
  }
  async function loadClasses(scope) {
    if (scope === "global") return await loadGlobalClasses();
    return await loadPersonalClasses();
  }
  async function saveClasses(scope, classes) {
    if (scope === "global") await saveGlobalClasses(classes);
    else await savePersonalClasses(classes);
  }
  function notifyLoaded(scope, classes) {
    figma.ui.postMessage({
      type: scope === "global" ? "global-classes-loaded" : "personal-classes-loaded",
      classes
    });
  }
  (async () => {
    const [globalCls, personalCls, githubSettings, globalMeta, personalMeta, savedTheme] = await Promise.all([
      loadClasses("global"),
      loadClasses("personal"),
      figma.clientStorage.getAsync("github-settings"),
      figma.clientStorage.getAsync("global-last-import-sync"),
      figma.clientStorage.getAsync("personal-last-import-sync"),
      figma.clientStorage.getAsync("plugin-theme")
    ]);
    figma.ui.postMessage({ type: "global-classes-loaded", classes: globalCls });
    figma.ui.postMessage({ type: "personal-classes-loaded", classes: personalCls });
    if (savedTheme) figma.ui.postMessage({ type: "theme-loaded", theme: savedTheme });
    if (globalMeta) figma.ui.postMessage({ type: "meta-updated", scope: "global", date: globalMeta });
    if (personalMeta) figma.ui.postMessage({ type: "meta-updated", scope: "personal", date: personalMeta });
    if (githubSettings) {
      try {
        figma.ui.postMessage({ type: "github-settings-loaded", settings: JSON.parse(githubSettings) });
      } catch (e) {
      }
    }
    sendSelection();
  })();
  figma.on("selectionchange", sendSelection);
  async function handleInsertClass(id, scope, dropEvent) {
    try {
      const classes = await loadClasses(scope);
      const cls = classes.find((c) => c.id === id);
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
      let parentNode = figma.currentPage;
      if (dropEvent && dropEvent.node && "appendChild" in dropEvent.node) {
        parentNode = dropEvent.node;
      }
      const created = await restoreNode(tree, parentNode);
      if (created) {
        if (cls.label) {
          created.name = `${cls.label} ${cls.name}`;
        } else {
          created.name = cls.name;
        }
        if (dropEvent) {
          created.x = dropEvent.x - created.width / 2;
          created.y = dropEvent.y - created.height / 2;
        } else {
          const center = figma.viewport.center;
          created.x = center.x - created.width / 2;
          created.y = center.y - created.height / 2;
        }
        figma.currentPage.selection = [created];
        if (!dropEvent) {
          figma.viewport.scrollAndZoomIntoView([created]);
        }
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
  figma.on("drop", (event) => {
    const { dropMetadata } = event;
    if (dropMetadata && dropMetadata.action === "insert-class") {
      handleInsertClass(dropMetadata.id, dropMetadata.scope, event);
      return false;
    }
  });
  figma.ui.onmessage = async (msg) => {
    if (msg.type === "resize") {
      figma.ui.resize(msg.width, msg.height);
      return;
    }
    if (msg.type === "save-theme") {
      await figma.clientStorage.setAsync("plugin-theme", msg.theme);
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
        const existingIdx = classes.findIndex((c) => c.name === msg.name && (c.label || "") === (msg.label || ""));
        if (existingIdx >= 0) {
          classes[existingIdx].nodeTree = nodeTree;
          classes[existingIdx].label = msg.label || "";
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
        figma.ui.postMessage({ type: "success", message: `Preset "${msg.name}" saved (${scope}).` });
      } catch (err) {
        figma.ui.postMessage({ type: "error", message: `Save failed: ${String(err)}` });
      }
    }
    if (msg.type === "insert-class") {
      handleInsertClass(msg.id, scope);
    }
    if (msg.type === "delete-class") {
      let classes = await loadClasses(scope);
      classes = classes.filter((c) => c.id !== msg.id);
      await saveClasses(scope, classes);
      notifyLoaded(scope, classes);
      figma.ui.postMessage({ type: "success", message: "Preset deleted." });
    }
    if (msg.type === "delete-classes") {
      const ids = msg.ids || [];
      if (ids.length === 0) return;
      let classes = await loadClasses(scope);
      classes = classes.filter((c) => !ids.includes(c.id));
      await saveClasses(scope, classes);
      notifyLoaded(scope, classes);
      figma.ui.postMessage({ type: "success", message: `${ids.length} preset${ids.length > 1 ? "s" : ""} deleted.` });
    }
    if (msg.type === "import-classes") {
      try {
        if (!Array.isArray(msg.classes)) throw new Error("Invalid format");
        const existing = await loadClasses(scope);
        const merged = mergeClasses(existing, msg.classes);
        await saveClasses(scope, merged);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await figma.clientStorage.setAsync(`${scope}-last-import-sync`, now);
        notifyLoaded(scope, merged);
        figma.ui.postMessage({ type: "success", message: `Imported ${scope} presets successfully.` });
        figma.ui.postMessage({ type: "meta-updated", scope, date: now });
      } catch (e) {
        figma.ui.postMessage({ type: "error", message: `Import failed: ${e}` });
      }
    }
    if (msg.type === "overwrite-classes") {
      try {
        if (!Array.isArray(msg.classes)) throw new Error("Invalid format");
        await saveClasses(scope, msg.classes);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await figma.clientStorage.setAsync(`${scope}-last-import-sync`, now);
        notifyLoaded(scope, msg.classes);
        figma.ui.postMessage({ type: "success", message: `Pulled from GitHub and updated presets.` });
        figma.ui.postMessage({ type: "meta-updated", scope, date: now });
      } catch (e) {
        figma.ui.postMessage({ type: "error", message: `Pull failed: ${e}` });
      }
    }
    if (msg.type === "save-github-settings") {
      try {
        await figma.clientStorage.setAsync("github-settings", JSON.stringify(msg.settings));
        figma.ui.postMessage({ type: "success", message: "GitHub settings saved." });
      } catch (err) {
        figma.ui.postMessage({ type: "error", message: `Failed to save GitHub settings: ${err}` });
      }
    }
    if (msg.type === "push-global-classes") {
      const globalCls = await loadClasses("global");
      figma.ui.postMessage({ type: "push-global-ready", classes: globalCls });
    }
  };
})();
