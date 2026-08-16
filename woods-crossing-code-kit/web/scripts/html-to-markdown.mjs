// Minimal HTML → Markdown converter for the prerendered pages (SEO Phase 4).
//
// Scope: the well-formed markup produced by react-dom's renderToString — not
// arbitrary web HTML. It intentionally drops non-content elements (scripts,
// SVGs, images, form controls) and renders the text/heading/list/link/table
// structure that AI assistants actually consume. Used by scripts/prerender.mjs
// to emit a `.md` twin per page; a converter bug fails the build via the md
// guards there, never silently.

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

// Elements whose entire subtree is non-content for a markdown reader.
const SKIP = new Set([
  'script', 'style', 'noscript', 'svg', 'iframe', 'video', 'audio', 'canvas',
  'img', 'picture', 'input', 'select', 'textarea', 'button', 'form', 'dialog',
  'template', 'object',
]);

const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'div', 'dl', 'dd', 'dt',
  'fieldset', 'figure', 'figcaption', 'footer', 'header', 'hgroup', 'main',
  'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul', 'li', 'tr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
]);

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Parse well-formed markup into a lightweight node tree. */
function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [full, close, open, rawAttrs, selfClose, text] = m;
    if (full.startsWith('<!--')) continue; // renderToString text separators
    if (text !== undefined) {
      stack[stack.length - 1].children.push({ tag: '#text', text: decodeEntities(text) });
      continue;
    }
    if (close) {
      // Pop to the matching open tag (tolerates stray closes).
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === close.toLowerCase()) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const tag = open.toLowerCase();
    const attrs = {};
    for (const am of rawAttrs.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
      attrs[am[1].toLowerCase()] = am[2] !== undefined ? decodeEntities(am[2]) : '';
    }
    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!VOID.has(tag) && !selfClose) stack.push(node);
  }
  return root;
}

function collapse(s) {
  return s.replace(/\s+/g, ' ');
}

/**
 * Convert an HTML fragment to Markdown.
 * @param {string} html fragment (e.g. the page's <main> element)
 * @param {{ siteUrl?: string }} opts siteUrl absolutizes relative links
 */
