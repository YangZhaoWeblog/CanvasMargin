import { nanoid } from "nanoid";
import { buildMarkTag } from "./models";

export interface AnnotationResult {
  newDoc: string;
  ancId: string;
  selectedText: string;
}

/** 1. 把 Markdown 选区替换成带唯一 anchor 的 <mark>。 */
export function annotateSelection(
  doc: string,
  from: number,
  to: number,
  color: string,
): AnnotationResult {
  // 1. 先按 offset 取出用户选中的原文。
  const selectedText = doc.slice(from, to);
  // 2. 每个 mark 都生成独立 nanoid，后续 Canvas 节点靠它关联。
  const ancId = nanoid();
  // 3. 统一交给 models 构造规范 mark，避免格式散落在各处。
  const markTag = buildMarkTag(selectedText, color, ancId);
  // 4. 用 mark 替换原选区，其余文档内容保持不变。
  const newDoc = doc.slice(0, from) + markTag + doc.slice(to);
  return { newDoc, ancId, selectedText };
}

/**
 * 2. 判断选区是否碰到已有 mark。
 * 返回 true 表示不要再次摘录，避免 mark 嵌套或破坏标签。
 */
export function shouldSkipAnnotation(doc: string, from: number, to: number): boolean {
  // 1. 只需要识别 <mark ...>，内部新旧 anchor 格式都可以覆盖。
  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    // 2. 找到一个完整 mark 的开标签、正文、闭标签范围。
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // 3. 选区完全落在 mark 正文里，也算已有摘录。
    if (from >= openEnd && to <= closeStart) return true;

    // 4. 选区碰到开标签，会破坏 HTML，必须跳过。
    if (from < openEnd && to > openStart) return true;

    // 5. 选区碰到闭标签，也必须跳过。
    if (from < closeEnd && to > closeStart) return true;
  }

  return false;
}

export interface RemoveResult {
  newDoc: string;
  from: number; // 取消后纯文本在新文档里的开始位置。
  to: number;   // 取消后纯文本在新文档里的结束位置。
}

/**
 * 3. 找到包含光标/选区的 mark，并去掉外层标签。
 * 找不到就返回 null，让调用方显示提示。
 */
export function removeAnnotation(doc: string, from: number, to: number): RemoveResult | null {
  // 1. 和跳过判断一样，先按完整 <mark> 范围扫描。
  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    // 2. 定位当前 mark 的开标签、正文、闭标签边界。
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // 3. 光标在正文里，或选区碰到标签本身，都认为用户要取消这个 mark。
    const withinInner = from >= openEnd && to <= closeStart;
    const overlapsTag = from < closeEnd && to > openStart;
    if (withinInner || overlapsTag) {
      // 4. 保留 innerText，删除 <mark ...> 和 </mark>。
      const innerText = doc.slice(openEnd, closeStart);
      const newDoc = doc.slice(0, openStart) + innerText + doc.slice(closeEnd);
      return {
        newDoc,
        from: openStart,
        to: openStart + innerText.length,
      };
    }
  }
  return null;
}
