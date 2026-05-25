// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PluginRGB { r: number; g: number; b: number }
interface PluginRGBA extends PluginRGB { a: number }

interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

interface BasePaintDef {
  type: string;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  boundVariables?: { [property: string]: VariableAlias };
  [property: string]: any;
}

interface SolidPaintDef {
  type: "SOLID";
  color: PluginRGB;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  boundVariables?: { [property: string]: VariableAlias };
}
interface GradientStop { position: number; color: PluginRGBA }
interface GradientPaintDef {
  type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
  gradientTransform?: Transform;
  gradientStops: GradientStop[];
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  boundVariables?: { [property: string]: VariableAlias };
}
type PaintDef = SolidPaintDef | GradientPaintDef | BasePaintDef;

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
  boundVariables?: { [property: string]: VariableAlias | VariableAlias[] | VariableAlias[][] | { [propertyName: string]: VariableAlias } };
  explicitVariableModes?: { [collectionId: string]: string };
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
  variableWidthStrokeProperties?: VariableWidthStrokeProperties | null;
  complexStrokeProperties?: ComplexStrokeProperties;
  effects?: ShadowDef[];
  effectStyleId?: string;
  // Shared corners
  cornerRadius?: number;       // -1 = mixed corners
  cornerSmoothing?: number;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomLeftRadius?: number;
  bottomRightRadius?: number;
  // Vector / icon geometry
  vectorPaths?: VectorPaths;
  vectorNetwork?: VectorNetwork;
  handleMirroring?: HandleMirroring;
  // Shape-specific geometry
  arcData?: ArcData;
  pointCount?: number;
  innerRadius?: number;
  booleanOperation?: "UNION" | "INTERSECT" | "SUBTRACT" | "EXCLUDE";
  // Auto Layout settings
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  layoutAlign?: "MIN" | "CENTER" | "MAX" | "STRETCH" | "INHERIT";
  layoutGrow?: number;
  layoutPositioning?: "AUTO" | "ABSOLUTE";
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  counterAxisSizingMode?: "FIXED" | "AUTO";
  layoutWrap?: "NO_WRAP" | "WRAP";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "BASELINE";
  counterAxisAlignContent?: "AUTO" | "SPACE_BETWEEN";
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
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
  // Constraints
  constraints?: {
    horizontal: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
    vertical: "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE";
  };
  // Component/Instance
  mainComponentKey?: string;
  mainComponentId?: string;
  // Min/Max dimensions
  minWidth?: number | null;
  maxWidth?: number | null;
  minHeight?: number | null;
  maxHeight?: number | null;
}

interface ClassDefinition {
  id: string;
  name: string;
  label: string;
  description?: string;
  nodeTree: SerializedNode;
  version: number;
  updatedAt: string;
  createdAt: string;
}