export function htmlToMarkdown(html, { siteUrl = '' } = {}) {
  const root = parseHtml(html);

  /** Join child renderings, inserting a space at element boundaries so
   * stacked spans ("<span>Endless</span><span>Opportunities</span>") don't
   * fuse into one word. Text-node boundaries are joined verbatim (React
   * splits text runs mid-sentence with exact whitespace preserved). */
  function joinInline(children) {
    let out = '';
    let prevWasElement = false;
    for (const child of children) {
      const part = inline(child);
      if (!part) continue;
      const isElement = child.tag !== '#text';
      if (
        out &&
        (isElement || prevWasElement) &&
        !/\s$/.test(out) &&
        !/^\s/.test(part) &&
        // No space before closing punctuation ("…the [link](url).") — a text
        // node that IS punctuation should hug the preceding element.
        !/^[.,;:!?)]/.test(part)
      ) {
        out += ' ';
      }
      out += part;
      prevWasElement = isElement;
    }
    return out;
  }

  /** Render inline content of a node to a single-line markdown string. */
  function inline(node) {
    if (node.tag === '#text') return collapse(node.text);
    if (SKIP.has(node.tag) || node.attrs?.['aria-hidden'] === 'true') return '';
    const inner = joinInline(node.children);
    switch (node.tag) {
      case 'br':
        return ' ';
      case 'strong':
      case 'b': {
        const t = inner.trim();
        return t ? ` **${t}** ` : '';
      }
      case 'em':
      case 'i': {
        const t = inner.trim();
        return t ? ` *${t}* ` : '';
      }
      case 'code': {
        const t = inner.trim();
        return t ? ` \`${t}\` ` : '';
      }
      case 'a': {
        const text = inner.trim();
        let href = node.attrs?.href ?? '';
        if (!text) return '';
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return text;
        if (href.startsWith('/')) href = siteUrl + href;
        if (href.startsWith('tel:') || href.startsWith('mailto:')) {
          return `[${text}](${href})`;
        }
        return `[${text}](${href})`;
      }
      default:
        return inner;
    }
  }

  /** Render a node into markdown blocks (array of strings). */
  function blocks(node, ctx = { listDepth: 0, ordered: [], quote: false }) {
    if (node.tag === '#text') {
      const t = collapse(node.text).trim();
      return t ? [t] : [];
    }
    if (SKIP.has(node.tag) || node.attrs?.['aria-hidden'] === 'true') return [];

    const tag = node.tag;
    if (/^h[1-6]$/.test(tag)) {
      const t = collapse(inline({ ...node, tag: 'span' })).trim();
      return t ? [`${'#'.repeat(Number(tag[1]))} ${t}`] : [];
    }
    if (tag === 'hr') return ['---'];
    if (tag === 'p' || tag === 'blockquote' || tag === 'figcaption' || tag === 'address') {
      // Paragraph-level: children may still contain nested blocks (rare) —
      // render inline; if empty, fall back to child blocks.
      const t = collapse(inline({ ...node, tag: 'span' })).trim();
      if (!t) return [];
      return tag === 'blockquote' ? [`> ${t}`] : [t];
    }
    if (tag === 'ul' || tag === 'ol') {
      const out = [];
      let i = 0;
      for (const child of node.children) {
        if (child.tag !== 'li') continue;
        i += 1;
        const marker = tag === 'ol' ? `${i}.` : '-';
        const indent = '  '.repeat(ctx.listDepth);
        // Split the li into its own inline text + nested lists.
        const nested = [];
        const inlineParts = [];
        for (const c of child.children) {
          if (c.tag === 'ul' || c.tag === 'ol') nested.push(c);
          else inlineParts.push(c);
        }
        // Strip decorative bullet glyphs the page renders inside the <li>.
        // Strip decorative bullet glyphs; drop separator-only items ("/", "·").
        const text = collapse(joinInline(inlineParts)).trim().replace(/^[•·▪–-]\s*/, '');
        if (!text || /^[\/·|•–-]$/.test(text)) {
          i -= 1;
        } else {
          out.push(`${indent}${marker} ${text}`);
        }
        for (const n of nested) {
          out.push(...blocks(n, { ...ctx, listDepth: ctx.listDepth + 1 }));
        }
      }
      return out.length ? [out.join('\n')] : [];
    }
    if (tag === 'table') {
      const rows = [];
      let caption = '';
      const walkRows = (n) => {
        for (const c of n.children) {
          if (c.tag === 'tr') rows.push(c);
          else if (c.tag === 'caption') {
            caption = collapse(inline({ ...c, tag: 'span' })).trim();
          } else if (c.children) walkRows(c);
        }
      };
      walkRows(node);
      if (!rows.length) return [];
      const lines = [];
      // Render the caption as a bold line so the table keeps its title in md.
      if (caption) lines.push(`**${caption}**\n`);
      rows.forEach((tr, idx) => {
        const cells = tr.children
          .filter((c) => c.tag === 'td' || c.tag === 'th')
          .map((c) => collapse(inline({ ...c, tag: 'span' })).trim().replace(/\|/g, '\\|'));
        if (!cells.length) return;
        lines.push(`| ${cells.join(' | ')} |`);
        if (idx === 0) lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
      });
      return lines.length ? [lines.join('\n')] : [];
    }
    if (tag === 'dt') {
      const t = collapse(inline({ ...node, tag: 'span' })).trim();
      return t ? [`**${t}**`] : [];
    }
    if (tag === 'pre') {
      const t = node.children.map(inline).join('').trim();
      return t ? ['```\n' + t + '\n```'] : [];
    }

    // Generic containers (div/section/main/...): if the node has NO block
    // descendants, treat its content as one paragraph; otherwise recurse.
    const hasBlockChild = node.children.some(
      (c) => c.tag !== '#text' && (BLOCK.has(c.tag) || hasBlockDescendant(c)),
    );
    if (!hasBlockChild) {
      const t = collapse(inline({ ...node, tag: 'span' })).trim();
      return t ? [t] : [];
    }
    const out = [];
    // Group consecutive inline children into paragraphs between block children.
    let run = [];
    const flush = () => {
      const t = collapse(joinInline(run)).trim();
      if (t) out.push(t);
      run = [];
    };
    for (const child of node.children) {
      const isBlock =
        child.tag !== '#text' && (BLOCK.has(child.tag) || hasBlockDescendant(child));
      if (isBlock) {
        flush();
        out.push(...blocks(child, ctx));
      } else {
        run.push(child);
      }
    }
    flush();
    return out;
  }

  function hasBlockDescendant(node) {
    if (!node.children) return false;
    return node.children.some(
      (c) => c.tag !== '#text' && !SKIP.has(c.tag) && (BLOCK.has(c.tag) || hasBlockDescendant(c)),
    );
  }

  const out = blocks(root)
    .map((b) => b.replace(/[ \t]+$/gm, '').replace(/ {2,}/g, ' '))
    .filter(Boolean);
  // Deduplicate immediately repeated identical blocks (responsive duplicates).
  const deduped = out.filter((b, i) => b !== out[i - 1]);
  return deduped.join('\n\n').trim() + '\n';
}
