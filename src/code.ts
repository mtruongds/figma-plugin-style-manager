// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PluginRGB { r: number; g: number; b: number }
interface PluginRGBA extends PluginRGB { a: number }

interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

interface SolidPaintDef {
  type: "SOLID";
  color: PluginRGB;
  opacity: number;
  boundVariables?: { [property: string]: VariableAlias };
}
interface GradientStop { position: number; color: PluginRGBA }
interface GradientPaintDef {
  type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
  gradientStops: GradientStop[];
  boundVariables?: { [property: string]: VariableAlias };
}
type PaintDef = SolidPaintDef | GradientPaintDef | { type: string; boundVariables?: { [property: string]: VariableAlias } };

interface ShadowDef {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  color?: PluginRGBA;
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
  blendMode?: string;
  visible: boolean;
  showShadowBehindNode?: boolean;
  boundVariables?: { [property: string]: VariableAlias };
}

// A serialized node — captures the full tree recursively.
interface SerializedNode {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blendMode: string;
  visible: boolean;
  // Variables
  boundVariables?: { [property: string]: VariableAlias | VariableAlias[] };
  // Shared visual
  fills?: PaintDef[];
  fillStyleId?: string;
  strokes?: PaintDef[];
  strokeStyleId?: string;
  strokeWeight?: number;
  strokeTopWeight?: number;
  strokeRightWeight?: number;
  strokeBottomWeight?: number;
  strokeLeftWeight?: number;
  strokeAlign?: string;
  dashPattern?: number[];
  strokeCap?: string;
  strokeJoin?: string;
  strokeMiterLimit?: number;
  effects?: ShadowDef[];
  effectStyleId?: string;
  // Shared corners
  cornerRadius?: number;       // -1 = mixed corners
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
  // Auto Layout settings
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  layoutAlign?: "MIN" | "CENTER" | "MAX" | "STRETCH" | "INHERIT";
  layoutGrow?: number;
  layoutPositioning?: "AUTO" | "ABSOLUTE";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  counterAxisSizingMode?: "FIXED" | "AUTO";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "BASELINE";
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  itemSpacing?: number;
  itemReverseZIndex?: boolean;
  strokesIncludedInLayout?: boolean;
  clipsContent?: boolean;
  // Text
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  textStyleId?: string;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing?: { value: number; unit: "PIXELS" | "PERCENT" };
  lineHeight?: { value?: number; unit: "PIXELS" | "PERCENT" | "AUTO" };
  textCase?: string;
  textDecoration?: string;
  // Children (FRAME, GROUP, COMPONENT)
  children?: SerializedNode[];
  // Component/Instance
  mainComponentKey?: string;
  mainComponentId?: string;
}

interface ClassDefinition {
  id: string;
  name: string;
  label: string;
  nodeTree: SerializedNode;
  version: number;
  updatedAt: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = "local-classes";

// ─────────────────────────────────────────────────────────────────────────────
// Serialization helpers
// ─────────────────────────────────────────────────────────────────────────────

function serializePaint(paint: Paint): PaintDef {
  let def: any;
  if (paint.type === "SOLID") {
    const p = paint as SolidPaint;
    def = { type: "SOLID", color: { r: p.color.r, g: p.color.g, b: p.color.b }, opacity: p.opacity ?? 1 };
  } else if (
    paint.type === "GRADIENT_LINEAR" ||
    paint.type === "GRADIENT_RADIAL" ||
    paint.type === "GRADIENT_ANGULAR" ||
    paint.type === "GRADIENT_DIAMOND"
  ) {
    const p = paint as GradientPaint;
    def = {
      type: paint.type,
      gradientStops: p.gradientStops.map((s) => ({
        position: s.position,
        color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a },
      })),
    };
  } else {
    def = { type: paint.type };
  }

  const p = paint as any;
  if (p.boundVariables && Object.keys(p.boundVariables).length > 0) {
    def.boundVariables = JSON.parse(JSON.stringify(p.boundVariables));
  }

  return def;
}

function serializeEffect(effect: Effect): ShadowDef | null {
  const def: any = {
    type: effect.type,
    visible: effect.visible,
  };

  if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
    const e = effect as DropShadowEffect | InnerShadowEffect;
    def.radius = e.radius;
    def.color = { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a };
    def.offset = { x: e.offset.x, y: e.offset.y };
    def.spread = (e as DropShadowEffect).spread ?? 0;
    def.blendMode = e.blendMode;
    def.showShadowBehindNode = (e as DropShadowEffect).showShadowBehindNode ?? false;
  } else if (effect.type === "LAYER_BLUR" || effect.type === "BACKGROUND_BLUR") {
    const e = effect as BlurEffect;
    def.radius = e.radius;
  } else {
    // Unsupported effect types
    return null;
  }

  const e = effect as any;
  if (e.boundVariables && Object.keys(e.boundVariables).length > 0) {
    def.boundVariables = JSON.parse(JSON.stringify(e.boundVariables));
  }

  return def;
}