interface SerializeContext {
  unresolvedMainComponentCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = "local-classes";

// ─────────────────────────────────────────────────────────────────────────────
// Serialization helpers
// ─────────────────────────────────────────────────────────────────────────────

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function serializePaint(paint: Paint): PaintDef {
  return cloneSerializable(paint as any) as PaintDef;
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

function copyPaintBindingAliases(paints: PaintDef[] | undefined, aliases: VariableAlias[] | undefined) {
  if (!paints || !aliases) return;

  paints.forEach((paint, index) => {
    const alias = aliases[index];
    if (!alias) return;
    paint.boundVariables = { ...(paint.boundVariables || {}), color: alias };
  });
}

function getParentLayoutMode(node: SceneNode): "NONE" | "HORIZONTAL" | "VERTICAL" | "GRID" | undefined {
  const parent = node.parent;
  if (!parent || !("layoutMode" in parent)) return undefined;
  return (parent as any).layoutMode;
}

function normalizeLayoutSizing(
  node: SceneNode,
  axis: "HORIZONTAL" | "VERTICAL",
): "FIXED" | "HUG" | "FILL" | undefined {
  if (!("layoutSizingHorizontal" in node) || !("layoutSizingVertical" in node)) return undefined;

  const raw = axis === "HORIZONTAL"
    ? (node as any).layoutSizingHorizontal
    : (node as any).layoutSizingVertical;

  if (!raw) return undefined;

  const parentLayoutMode = getParentLayoutMode(node);
  const hasAutoLayoutParent = parentLayoutMode === "HORIZONTAL" || parentLayoutMode === "VERTICAL";

  if (raw === "FILL") {
    return hasAutoLayoutParent ? "FILL" : "FIXED";
  }

  if (raw === "HUG") {
    if (node.type === "TEXT") return "HUG";

    const nodeIsAutoLayoutFrame =
      node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET";

    if (nodeIsAutoLayoutFrame && (node as FrameNode | ComponentNode | InstanceNode | ComponentSetNode).layoutMode !== "NONE") {
      return "HUG";
    }

    return "FIXED";
  }

  return raw;
}

/** Recursively serialize a node and all its children. */
async function serializeNode(node: SceneNode, context?: SerializeContext): Promise<SerializedNode> {
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
    layoutSizingHorizontal: normalizeLayoutSizing(node, "HORIZONTAL"),
    layoutSizingVertical: normalizeLayoutSizing(node, "VERTICAL"),
    constraints: ("constraints" in node) ? (node as any).constraints : undefined,
    minWidth: ("minWidth" in node) ? (node as any).minWidth : undefined,
    maxWidth: ("maxWidth" in node) ? (node as any).maxWidth : undefined,
    minHeight: ("minHeight" in node) ? (node as any).minHeight : undefined,
    maxHeight: ("maxHeight" in node) ? (node as any).maxHeight : undefined,
  };

  if (node.type === "INSTANCE") {
    const inst = node as InstanceNode;
    try {
      const mainComponent = await inst.getMainComponentAsync();
      if (mainComponent) {
        base.mainComponentKey = mainComponent.key;
        base.mainComponentId = mainComponent.id;
      } else if (context) {
        context.unresolvedMainComponentCount += 1;
      }
    } catch (e) {
      if (context) context.unresolvedMainComponentCount += 1;
      console.warn("[class-manager] could not resolve instance main component while saving:", e);
    }
  }

  // Capture bound variables if they exist
  if ("boundVariables" in node && node.boundVariables) {
    const bv = node.boundVariables;
    if (Object.keys(bv).length > 0) {
      base.boundVariables = cloneSerializable(bv as any);
    }
  }

  if ("explicitVariableModes" in node && node.explicitVariableModes) {
    const modes = node.explicitVariableModes;
    if (Object.keys(modes).length > 0) {
      base.explicitVariableModes = cloneSerializable(modes);
    }
  }

  // Visual properties (most node types)
  if ("fills" in node) {
    base.fills = safeFills(node);
    base.strokes = safeStrokes(node);
    copyPaintBindingAliases(base.fills, (base.boundVariables as any)?.fills);
    copyPaintBindingAliases(base.strokes, (base.boundVariables as any)?.strokes);
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
    if ("variableWidthStrokeProperties" in node) {
      base.variableWidthStrokeProperties = cloneSerializable((node as any).variableWidthStrokeProperties ?? null);
    }
    if ("complexStrokeProperties" in node && (node as any).complexStrokeProperties !== undefined) {
      base.complexStrokeProperties = cloneSerializable((node as any).complexStrokeProperties);
    }
  }

  if ("fillStyleId" in node && node.fillStyleId) base.fillStyleId = node.fillStyleId as string;
  if ("strokeStyleId" in node && node.strokeStyleId) base.strokeStyleId = node.strokeStyleId as string;
  if ("effectStyleId" in node && node.effectStyleId) base.effectStyleId = node.effectStyleId as string;

  if ("effects" in node) {
    base.effects = (node.effects as Effect[]).map(serializeEffect).filter((e): e is ShadowDef => e !== null);
  }

  if ("cornerRadius" in node) {
    base.cornerRadius = safeCornerRadius(node);
  }
  if ("cornerSmoothing" in node) {
    const smoothing = (node as any).cornerSmoothing;
    if (typeof smoothing !== "symbol") base.cornerSmoothing = smoothing;
  }

  // Rectangle-specific corners
  if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    const r = node as any;
    base.topLeftRadius = r.topLeftRadius;
    base.topRightRadius = r.topRightRadius;
    base.bottomLeftRadius = r.bottomLeftRadius;
    base.bottomRightRadius = r.bottomRightRadius;
  }

  if ("vectorPaths" in node) {
    base.vectorPaths = cloneSerializable((node as VectorNode).vectorPaths);
  }
  if ("vectorNetwork" in node) {
    base.vectorNetwork = cloneSerializable((node as VectorNode).vectorNetwork);
  }
  if ("handleMirroring" in node) {
    const handleMirroring = (node as any).handleMirroring;
    if (typeof handleMirroring !== "symbol") base.handleMirroring = handleMirroring;
  }

  if (node.type === "ELLIPSE") {
    base.arcData = cloneSerializable((node as EllipseNode).arcData);
  }

  if (node.type === "POLYGON") {
    base.pointCount = (node as PolygonNode).pointCount;
  }

  if (node.type === "STAR") {
    const star = node as StarNode;
    base.pointCount = star.pointCount;
    base.innerRadius = star.innerRadius;
  }

  if (node.type === "BOOLEAN_OPERATION") {
    const bool = node as BooleanOperationNode;
    base.booleanOperation = bool.booleanOperation;
    base.children = await Promise.all(bool.children.map((child) => serializeNode(child, context)));
  }