function safeCornerRadius(node: any): number {
  return typeof node.cornerRadius === "symbol" ? -1 : (node.cornerRadius as number) || 0;
}

function safeStrokeWeight(node: any): number {
  return typeof node.strokeWeight === "symbol" ? 1 : (node.strokeWeight as number) || 0;
}

function safeFills(node: any): PaintDef[] {
  return typeof node.fills === "symbol" ? [] : (node.fills as Paint[]).map(serializePaint);
}

function safeStrokes(node: any): PaintDef[] {
  return typeof node.strokes === "symbol" ? [] : (node.strokes as Paint[]).map(serializePaint);
}

/** Recursively serialize a node and all its children. */
function serializeNode(node: SceneNode): SerializedNode {
  const base: SerializedNode = {
    type: node.type,
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: ("rotation" in node) ? (node as any).rotation : 0,
    opacity: ("opacity" in node) ? (node as any).opacity : 1,
    blendMode: ("blendMode" in node) ? (node as any).blendMode : "NORMAL",
    visible: node.visible,
    layoutAlign: ("layoutAlign" in node) ? (node as any).layoutAlign : "INHERIT",
    layoutGrow: ("layoutGrow" in node) ? (node as any).layoutGrow : 0,
    layoutPositioning: ("layoutPositioning" in node) ? (node as any).layoutPositioning : "AUTO",
  };

  if (node.type === "INSTANCE") {
    const inst = node as InstanceNode;
    if (inst.mainComponent) {
      base.mainComponentKey = inst.mainComponent.key;
      base.mainComponentId = inst.mainComponent.id;
    }
  }

  // Capture bound variables if they exist
  if ("boundVariables" in node && node.boundVariables) {
    const bv = node.boundVariables;
    if (Object.keys(bv).length > 0) {
      base.boundVariables = JSON.parse(JSON.stringify(bv));
    }
  }

  // Visual properties (most node types)
  if ("fills" in node) {
    base.fills = safeFills(node);
    base.strokes = safeStrokes(node);
    base.strokeWeight = safeStrokeWeight(node);
    base.strokeAlign = (node as any).strokeAlign;

    if ("strokeTopWeight" in node) base.strokeTopWeight = (node as any).strokeTopWeight as number;
    if ("strokeRightWeight" in node) base.strokeRightWeight = (node as any).strokeRightWeight as number;
    if ("strokeBottomWeight" in node) base.strokeBottomWeight = (node as any).strokeBottomWeight as number;
    if ("strokeLeftWeight" in node) base.strokeLeftWeight = (node as any).strokeLeftWeight as number;

    if ("dashPattern" in node) {
      const dp = (node as any).dashPattern;
      base.dashPattern = typeof dp === "symbol" ? [] : [...dp];
    }
    if ("strokeCap" in node) {
      const sc = (node as any).strokeCap;
      base.strokeCap = typeof sc === "symbol" ? "NONE" : sc;
    }
    if ("strokeJoin" in node) {
      const sj = (node as any).strokeJoin;
      base.strokeJoin = typeof sj === "symbol" ? "MITER" : sj;
    }
    if ("strokeMiterLimit" in node) {
      const sml = (node as any).strokeMiterLimit;
      base.strokeMiterLimit = typeof sml === "symbol" ? 4 : sml;
    }
  }

  if ("fillStyleId" in node && node.fillStyleId) base.fillStyleId = node.fillStyleId as string;
  if ("strokeStyleId" in node && node.strokeStyleId) base.strokeStyleId = node.strokeStyleId as string;
  if ("effectStyleId" in node && node.effectStyleId) base.effectStyleId = node.effectStyleId as string;

  if ("effects" in node) {
    base.effects = (node.effects as Effect[]).map(serializeEffect).filter((e): e is ShadowDef => e !== null);
  }

  // Rectangle-specific corners
  if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    const r = node as any;
    base.cornerRadius = safeCornerRadius(r);
    base.topLeftRadius = r.topLeftRadius;
    base.topRightRadius = r.topRightRadius;
    base.bottomLeftRadius = r.bottomLeftRadius;
    base.bottomRightRadius = r.bottomRightRadius;
  }

  // Frame / component / instance / component set layout
  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    const f = node as FrameNode | ComponentNode | InstanceNode | ComponentSetNode;
    base.layoutMode = (f.layoutMode === "GRID" ? "NONE" : f.layoutMode) as any;
    base.primaryAxisSizingMode = f.primaryAxisSizingMode;
    base.counterAxisSizingMode = f.counterAxisSizingMode;
    base.primaryAxisAlignItems = f.primaryAxisAlignItems;
    base.counterAxisAlignItems = f.counterAxisAlignItems as any;
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

  // Group
  if (node.type === "GROUP") {
    const g = node as GroupNode;
    base.children = g.children.map(serializeNode);
  }

  // Text
  if (node.type === "TEXT") {
    const t = node as TextNode;
    base.characters = t.characters;

    // Capture text style
    if (typeof t.textStyleId === "string" && t.textStyleId !== "") {
      base.textStyleId = t.textStyleId;
    }

    base.fontSize = typeof t.fontSize === "symbol" ? 14 : (t.fontSize as number);
    const fn = typeof t.fontName === "symbol" ? { family: "Inter", style: "Regular" } : (t.fontName as FontName);
    base.fontName = { family: fn.family, style: fn.style };
    base.textAlignHorizontal = t.textAlignHorizontal;
    base.textAlignVertical = t.textAlignVertical;
    const ls = typeof t.letterSpacing === "symbol" ? { value: 0, unit: "PIXELS" as const } : (t.letterSpacing as LetterSpacing);
    base.letterSpacing = { value: ls.value, unit: ls.unit };
    const lh = typeof t.lineHeight === "symbol" ? { unit: "AUTO" as const } : (t.lineHeight as LineHeight);
    if (lh.unit === "AUTO") {
      base.lineHeight = { unit: "AUTO" };
    } else {
      base.lineHeight = { value: (lh as { value: number; unit: "PIXELS" | "PERCENT" }).value, unit: lh.unit };
    }
    base.textCase = typeof t.textCase === "symbol" ? "ORIGINAL" : (t.textCase as string);
    base.textDecoration = typeof t.textDecoration === "symbol" ? "NONE" : (t.textDecoration as string);
  }

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// Restoration helpers
// ─────────────────────────────────────────────────────────────────────────────