  // Frame / component / instance / component set layout
  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    const f = node as FrameNode | ComponentNode | InstanceNode | ComponentSetNode;
    base.layoutMode = (f.layoutMode === "GRID" ? "NONE" : f.layoutMode) as any;
    base.primaryAxisSizingMode = f.primaryAxisSizingMode;
    base.counterAxisSizingMode = f.counterAxisSizingMode;
    base.layoutWrap = f.layoutWrap;
    base.primaryAxisAlignItems = f.primaryAxisAlignItems;
    base.counterAxisAlignItems = f.counterAxisAlignItems as any;
    base.counterAxisAlignContent = f.counterAxisAlignContent;
    base.paddingTop = f.paddingTop;
    base.paddingBottom = f.paddingBottom;
    base.paddingLeft = f.paddingLeft;
    base.paddingRight = f.paddingRight;
    base.itemSpacing = f.itemSpacing;
    base.counterAxisSpacing = f.counterAxisSpacing ?? undefined;
    base.itemReverseZIndex = f.itemReverseZIndex;
    base.strokesIncludedInLayout = f.strokesIncludedInLayout;
    base.clipsContent = f.clipsContent;
    base.children = await Promise.all(f.children.map((child) => serializeNode(child, context)));
  }

  // Group
  if (node.type === "GROUP") {
    const g = node as GroupNode;
    base.children = await Promise.all(g.children.map((child) => serializeNode(child, context)));
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

function getAxisSizingMode(
  data: SerializedNode,
  axis: "width" | "height",
): "FIXED" | "AUTO" | undefined {
  if (!data.layoutMode || data.layoutMode === "NONE") return undefined;

  if (data.layoutMode === "HORIZONTAL") {
    return axis === "width" ? data.primaryAxisSizingMode : data.counterAxisSizingMode;
  }

  return axis === "width" ? data.counterAxisSizingMode : data.primaryAxisSizingMode;
}

function inferLegacyLayoutSizing(
  node: any,
  data: SerializedNode,
  axis: "HORIZONTAL" | "VERTICAL",
): "FIXED" | "HUG" | "FILL" | undefined {
  const parent = node.parent as SceneNode | BaseNode | null;
  const parentLayoutMode = parent && "layoutMode" in parent ? (parent as any).layoutMode : undefined;

  if (parentLayoutMode === "HORIZONTAL") {
    if (axis === "HORIZONTAL" && data.layoutGrow === 1) return "FILL";
    if (axis === "VERTICAL" && data.layoutAlign === "STRETCH") return "FILL";
  }

  if (parentLayoutMode === "VERTICAL") {
    if (axis === "HORIZONTAL" && data.layoutAlign === "STRETCH") return "FILL";
    if (axis === "VERTICAL" && data.layoutGrow === 1) return "FILL";
  }

  if (data.type === "TEXT") {
    return undefined;
  }

  const nodeIsAutoLayoutFrame =
    data.type === "FRAME" || data.type === "COMPONENT" || data.type === "INSTANCE" || data.type === "COMPONENT_SET";

  if (!nodeIsAutoLayoutFrame || !data.layoutMode || data.layoutMode === "NONE") {
    return "FIXED";
  }

  const sizingMode = axis === "HORIZONTAL"
    ? getAxisSizingMode(data, "width")
    : getAxisSizingMode(data, "height");

  if (sizingMode === "AUTO") return "HUG";
  if (sizingMode === "FIXED") return "FIXED";
  return undefined;
}

function getEffectiveLayoutSizing(
  node: any,
  data: SerializedNode,
  axis: "HORIZONTAL" | "VERTICAL",
): "FIXED" | "HUG" | "FILL" | undefined {
  if (axis === "HORIZONTAL" && data.layoutSizingHorizontal) {
    return data.layoutSizingHorizontal;
  }

  if (axis === "VERTICAL" && data.layoutSizingVertical) {
    return data.layoutSizingVertical;
  }

  return inferLegacyLayoutSizing(node, data, axis);
}

function applyLayoutSizing(node: any, data: SerializedNode) {
  try {
    const horizontal = getEffectiveLayoutSizing(node, data, "HORIZONTAL");
    if (horizontal !== undefined) {
      node.layoutSizingHorizontal = horizontal;
    }
  } catch (e) { }

  try {
    const vertical = getEffectiveLayoutSizing(node, data, "VERTICAL");
    if (vertical !== undefined) {
      node.layoutSizingVertical = vertical;
    }
  } catch (e) { }
}

function seedSavedSize(node: any, data: SerializedNode) {
  if (typeof node.resize !== "function") return;
  if (data.width === undefined || data.height === undefined) return;

  try {
    node.resize(Math.max(data.width, 1), Math.max(data.height, 1));
  } catch (e) { }
}

function applyNodeResize(node: any, data: SerializedNode) {
  if (typeof node.resize !== "function") return;
  if (data.width === undefined || data.height === undefined) return;

  const horizontalSizing = getEffectiveLayoutSizing(node, data, "HORIZONTAL");
  const verticalSizing = getEffectiveLayoutSizing(node, data, "VERTICAL");

  const preserveWidth =
    horizontalSizing === "HUG" ||
    horizontalSizing === "FILL" ||
    getAxisSizingMode(data, "width") === "AUTO";
  const preserveHeight =
    verticalSizing === "HUG" ||
    verticalSizing === "FILL" ||
    getAxisSizingMode(data, "height") === "AUTO";

  if (!preserveWidth && !preserveHeight) {
    node.resize(data.width, data.height);
    return;
  }

  const nextWidth = preserveWidth ? Math.max(node.width ?? 1, 1) : data.width;
  const nextHeight = preserveHeight ? Math.max(node.height ?? 1, 1) : data.height;
  node.resize(nextWidth, nextHeight);
}

function applyBaseLayout(node: any, data: SerializedNode) {
  try {
    // 1. Set Positioning Mode first (Absolute vs Auto)
    // This defines how x, y, layoutAlign etc. are interpreted
    if (data.layoutPositioning !== undefined) node.layoutPositioning = data.layoutPositioning;

    // 2. Restore the actual Figma sizing mode when available.
    applyLayoutSizing(node, data);

    // 3. Set Alignment and Grow
    if (data.layoutAlign !== undefined) node.layoutAlign = data.layoutAlign;
    if (data.layoutGrow !== undefined) node.layoutGrow = data.layoutGrow;
    if (data.constraints !== undefined) node.constraints = data.constraints;

    // 4. Only fixed axes should be explicitly resized.
    applyNodeResize(node, data);

    // 5. Set Coordinates & Rotation
    if (data.rotation !== undefined) node.rotation = data.rotation;
    if (data.x !== undefined) node.x = data.x;
    if (data.y !== undefined) node.y = data.y;

    // 6. Preserve min/max constraints after sizing mode is applied.
    try {
      if (data.minWidth !== undefined) node.minWidth = data.minWidth;
      if (data.maxWidth !== undefined) node.maxWidth = data.maxWidth;
      if (data.minHeight !== undefined) node.minHeight = data.minHeight;
      if (data.maxHeight !== undefined) node.maxHeight = data.maxHeight;
    } catch (e) { }

  } catch (e) {
    // console.warn(`[class-manager] failed to apply base layout for ${node.name}:`, e);
  }
}

async function getVariableForAlias(alias: VariableAlias | undefined): Promise<Variable | null> {
  if (!alias || !alias.id) return null;
  try {
    return await figma.variables.getVariableByIdAsync(alias.id);
  } catch (e) {
    console.warn(`[class-manager] could not resolve variable ${alias.id}:`, e);
    return null;
  }
}

async function applyExplicitVariableModes(node: SceneNode, explicitVariableModes: SerializedNode["explicitVariableModes"]) {
  if (!explicitVariableModes || !("setExplicitVariableModeForCollection" in node)) return;

  for (const [collectionId, modeId] of Object.entries(explicitVariableModes)) {
    try {
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection) {
        (node as SceneNode & ExplicitVariableModesMixin).setExplicitVariableModeForCollection(collection, modeId);
      }
    } catch (e) {
      console.warn(`[class-manager] could not apply variable mode ${collectionId}:`, e);
    }
  }
}