function applyBaseLayout(node: any, data: SerializedNode) {
  try { if (data.layoutAlign !== undefined) node.layoutAlign = data.layoutAlign; } catch (e) { }
  try { if (data.layoutGrow !== undefined) node.layoutGrow = data.layoutGrow; } catch (e) { }
  try { if (data.layoutPositioning !== undefined) node.layoutPositioning = data.layoutPositioning; } catch (e) { }
}

function applyBoundVariables(node: SceneNode, boundVariables: SerializedNode["boundVariables"]) {
  if (!boundVariables) return;
  for (const [prop, value] of Object.entries(boundVariables)) {
    try {
      if (Array.isArray(value)) {
        // Multi-fill arrays are complex. For now, simple properties only.
      } else {
        const alias = value as VariableAlias;
        if (alias && alias.id) {
          const variable = figma.variables.getVariableById(alias.id);
          if (variable) {
            node.setBoundVariable(prop as any, variable);
          }
        }
      }
    } catch (e) {
      console.warn(`[class-manager] could not bind ${prop}:`, e);
    }
  }
}

function applyPaint(def: PaintDef): Paint | null {
  let paint: any = null;
  if (def.type === "SOLID") {
    const d = def as SolidPaintDef;
    paint = { type: "SOLID", color: d.color, opacity: d.opacity };
  }

  if (paint && def.boundVariables) {
    for (const [prop, value] of Object.entries(def.boundVariables)) {
      try {
        const variable = figma.variables.getVariableById((value as VariableAlias).id);
        if (variable) {
          paint = figma.variables.setBoundVariableForPaint(paint, prop as any, variable);
        }
      } catch (e) {
        console.warn(`[class-manager] could not bind paint property ${prop}:`, e);
      }
    }
  }
  return paint;
}

function applyFills(node: any, fills: PaintDef[] | undefined) {
  if (!fills) return;
  try {
    node.fills = fills.map(applyPaint).filter((p): p is Paint => p !== null);
  } catch (e) { }
}

function applyStrokes(node: any, data: SerializedNode) {
  if (!data.strokes) return;
  try {
    node.strokes = data.strokes.map(applyPaint).filter((p): p is Paint => p !== null);

    if (data.strokeWeight !== undefined) node.strokeWeight = data.strokeWeight;

    if (data.strokeTopWeight !== undefined && "strokeTopWeight" in node) node.strokeTopWeight = data.strokeTopWeight;
    if (data.strokeRightWeight !== undefined && "strokeRightWeight" in node) node.strokeRightWeight = data.strokeRightWeight;
    if (data.strokeBottomWeight !== undefined && "strokeBottomWeight" in node) node.strokeBottomWeight = data.strokeBottomWeight;
    if (data.strokeLeftWeight !== undefined && "strokeLeftWeight" in node) node.strokeLeftWeight = data.strokeLeftWeight;

    if (data.strokeAlign !== undefined) node.strokeAlign = data.strokeAlign as any;

    if (data.dashPattern !== undefined && "dashPattern" in node) node.dashPattern = data.dashPattern;
    if (data.strokeCap !== undefined && "strokeCap" in node) node.strokeCap = data.strokeCap as any;
    if (data.strokeJoin !== undefined && "strokeJoin" in node) node.strokeJoin = data.strokeJoin as any;
    if (data.strokeMiterLimit !== undefined && "strokeMiterLimit" in node) node.strokeMiterLimit = data.strokeMiterLimit;
  } catch (e) { }
}

function applyEffects(node: any, effects: ShadowDef[] | undefined) {
  if (!effects) return;
  node.effects = effects.map((e) => {
    let effect: any;
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
      effect = {
        type: e.type,
        color: e.color!,
        offset: e.offset!,
        radius: e.radius,
        spread: e.spread ?? 0,
        blendMode: (e.blendMode as BlendMode) || "NORMAL",
        visible: e.visible,
      };
      if (e.type === "DROP_SHADOW") {
        effect.showShadowBehindNode = e.showShadowBehindNode ?? false;
      }
    } else {
      effect = {
        type: e.type,
        radius: e.radius,
        visible: e.visible,
      };
    }

    if (e.boundVariables) {
      for (const [prop, value] of Object.entries(e.boundVariables)) {
        try {
          const variable = figma.variables.getVariableById((value as VariableAlias).id);
          if (variable) {
            effect = figma.variables.setBoundVariableForEffect(effect, prop as any, variable);
          }
        } catch (err) {
          console.warn(`[class-manager] could not bind effect property ${prop}:`, err);
        }
      }
    }
    return effect;
  });
}

function applyCorners(node: any, data: SerializedNode) {
  const cr = data.cornerRadius;
  try {
    if (cr !== undefined && cr >= 0 && cr === data.topLeftRadius) {
      node.cornerRadius = cr;
    } else {
      if (data.topLeftRadius !== undefined) node.topLeftRadius = data.topLeftRadius;
      if (data.topRightRadius !== undefined) node.topRightRadius = data.topRightRadius;
      if (data.bottomLeftRadius !== undefined) node.bottomLeftRadius = data.bottomLeftRadius;
      if (data.bottomRightRadius !== undefined) node.bottomRightRadius = data.bottomRightRadius;
    }
  } catch (e) { }
}

function applyFrameLayout(frame: FrameNode | ComponentNode | InstanceNode, data: SerializedNode) {
  try { if (data.layoutMode !== undefined) (frame as any).layoutMode = data.layoutMode; } catch (e) { }

  // These properties only exist when Auto Layout is enabled (horizontal or vertical)
  if (data.layoutMode && data.layoutMode !== "NONE") {
    try { if (data.primaryAxisSizingMode) frame.primaryAxisSizingMode = data.primaryAxisSizingMode; } catch (e) { }
    try { if (data.counterAxisSizingMode) frame.counterAxisSizingMode = data.counterAxisSizingMode; } catch (e) { }
    try { if (data.primaryAxisAlignItems) frame.primaryAxisAlignItems = data.primaryAxisAlignItems; } catch (e) { }
    try { if (data.counterAxisAlignItems) frame.counterAxisAlignItems = data.counterAxisAlignItems as any; } catch (e) { }

    try { if (data.itemSpacing !== undefined) frame.itemSpacing = data.itemSpacing; } catch (e) { }
    try { if (data.itemReverseZIndex !== undefined) frame.itemReverseZIndex = data.itemReverseZIndex; } catch (e) { }
    try { if (data.strokesIncludedInLayout !== undefined) frame.strokesIncludedInLayout = data.strokesIncludedInLayout; } catch (e) { }

    try { if (data.paddingTop !== undefined) frame.paddingTop = data.paddingTop; } catch (e) { }
    try { if (data.paddingBottom !== undefined) frame.paddingBottom = data.paddingBottom; } catch (e) { }
    try { if (data.paddingLeft !== undefined) frame.paddingLeft = data.paddingLeft; } catch (e) { }
    try { if (data.paddingRight !== undefined) frame.paddingRight = data.paddingRight; } catch (e) { }
  }

  try { if (data.clipsContent !== undefined) frame.clipsContent = data.clipsContent; } catch (e) { }
}