async function applyBoundVariables(node: SceneNode, boundVariables: SerializedNode["boundVariables"]) {
  if (!boundVariables) return;
  const textVariableFields = new Set([
    "fontFamily",
    "fontSize",
    "fontStyle",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "paragraphSpacing",
    "paragraphIndent",
  ]);

  for (const [prop, value] of Object.entries(boundVariables)) {
    try {
      if (Array.isArray(value)) {
        if (!textVariableFields.has(prop)) continue;
        if (value.length === 0) continue;
        const aliases = value.filter((alias): alias is VariableAlias => !Array.isArray(alias) && !!alias && typeof alias.id === "string");
        if (aliases.length !== value.length) continue;
        const firstAlias = aliases[0];
        const allSame = aliases.every((alias) => alias.id === firstAlias.id);
        if (!allSame) continue;

        const variable = await getVariableForAlias(firstAlias);
        if (variable && typeof (node as any).setBoundVariable === "function") {
          (node as any).setBoundVariable(prop, variable);
        }
      } else {
        const alias = value as VariableAlias;
        const variable = await getVariableForAlias(alias);
        if (variable && typeof (node as any).setBoundVariable === "function") {
          (node as any).setBoundVariable(prop, variable);
        }
      }
    } catch (e) {
      console.warn(`[class-manager] could not bind ${prop}:`, e);
    }
  }
}