/** Collect all unique fontNames in a tree so we can pre-load them. */
async function collectFonts(node: SerializedNode, set: Set<string>) {
  if (node.type === "TEXT") {
    if (node.fontName) {
      set.add(`${node.fontName.family}::${node.fontName.style}`);
    }
    if (node.textStyleId) {
      try {
        const style = (await figma.getStyleByIdAsync(node.textStyleId)) as TextStyle;
        if (style) {
          set.add(`${style.fontName.family}::${style.fontName.style}`);
        }
      } catch (e) {
        // Style might not exist or be accessible
      }
    }
  }
  if (node.children) {
    for (const child of node.children) await collectFonts(child, set);
  }
}

/** Recursively recreate a node tree inside `parent`. */
async function restoreNode(data: SerializedNode, parent: FrameNode | ComponentNode | GroupNode | PageNode): Promise<SceneNode | null> {
  let node: SceneNode | null = null;

  if (data.type === "FRAME" || data.type === "COMPONENT" || data.type === "INSTANCE" || data.type === "COMPONENT_SET") {
    let frame: FrameNode | ComponentNode | InstanceNode | ComponentSetNode;

    if (data.type === "COMPONENT") {
      frame = figma.createComponent();
    } else if (data.type === "INSTANCE") {
      let comp: ComponentNode | null = null;
      if (data.mainComponentKey) {
        try { comp = await figma.importComponentByKeyAsync(data.mainComponentKey); } catch (e) { }
      }
      if (!comp && data.mainComponentId) {
        try {
          const found = figma.getNodeById(data.mainComponentId);
          if (found && found.type === "COMPONENT") comp = found;
        } catch (e) { }
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
    frame.blendMode = data.blendMode as BlendMode;
    frame.visible = data.visible;

    applyFills(frame, data.fills);
    applyStrokes(frame, data);
    applyEffects(frame, data.effects);
    if (data.fillStyleId) try { frame.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { frame.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { frame.effectStyleId = data.effectStyleId; } catch { }

    applyCorners(frame, data);
    applyFrameLayout(frame, data);
    applyBaseLayout(frame, data);
    applyBoundVariables(frame, data.boundVariables);

    parent.appendChild(frame);

    if (data.children) {
      if (frame.type === "INSTANCE") {
        // For instances, we don't create new children.
        // We try to find existing children by name and apply overrides.
        const inst = frame as InstanceNode;
        for (const childData of data.children) {
          const found = inst.children.find(c => c.name === childData.name);
          if (found) {
            await applyOverrides(found, childData);
          }
        }
      } else {
        // For frames/components/fallbacks, we create new children recursively.
        for (const childData of data.children) {
          await restoreNode(childData, frame as any);
        }
      }
    }

    node = frame;
  }

  else if (data.type === "GROUP") {
    const tempFrame = figma.createFrame();
    tempFrame.name = "__temp__";
    tempFrame.resize(data.width, data.height);
    parent.appendChild(tempFrame);

    const childNodes: SceneNode[] = [];
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
      group.blendMode = data.blendMode as BlendMode;
      group.visible = data.visible;
      applyEffects(group, data.effects);
      if (data.effectStyleId) try { group.effectStyleId = data.effectStyleId; } catch { }
      tempFrame.remove();
      node = group;
    } else {
      tempFrame.name = data.name;
      applyFills(tempFrame, data.fills);
      applyStrokes(tempFrame, data);
      applyEffects(tempFrame, data.effects);
      if (data.fillStyleId) try { tempFrame.fillStyleId = data.fillStyleId; } catch { }
      if (data.strokeStyleId) try { tempFrame.strokeStyleId = data.strokeStyleId; } catch { }
      if (data.effectStyleId) try { tempFrame.effectStyleId = data.effectStyleId; } catch { }
      node = tempFrame;
    }
  }

  else if (data.type === "RECTANGLE") {
    const rect = figma.createRectangle();
    rect.name = data.name;
    rect.resize(data.width, data.height);
    rect.x = data.x;
    rect.y = data.y;
    rect.rotation = data.rotation;
    rect.opacity = data.opacity;
    rect.blendMode = data.blendMode as BlendMode;
    rect.visible = data.visible;
    applyFills(rect, data.fills);
    applyStrokes(rect, data);
    applyEffects(rect, data.effects);
    if (data.fillStyleId) try { rect.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { rect.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { rect.effectStyleId = data.effectStyleId; } catch { }

    applyCorners(rect, data);
    applyBaseLayout(rect, data);
    applyBoundVariables(rect, data.boundVariables);
    parent.appendChild(rect);
    node = rect;
  }

  else if (data.type === "ELLIPSE") {
    const el = figma.createEllipse();
    el.name = data.name;
    el.resize(data.width, data.height);
    el.x = data.x;
    el.y = data.y;
    el.rotation = data.rotation;
    el.opacity = data.opacity;
    el.blendMode = data.blendMode as BlendMode;
    el.visible = data.visible;
    applyFills(el, data.fills);
    applyStrokes(el, data);
    applyEffects(el, data.effects);
    if (data.fillStyleId) try { el.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { el.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { el.effectStyleId = data.effectStyleId; } catch { }

    applyBaseLayout(el, data);
    applyBoundVariables(el, data.boundVariables);
    parent.appendChild(el);
    node = el;
  }

  else if (data.type === "LINE") {
    const line = figma.createLine();
    line.name = data.name;
    line.resize(data.width || 100, 0);
    line.x = data.x;
    line.y = data.y;
    line.rotation = data.rotation;
    line.opacity = data.opacity;
    line.blendMode = data.blendMode as BlendMode;
    line.visible = data.visible;
    applyStrokes(line, data);
    applyEffects(line, data.effects);
    if (data.strokeStyleId) try { line.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { line.effectStyleId = data.effectStyleId; } catch { }

    applyBaseLayout(line, data);
    applyBoundVariables(line, data.boundVariables);
    parent.appendChild(line);
    node = line;
  }

  else if (data.type === "TEXT") {
    const text = figma.createText();
    text.name = data.name;
    if (data.fontName) {
      text.fontName = { family: data.fontName.family, style: data.fontName.style };
    }
    if (data.characters !== undefined) text.characters = data.characters;
    if (data.fontSize !== undefined) text.fontSize = data.fontSize;
    if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal as any;
    if (data.textAlignVertical) text.textAlignVertical = data.textAlignVertical as any;
    if (data.letterSpacing) text.letterSpacing = data.letterSpacing as any;
    if (data.lineHeight) text.lineHeight = data.lineHeight as any;
    if (data.textCase) text.textCase = data.textCase as any;
    if (data.textDecoration) text.textDecoration = data.textDecoration as any;
    text.x = data.x;
    text.y = data.y;
    text.rotation = data.rotation;
    text.opacity = data.opacity;
    text.blendMode = data.blendMode as BlendMode;
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
    if (data.fillStyleId) try { text.fillStyleId = data.fillStyleId; } catch { }
    if (data.effectStyleId) try { text.effectStyleId = data.effectStyleId; } catch { }

    applyBaseLayout(text, data);
    applyBoundVariables(text, data.boundVariables);
    parent.appendChild(text);
    node = text;
  }

  else {
    const placeholder = figma.createRectangle();
    placeholder.name = data.name;
    placeholder.resize(Math.max(data.width, 1), Math.max(data.height, 1));
    placeholder.x = data.x;
    placeholder.y = data.y;
    placeholder.opacity = data.opacity;
    placeholder.visible = data.visible;
    applyFills(placeholder, data.fills);
    applyEffects(placeholder, data.effects);
    if (data.fillStyleId) try { placeholder.fillStyleId = data.fillStyleId; } catch { }
    if (data.effectStyleId) try { placeholder.effectStyleId = data.effectStyleId; } catch { }
    parent.appendChild(placeholder);
    node = placeholder;
  }

  return node;
}

/** 
 * Apply visual properties to an existing node (e.g. overrides on an instance child).
 * This skip creation but applies fills, strokes, effects, etc.
 */
async function applyOverrides(node: SceneNode, data: SerializedNode) {
  // Handle Instance Swap if necessary
  if (node.type === "INSTANCE" && data.type === "INSTANCE" && data.mainComponentKey) {
    const inst = node as InstanceNode;
    if (!inst.mainComponent || inst.mainComponent.key !== data.mainComponentKey) {
      try {
        const newComp = await figma.importComponentByKeyAsync(data.mainComponentKey);
        inst.swapComponent(newComp);
      } catch (e) {
        console.warn("[class-manager] could not swap nested instance component:", e);
      }
    }
  }

  // Apply visual properties
  if ("fills" in node) applyFills(node as any, data.fills);
  if ("strokes" in node) applyStrokes(node as any, data);
  if ("effects" in node) applyEffects(node as any, data.effects);

  if ("fillStyleId" in node && data.fillStyleId) try { (node as any).fillStyleId = data.fillStyleId; } catch { }
  if ("strokeStyleId" in node && data.strokeStyleId) try { (node as any).strokeStyleId = data.strokeStyleId; } catch { }
  if ("effectStyleId" in node && data.effectStyleId) try { (node as any).effectStyleId = data.effectStyleId; } catch { }

  if ("opacity" in node && data.opacity !== undefined) (node as any).opacity = data.opacity;
  if ("visible" in node && data.visible !== undefined) node.visible = data.visible;
  if ("blendMode" in node && data.blendMode !== undefined) (node as any).blendMode = data.blendMode;

  // Corners
  if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
    applyCorners(node as any, data);
  }

  // Layout
  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") {
    applyFrameLayout(node as any, data);
    applyBaseLayout(node as any, data);
  }

  // Text
  if (node.type === "TEXT" && data.type === "TEXT") {
    const t = node as TextNode;
    if (data.characters !== undefined) t.characters = data.characters;
    if (data.fontSize !== undefined) t.fontSize = data.fontSize;
    if (data.fontName) {
      await figma.loadFontAsync(data.fontName);
      t.fontName = data.fontName;
    }
  }

  // Recursively apply to children (for nested overrides)
  if (data.children && "children" in node) {
    const children = (node as any).children as SceneNode[];
    for (const childData of data.children) {
      const found = children.find(c => c.name === childData.name);
      if (found) {
        await applyOverrides(found, childData);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage  —  two scopes
//   • personal  → figma.clientStorage  (device-local, private to this user)
//   • global    → figma.clientStorage  (device-local, global across files for this user)
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_STORAGE_KEY = "global-classes";

// ── Personal  (clientStorage) ──────────────────────────────────────────────
async function loadPersonalClasses(): Promise<ClassDefinition[]> {
  const raw = await figma.clientStorage.getAsync(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ClassDefinition[]; } catch { return []; }
}

async function savePersonalClasses(classes: ClassDefinition[]): Promise<void> {
  await figma.clientStorage.setAsync(LOCAL_STORAGE_KEY, JSON.stringify(classes));
}

// ── Global  (clientStorage) ─────────────────────────────────────────────
async function loadGlobalClasses(): Promise<ClassDefinition[]> {
  const raw = await figma.clientStorage.getAsync(GLOBAL_STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as ClassDefinition[]; } catch { return []; }
}

async function saveGlobalClasses(classes: ClassDefinition[]): Promise<void> {
  await figma.clientStorage.setAsync(GLOBAL_STORAGE_KEY, JSON.stringify(classes));
}

// ── Shared helpers ──────────────────────────────────────────────────────────
function mergeClasses(existing: ClassDefinition[], imported: ClassDefinition[]): ClassDefinition[] {
  const map = new Map<string, ClassDefinition>();
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

function generateId(): string {
  return "cls_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main plugin logic
// ─────────────────────────────────────────────────────────────────────────────

figma.showUI(__html__, { width: 365, height: 560, title: "Styles Managers", themeColors: true });

let pinnedNode: any = null;

function getValidNode(sel: readonly SceneNode[]): any {
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
  });
}

// ── Helpers to load/save by scope ──────────────────────────────────────────
async function loadClasses(scope: "global" | "personal"): Promise<ClassDefinition[]> {
  if (scope === "global") return await loadGlobalClasses();
  return await loadPersonalClasses();
}

async function saveClasses(scope: "global" | "personal", classes: ClassDefinition[]): Promise<void> {
  if (scope === "global") await saveGlobalClasses(classes);
  else await savePersonalClasses(classes);
}

function notifyLoaded(scope: "global" | "personal", classes: ClassDefinition[]) {
  figma.ui.postMessage({
    type: scope === "global" ? "global-classes-loaded" : "personal-classes-loaded",
    classes,
  });
}

// ── Init ────────────────────────────────────────────────────────────────────
(async () => {
  const [globalCls, personalCls, githubSettings, globalMeta, personalMeta, savedTheme] = await Promise.all([
    loadClasses("global"),
    loadClasses("personal"),
    figma.clientStorage.getAsync("github-settings"),
    figma.clientStorage.getAsync("global-last-import-sync"),
    figma.clientStorage.getAsync("personal-last-import-sync"),
    figma.clientStorage.getAsync("plugin-theme"),
  ]);
  figma.ui.postMessage({ type: "global-classes-loaded", classes: globalCls });
  figma.ui.postMessage({ type: "personal-classes-loaded", classes: personalCls });
  if (savedTheme) figma.ui.postMessage({ type: "theme-loaded", theme: savedTheme });
  if (globalMeta) figma.ui.postMessage({ type: "meta-updated", scope: "global", date: globalMeta });
  if (personalMeta) figma.ui.postMessage({ type: "meta-updated", scope: "personal", date: personalMeta });
  if (githubSettings) {
    try {
      figma.ui.postMessage({ type: "github-settings-loaded", settings: JSON.parse(githubSettings) });
    } catch { }
  }
  sendSelection();
})();

figma.on("selectionchange", sendSelection);

async function handleInsertClass(id: string, scope: string, dropEvent?: any) {
  try {
    const classes = await loadClasses(scope as any);
    const cls = classes.find((c: ClassDefinition) => c.id === id);
    if (!cls) {
      figma.ui.postMessage({ type: "error", message: "Class not found." });
      return;
    }

    const tree = cls.nodeTree;
    if (!tree) {
      figma.ui.postMessage({ type: "error", message: "Class has no node data." });
      return;
    }

    const fontSet = new Set<string>();
    await collectFonts(tree, fontSet);
    await Promise.all(
      Array.from(fontSet).map((key) => {
        const [family, style] = key.split("::");
        return figma.loadFontAsync({ family, style });
      })
    );

    let parentNode: BaseNode | SceneNode = figma.currentPage;
    if (dropEvent && dropEvent.node && "appendChild" in dropEvent.node) {
      parentNode = dropEvent.node;
    }

    const created = await restoreNode(tree, parentNode as any);
    if (created) {
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
      figma.ui.postMessage({ type: "error", message: "Frame must use Auto Layout—select the frame and enable Auto Layout in the right panel." });
    } else {
      figma.ui.postMessage({ type: "error", message: `Insert failed: ${e}` });
    }
  }
}

(figma as any).on("drop", (event: any) => {
  const { dropMetadata } = event;
  if (dropMetadata && dropMetadata.action === "insert-class") {
    handleInsertClass(dropMetadata.id, dropMetadata.scope, event);
    return false;
  }
});

// ── Message handlers ─────────────────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  // Handle resize messages from the UI
  if (msg.type === "resize") {
    figma.ui.resize(msg.width, msg.height);
    return;
  }

  if (msg.type === "save-theme") {
    await figma.clientStorage.setAsync("plugin-theme", msg.theme);
    return;
  }

  const scope: "global" | "personal" = msg.scope === "personal" ? "personal" : "global";

  if (msg.type === "save-class") {
    try {
      const node = pinnedNode;
      if (!node) {
        figma.ui.postMessage({ type: "error", message: "Select a Frame on the canvas first." });
        return;
      }
      try { node.name; } catch {
        pinnedNode = null;
        figma.ui.postMessage({ type: "error", message: "Selected frame no longer exists." });
        return;
      }

      const nodeTree = serializeNode(node);
      const classes = await loadClasses(scope);
      const now = new Date().toISOString();
      const existingIdx = classes.findIndex((c: ClassDefinition) => c.name === msg.name);

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
          createdAt: now,
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
    classes = classes.filter((c: ClassDefinition) => c.id !== msg.id);
    await saveClasses(scope, classes);
    notifyLoaded(scope, classes);
    figma.ui.postMessage({ type: "success", message: "Preset deleted." });
  }

  if (msg.type === "delete-classes") {
    const ids: string[] = msg.ids || [];
    if (ids.length === 0) return;
    let classes = await loadClasses(scope);
    classes = classes.filter((c: ClassDefinition) => !ids.includes(c.id));
    await saveClasses(scope, classes);
    notifyLoaded(scope, classes);
    figma.ui.postMessage({ type: "success", message: `${ids.length} preset${ids.length > 1 ? "s" : ""} deleted.` });
  }

  if (msg.type === "import-classes") {
    try {
      if (!Array.isArray(msg.classes)) throw new Error("Invalid format");
      const existing = await loadClasses(scope);
      const merged = mergeClasses(existing, msg.classes as ClassDefinition[]);
      await saveClasses(scope, merged);

      const now = new Date().toISOString();
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
      await saveClasses(scope, msg.classes as ClassDefinition[]);

      const now = new Date().toISOString();
      await figma.clientStorage.setAsync(`${scope}-last-import-sync`, now);

      notifyLoaded(scope, msg.classes as ClassDefinition[]);
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