async function applyPaint(def: PaintDef): Promise<Paint | null> {
  let paint: any = null;
  if (def.type === "SOLID") {
    const d = def as SolidPaintDef;
    paint = {
      type: "SOLID",
      color: d.color,
      opacity: d.opacity ?? 1,
      visible: d.visible,
      blendMode: d.blendMode,
    };
  } else if (
    def.type === "GRADIENT_LINEAR" ||
    def.type === "GRADIENT_RADIAL" ||
    def.type === "GRADIENT_ANGULAR" ||
    def.type === "GRADIENT_DIAMOND"
  ) {
    const d = def as GradientPaintDef;
    paint = {
      type: d.type,
      gradientTransform: d.gradientTransform ?? [[1, 0, 0], [0, 1, 0]],
      gradientStops: d.gradientStops,
      opacity: d.opacity,
      visible: d.visible,
      blendMode: d.blendMode,
    };
  } else {
    paint = cloneSerializable(def) as Paint;
    delete paint.boundVariables;
  }

  if (paint && def.boundVariables) {
    for (const [prop, value] of Object.entries(def.boundVariables)) {
      try {
        const variable = await getVariableForAlias(value as VariableAlias);
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

async function applyPaintList(node: any, property: "fills" | "strokes", defs: PaintDef[] | undefined) {
  if (!defs) return;
  const paints = (await Promise.all(defs.map(applyPaint))).filter((p): p is Paint => p !== null);
  const asyncSetter = property === "fills" ? "setFillsAsync" : "setStrokesAsync";

  if (typeof node[asyncSetter] === "function") {
    await node[asyncSetter](paints);
  } else {
    node[property] = paints;
  }
}

async function applyFills(node: any, fills: PaintDef[] | undefined) {
  if (!fills) return;
  try {
    await applyPaintList(node, "fills", fills);
  } catch (e) { }
}

async function applyStrokes(node: any, data: SerializedNode) {
  if (!data.strokes) return;
  try {
    await applyPaintList(node, "strokes", data.strokes);

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
    if (data.complexStrokeProperties !== undefined && "complexStrokeProperties" in node) {
      try {
        const props = data.complexStrokeProperties;
        if (props.type === "BRUSH") {
          if (props.brushName === "CUSTOM") throw new Error("custom brushes cannot be restored through the plugin API");
          await figma.loadBrushesAsync(props.brushType);
        }
        node.complexStrokeProperties = props;
      } catch (e) {
        console.warn(`[class-manager] could not restore complex stroke on ${data.name}:`, e);
      }
    }
    if (data.variableWidthStrokeProperties !== undefined && "variableWidthStrokeProperties" in node) {
      try {
        node.variableWidthStrokeProperties = data.variableWidthStrokeProperties;
      } catch (e) {
        console.warn(`[class-manager] could not restore variable-width stroke on ${data.name}:`, e);
      }
    }
  } catch (e) { }
}

async function applyEffects(node: any, effects: ShadowDef[] | undefined) {
  if (!effects) return;
  node.effects = await Promise.all(effects.map(async (e) => {
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
          const variable = await getVariableForAlias(value as VariableAlias);
          if (variable) {
            effect = figma.variables.setBoundVariableForEffect(effect, prop as any, variable);
          }
        } catch (err) {
          console.warn(`[class-manager] could not bind effect property ${prop}:`, err);
        }
      }
    }
    return effect;
  }));
}

async function applyStyleIds(node: any, data: SerializedNode) {
  try {
    if (data.fillStyleId && "fillStyleId" in node) {
      if (typeof node.setFillStyleIdAsync === "function") await node.setFillStyleIdAsync(data.fillStyleId);
      else node.fillStyleId = data.fillStyleId;
    }
  } catch (e) { }

  try {
    if (data.strokeStyleId && "strokeStyleId" in node) {
      if (typeof node.setStrokeStyleIdAsync === "function") await node.setStrokeStyleIdAsync(data.strokeStyleId);
      else node.strokeStyleId = data.strokeStyleId;
    }
  } catch (e) { }

  try {
    if (data.effectStyleId && "effectStyleId" in node) {
      if (typeof node.setEffectStyleIdAsync === "function") await node.setEffectStyleIdAsync(data.effectStyleId);
      else node.effectStyleId = data.effectStyleId;
    }
  } catch (e) { }
}

function applyCorners(node: any, data: SerializedNode) {
  const cr = data.cornerRadius;
  try {
    if (cr !== undefined && cr >= 0 && (data.topLeftRadius === undefined || cr === data.topLeftRadius)) {
      node.cornerRadius = cr;
    } else {
      if (data.topLeftRadius !== undefined) node.topLeftRadius = data.topLeftRadius;
      if (data.topRightRadius !== undefined) node.topRightRadius = data.topRightRadius;
      if (data.bottomLeftRadius !== undefined) node.bottomLeftRadius = data.bottomLeftRadius;
      if (data.bottomRightRadius !== undefined) node.bottomRightRadius = data.bottomRightRadius;
    }
    if (data.cornerSmoothing !== undefined && "cornerSmoothing" in node) {
      node.cornerSmoothing = data.cornerSmoothing;
    }
  } catch (e) { }
}

async function applyVectorGeometry(node: any, data: SerializedNode) {
  try {
    if (data.vectorNetwork && typeof node.setVectorNetworkAsync === "function") {
      await node.setVectorNetworkAsync(data.vectorNetwork as VectorNetwork);
    } else if (data.vectorPaths && "vectorPaths" in node) {
      node.vectorPaths = data.vectorPaths as VectorPaths;
    }

    if (data.handleMirroring && "handleMirroring" in node) {
      node.handleMirroring = data.handleMirroring;
    }
  } catch (e) {
    console.warn(`[class-manager] could not restore vector geometry for ${data.name}:`, e);
  }
}

function applyFrameLayout(frame: FrameNode | ComponentNode | InstanceNode | ComponentSetNode, data: SerializedNode) {
  try { if (data.layoutMode !== undefined) (frame as any).layoutMode = data.layoutMode; } catch (e) { }

  // These properties only exist when Auto Layout is enabled (horizontal or vertical)
  if (data.layoutMode && data.layoutMode !== "NONE") {
    try { if (data.primaryAxisSizingMode) frame.primaryAxisSizingMode = data.primaryAxisSizingMode; } catch (e) { }
    try { if (data.counterAxisSizingMode) frame.counterAxisSizingMode = data.counterAxisSizingMode; } catch (e) { }
    try { if (data.layoutWrap) frame.layoutWrap = data.layoutWrap; } catch (e) { }
    try { if (data.primaryAxisAlignItems) frame.primaryAxisAlignItems = data.primaryAxisAlignItems; } catch (e) { }
    try { if (data.counterAxisAlignItems) frame.counterAxisAlignItems = data.counterAxisAlignItems as any; } catch (e) { }
    try { if (data.counterAxisAlignContent) frame.counterAxisAlignContent = data.counterAxisAlignContent; } catch (e) { }

    try { if (data.itemSpacing !== undefined) frame.itemSpacing = data.itemSpacing; } catch (e) { }
    try { if (data.counterAxisSpacing !== undefined) frame.counterAxisSpacing = data.counterAxisSpacing; } catch (e) { }
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
async function restoreNode(data: SerializedNode, parent: FrameNode | ComponentNode | GroupNode | BooleanOperationNode | PageNode): Promise<SceneNode | null> {
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
          const found = await figma.getNodeByIdAsync(data.mainComponentId);
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
    frame.x = data.x;
    frame.y = data.y;
    frame.rotation = data.rotation;
    frame.opacity = data.opacity;
    frame.blendMode = data.blendMode as BlendMode;
    frame.visible = data.visible;

    await applyFills(frame, data.fills);
    await applyStrokes(frame, data);
    await applyEffects(frame, data.effects);
    if (data.fillStyleId) try { frame.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { frame.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { frame.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(frame, data);

    applyCorners(frame, data);
    seedSavedSize(frame, data);
    applyFrameLayout(frame, data);
    parent.appendChild(frame);
    applyBaseLayout(frame, data);
    await applyExplicitVariableModes(frame, data.explicitVariableModes);
    await applyBoundVariables(frame, data.boundVariables);


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

    // Re-apply layout after children exist so Hug contents can resolve from
    // the final restored child tree, including nested Hug frames.
    applyFrameLayout(frame, data);
    applyBaseLayout(frame, data);

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
      await applyEffects(group, data.effects);
      if (data.effectStyleId) try { group.effectStyleId = data.effectStyleId; } catch { }
      await applyStyleIds(group, data);
      await applyExplicitVariableModes(group, data.explicitVariableModes);
      await applyBoundVariables(group, data.boundVariables);
      tempFrame.remove();
      node = group;
    } else {
      tempFrame.name = data.name;
      await applyFills(tempFrame, data.fills);
      await applyStrokes(tempFrame, data);
      await applyEffects(tempFrame, data.effects);
      if (data.fillStyleId) try { tempFrame.fillStyleId = data.fillStyleId; } catch { }
      if (data.strokeStyleId) try { tempFrame.strokeStyleId = data.strokeStyleId; } catch { }
      if (data.effectStyleId) try { tempFrame.effectStyleId = data.effectStyleId; } catch { }
      await applyStyleIds(tempFrame, data);
      await applyExplicitVariableModes(tempFrame, data.explicitVariableModes);
      await applyBoundVariables(tempFrame, data.boundVariables);
      node = tempFrame;
    }
  }

  else if (data.type === "BOOLEAN_OPERATION") {
    const bool = figma.createBooleanOperation();
    bool.name = data.name;
    bool.booleanOperation = data.booleanOperation || "UNION";
    bool.x = data.x;
    bool.y = data.y;
    bool.rotation = data.rotation;
    bool.opacity = data.opacity;
    bool.blendMode = data.blendMode as BlendMode;
    bool.visible = data.visible;
    parent.appendChild(bool);

    if (data.children) {
      for (const childData of data.children) {
        await restoreNode(childData, bool);
      }
    }

    await applyFills(bool, data.fills);
    await applyStrokes(bool, data);
    await applyEffects(bool, data.effects);
    if (data.fillStyleId) try { bool.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { bool.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { bool.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(bool, data);

    applyCorners(bool, data);
    applyBaseLayout(bool, data);
    await applyExplicitVariableModes(bool, data.explicitVariableModes);
    await applyBoundVariables(bool, data.boundVariables);

    node = bool;
  }

  else if (data.type === "VECTOR") {
    const vector = figma.createVector();
    vector.name = data.name;
    vector.x = data.x;
    vector.y = data.y;
    vector.rotation = data.rotation;
    vector.opacity = data.opacity;
    vector.blendMode = data.blendMode as BlendMode;
    vector.visible = data.visible;

    await applyVectorGeometry(vector, data);
    if (data.fills && data.fills.length > 0) await applyFills(vector, data.fills);
    if (data.strokes && data.strokes.length > 0) await applyStrokes(vector, data);
    await applyEffects(vector, data.effects);
    if (data.fillStyleId) try { vector.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { vector.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { vector.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(vector, data);

    applyCorners(vector, data);
    parent.appendChild(vector);
    applyBaseLayout(vector, data);
    await applyExplicitVariableModes(vector, data.explicitVariableModes);
    await applyBoundVariables(vector, data.boundVariables);

    node = vector;
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
    await applyFills(rect, data.fills);
    await applyStrokes(rect, data);
    await applyEffects(rect, data.effects);
    if (data.fillStyleId) try { rect.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { rect.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { rect.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(rect, data);

    applyCorners(rect, data);
    parent.appendChild(rect);
    applyBaseLayout(rect, data);
    await applyExplicitVariableModes(rect, data.explicitVariableModes);
    await applyBoundVariables(rect, data.boundVariables);

    node = rect;
  }

  else if (data.type === "ELLIPSE") {
    const el = figma.createEllipse();
    el.name = data.name;
    el.resize(data.width, data.height);
    if (data.arcData) try { el.arcData = data.arcData; } catch { }
    el.x = data.x;
    el.y = data.y;
    el.rotation = data.rotation;
    el.opacity = data.opacity;
    el.blendMode = data.blendMode as BlendMode;
    el.visible = data.visible;
    await applyFills(el, data.fills);
    await applyStrokes(el, data);
    await applyEffects(el, data.effects);
    if (data.fillStyleId) try { el.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { el.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { el.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(el, data);

    parent.appendChild(el);
    applyBaseLayout(el, data);
    await applyExplicitVariableModes(el, data.explicitVariableModes);
    await applyBoundVariables(el, data.boundVariables);

    node = el;
  }

  else if (data.type === "POLYGON") {
    const polygon = figma.createPolygon();
    polygon.name = data.name;
    if (data.pointCount !== undefined) polygon.pointCount = data.pointCount;
    polygon.resize(data.width, data.height);
    polygon.x = data.x;
    polygon.y = data.y;
    polygon.rotation = data.rotation;
    polygon.opacity = data.opacity;
    polygon.blendMode = data.blendMode as BlendMode;
    polygon.visible = data.visible;
    await applyFills(polygon, data.fills);
    await applyStrokes(polygon, data);
    await applyEffects(polygon, data.effects);
    if (data.fillStyleId) try { polygon.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { polygon.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { polygon.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(polygon, data);

    applyCorners(polygon, data);
    parent.appendChild(polygon);
    applyBaseLayout(polygon, data);
    await applyExplicitVariableModes(polygon, data.explicitVariableModes);
    await applyBoundVariables(polygon, data.boundVariables);

    node = polygon;
  }

  else if (data.type === "STAR") {
    const star = figma.createStar();
    star.name = data.name;
    if (data.pointCount !== undefined) star.pointCount = data.pointCount;
    if (data.innerRadius !== undefined) star.innerRadius = data.innerRadius;
    star.resize(data.width, data.height);
    star.x = data.x;
    star.y = data.y;
    star.rotation = data.rotation;
    star.opacity = data.opacity;
    star.blendMode = data.blendMode as BlendMode;
    star.visible = data.visible;
    await applyFills(star, data.fills);
    await applyStrokes(star, data);
    await applyEffects(star, data.effects);
    if (data.fillStyleId) try { star.fillStyleId = data.fillStyleId; } catch { }
    if (data.strokeStyleId) try { star.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { star.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(star, data);

    applyCorners(star, data);
    parent.appendChild(star);
    applyBaseLayout(star, data);
    await applyExplicitVariableModes(star, data.explicitVariableModes);
    await applyBoundVariables(star, data.boundVariables);

    node = star;
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
    await applyStrokes(line, data);
    await applyEffects(line, data.effects);
    if (data.strokeStyleId) try { line.strokeStyleId = data.strokeStyleId; } catch { }
    if (data.effectStyleId) try { line.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(line, data);

    parent.appendChild(line);
    applyBaseLayout(line, data);
    await applyExplicitVariableModes(line, data.explicitVariableModes);
    await applyBoundVariables(line, data.boundVariables);

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
    await applyFills(text, data.fills);
    await applyEffects(text, data.effects);
    if (data.fillStyleId) try { text.fillStyleId = data.fillStyleId; } catch { }
    if (data.effectStyleId) try { text.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(text, data);

    parent.appendChild(text);
    applyBaseLayout(text, data);
    await applyExplicitVariableModes(text, data.explicitVariableModes);
    await applyBoundVariables(text, data.boundVariables);

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
    await applyFills(placeholder, data.fills);
    await applyEffects(placeholder, data.effects);
    if (data.fillStyleId) try { placeholder.fillStyleId = data.fillStyleId; } catch { }
    if (data.effectStyleId) try { placeholder.effectStyleId = data.effectStyleId; } catch { }
    await applyStyleIds(placeholder, data);
    parent.appendChild(placeholder);
    await applyExplicitVariableModes(placeholder, data.explicitVariableModes);
    await applyBoundVariables(placeholder, data.boundVariables);
    node = placeholder;
  }

  return node;
}

/** 
 * Apply visual properties to an existing node (e.g. overrides on an instance child).
 * This skip creation but applies fills, strokes, effects, etc.
 */
async function applyOverrides(node: SceneNode, data: SerializedNode) {
  // 1. Handle Instance Swapping
  if (node.type === "INSTANCE" && data.type === "INSTANCE" && data.mainComponentKey) {
    const inst = node as InstanceNode;
    const currentMainComponent = await inst.getMainComponentAsync();
    if (!currentMainComponent || currentMainComponent.key !== data.mainComponentKey) {
      try {
        const newComp = await figma.importComponentByKeyAsync(data.mainComponentKey);
        inst.swapComponent(newComp);
      } catch (e) {
        console.warn("[class-manager] could not swap nested instance component:", e);
      }
    }
  }

  // 2. Apply Visual Properties (Fills, Strokes, Effects)
  if ("fills" in node) await applyFills(node as any, data.fills);
  if ("strokes" in node) await applyStrokes(node as any, data);
  if ("effects" in node) await applyEffects(node as any, data.effects);

  if ("fillStyleId" in node && data.fillStyleId) try { (node as any).fillStyleId = data.fillStyleId; } catch { }
  if ("strokeStyleId" in node && data.strokeStyleId) try { (node as any).strokeStyleId = data.strokeStyleId; } catch { }
  if ("effectStyleId" in node && data.effectStyleId) try { (node as any).effectStyleId = data.effectStyleId; } catch { }
  await applyStyleIds(node as any, data);

  if (data.type === "VECTOR" && "vectorPaths" in node) {
    await applyVectorGeometry(node as any, data);
  }
  if (node.type === "ELLIPSE" && data.arcData) {
    try { (node as EllipseNode).arcData = data.arcData; } catch { }
  }
  if (node.type === "POLYGON" && data.pointCount !== undefined) {
    try { (node as PolygonNode).pointCount = data.pointCount; } catch { }
  }
  if (node.type === "STAR") {
    try { if (data.pointCount !== undefined) (node as StarNode).pointCount = data.pointCount; } catch { }
    try { if (data.innerRadius !== undefined) (node as StarNode).innerRadius = data.innerRadius; } catch { }
  }
  if (node.type === "BOOLEAN_OPERATION" && data.booleanOperation) {
    try { (node as BooleanOperationNode).booleanOperation = data.booleanOperation; } catch { }
  }

  if ("opacity" in node && data.opacity !== undefined) (node as any).opacity = data.opacity;
  if ("visible" in node && data.visible !== undefined) node.visible = data.visible;
  if ("blendMode" in node && data.blendMode !== undefined) (node as any).blendMode = data.blendMode;

  // 3. Apply Corner radius
  if ("cornerRadius" in node) {
    applyCorners(node as any, data);
  }

  // 4. Apply Layout & Positioning (Crucial for "Alignment Position")
  // We call this on ALL nodes because even simple Rectangles can have layoutAlign/Pos overrides
  applyBaseLayout(node as any, data);
  await applyExplicitVariableModes(node, data.explicitVariableModes);
  await applyBoundVariables(node, data.boundVariables);

  // Apply Frame-specific layout (Auto Layout props)
  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "COMPONENT_SET") {
    applyFrameLayout(node as any, data);
  }

  // 5. Apply Text-specific overrides
  if (node.type === "TEXT" && data.type === "TEXT") {
    const t = node as TextNode;
    if (data.characters !== undefined) t.characters = data.characters;
    if (data.fontSize !== undefined) t.fontSize = data.fontSize;
    if (data.fontName) {
      try {
        await figma.loadFontAsync(data.fontName);
        t.fontName = data.fontName;
      } catch (e) { }
    }
    if (data.textAlignHorizontal) t.textAlignHorizontal = data.textAlignHorizontal as any;
    if (data.textAlignVertical) t.textAlignVertical = data.textAlignVertical as any;
    if (data.letterSpacing) t.letterSpacing = data.letterSpacing as any;
    if (data.lineHeight) t.lineHeight = data.lineHeight as any;
  }

  // 6. Recursively apply to children (Nested Overrides)
  if (data.children && "children" in node) {
    const children = Array.from((node as any).children as SceneNode[]);
    const matchedIndices = new Set<number>();

    for (const childData of data.children) {
      // Heuristic: match by name, ensuring we don't match the same node twice
      const foundIdx = children.findIndex((c, i) => c.name === childData.name && !matchedIndices.has(i));
      if (foundIdx >= 0) {
        matchedIndices.add(foundIdx);
        await applyOverrides(children[foundIdx], childData);
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

figma.showUI(__html__, { width: 380, height: 684, title: "Styles Managers", themeColors: true });

let pinnedNode: any = null;

function getValidNode(sel: readonly SceneNode[]): any {
  const node = sel[0];
  if (!node) return null;
  // SceneNode already excludes PAGE and DOCUMENT. 
  // We just filter out SLICE as it's not a typical "styleable" node.
  if (node.type !== "SLICE") {
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
    parentName: (node && node.parent && node.parent.type !== "PAGE") ? node.parent.name : "",
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
      // Set the name of the root node to match the class metadata
      // This ensures future identification via the "Label Name (Label Name)" pattern
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

      const serializeContext: SerializeContext = { unresolvedMainComponentCount: 0 };
      const nodeTree = await serializeNode(node, serializeContext);
      const classes = await loadClasses(scope);
      const now = new Date().toISOString();
      const existingIdx = classes.findIndex((c: ClassDefinition) => c.name === msg.name && (c.label || "") === (msg.label || ""));

      if (existingIdx >= 0) {
        classes[existingIdx].nodeTree = nodeTree;
        // Update label (if user changed it, although findIndex now matches exactly, 
        // this allows for consistency in case of logic changes)
        classes[existingIdx].label = msg.label || "";
        classes[existingIdx].description = msg.description || "";
        classes[existingIdx].version = classes[existingIdx].version + 1;
        classes[existingIdx].updatedAt = now;
      } else {
        classes.unshift({
          id: generateId(),
          name: msg.name,
          label: msg.label || "",
          description: msg.description || "",
          nodeTree,
          version: 1,
          updatedAt: now,
          createdAt: now,
        });
      }

      await saveClasses(scope, classes);
      notifyLoaded(scope, classes);
      figma.ui.postMessage({ type: "success", message: `Preset "${msg.name}" saved (${scope}).` });
      if (serializeContext.unresolvedMainComponentCount > 0) {
        const count = serializeContext.unresolvedMainComponentCount;
        figma.ui.postMessage({
          type: "warning",
          message: `${count} instance component reference${count > 1 ? "s were" : " was"} unavailable while saving. Those instances may restore as frames.`,
        });
      }
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
