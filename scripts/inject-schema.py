#!/usr/bin/env python3
"""
Inject JSON-LD into Tool-Pages of color-helper.com.

For Tool-Pages:
  - Add FAQPage schema (parsed from <FAQ> component)
  - Add BreadcrumbList (parsed from breadcrumbs prop)
  - Keep WebApplication schema
  - Combine all in @graph (one <script> instead of multiple)
"""
import json
import re
import sys
from pathlib import Path

PAGES = Path(r"C:\projekte\color\src\pages")

# Tools with FAQ that already have WebApplication schema
TOOL_PAGES = [
    "color-picker.astro",
    "color-converter.astro",
    "color-mixer.astro",
    "color-palette-generator.astro",
    "contrast-checker.astro",
    "css-color-converter.astro",
    "hex-to-rgb.astro",
    "image-color-picker.astro",
    "random-color-generator.astro",
    "rgb-to-hex.astro",
    "rgba-converter.astro",
    "color-palette-generator.astro",
    "brand-color-palette-generator.astro",
    "gradient-generator.astro",
]


def _dumps(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def extract_faq_items(text: str) -> list[dict]:
    """Parse FAQ items from <FAQ items={[{...}]} />"""
    faq_match = re.search(r"<FAQ\s+items=\{\[([\s\S]*?)\]\s*\}\s*/>", text)
    if not faq_match:
        return []
    items_raw = faq_match.group(1)
    qa = re.findall(
        r"question:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?answer:\s*'((?:[^'\\]|\\.)*)'",
        items_raw,
    )
    out = []
    for q, a in qa:
        q_clean = q.replace("\\'", "'").replace("\\\\", "\\")
        a_clean = a.replace("\\'", "'").replace("\\\\", "\\")
        out.append({"q": q_clean, "a": a_clean})
    return out


def extract_breadcrumbs(text: str) -> list[dict]:
    bc_match = re.search(r"const\s+breadcrumbs\s*=\s*\[([\s\S]*?)\];", text)
    if not bc_match:
        return []
    bc_raw = bc_match.group(1)
    items = re.findall(
        r"\{\s*label:\s*'((?:[^'\\]|\\.)*)'(?:\s*,\s*href:\s*'((?:[^'\\]|\\.)*)')?\s*\}",
        bc_raw,
    )
    out = []
    for label, href in items:
        out.append({
            "label": label.replace("\\'", "'"),
            "href": href.replace("\\'", "'") if href else "",
        })
    return out


def extract_title_description_canonical(text: str) -> dict:
    out = {}
    for key in ("title", "description", "canonical"):
        m = re.search(rf"const\s+{key}\s*=\s*'((?:[^'\\]|\\.)*)'", text)
        if m:
            out[key] = m.group(1).replace("\\'", "'")
    return out


def build_faq_schema(items: list[dict]):
    if not items:
        return None
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": item["q"],
                "acceptedAnswer": {"@type": "Answer", "text": item["a"]},
            }
            for item in items
        ],
    }


def build_breadcrumb_schema(items: list[dict], canonical: str = ""):
    if not items:
        return None
    list_items = []
    for i, item in enumerate(items, 1):
        if i == 1:
            url = "https://color-helper.com/"
        elif item.get("href"):
            url = "https://color-helper.com" + item["href"]
        else:
            url = canonical
        list_items.append({
            "@type": "ListItem",
            "position": i,
            "name": item["label"],
            "item": url,
        })
    return {"@type": "BreadcrumbList", "itemListElement": list_items}


def build_webapp_schema(meta: dict) -> dict:
    return {
        "@type": "WebApplication",
        "name": meta.get("title", ""),
        "description": meta.get("description", ""),
        "url": meta.get("canonical", ""),
        "applicationCategory": "BrowserApplication",
        "operatingSystem": "All",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
    }


def inject_tool_schema(text: str) -> str:
    """Replace existing JSON-LD blocks with consolidated @graph including FAQ + Breadcrumb."""
    meta = extract_title_description_canonical(text)
    if not meta.get("canonical"):
        return text

    faq_items = extract_faq_items(text)
    breadcrumbs = extract_breadcrumbs(text)

    nodes = [build_webapp_schema(meta)]
    faq_schema = build_faq_schema(faq_items)
    if faq_schema:
        nodes.append(faq_schema)
    bc_schema = build_breadcrumb_schema(breadcrumbs, meta["canonical"])
    if bc_schema:
        nodes.append(bc_schema)

    graph = {"@context": "https://schema.org", "@graph": nodes}
    graph_json = _dumps(graph)

    # The replacement block — single script with @graph
    new_block_open = '<script type="application/ld+json" set:html={JSON.stringify('
    new_block_close = ')} />'
    new_block = "\n  " + new_block_open + graph_json + new_block_close

    # Find existing JSON-LD script blocks (either inline or self-closing)
    # Pattern 1: <script type="application/ld+json" set:html={...} />
    pattern1 = re.compile(r'\s*<script type="application/ld\+json" set:html=\{[^}]+\}\s*/>')
    # Pattern 2: <script type="application/ld+json">...</script>
    pattern2 = re.compile(r'\s*<script type="application/ld\+json"[^>]*>[\s\S]*?</script>')

    # Collect positions of all JSON-LD blocks
    blocks = []
    for p in [pattern1, pattern2]:
        blocks.extend([(m.start(), m.end()) for m in p.finditer(text)])

    if not blocks:
        return text.replace("</BaseLayout>", new_block + "\n</BaseLayout>")

    # Remove all existing blocks; insert new consolidated one at the first position
    blocks.sort()
    insert_pos = blocks[0][0]
    # Build text: before insert_pos + new_block + skip all old blocks
    new_text = text[:insert_pos] + new_block
    last_end = blocks[0][1]
    for start, end in blocks[1:]:
        new_text += text[last_end:start]
        last_end = end
    new_text += text[last_end:]
    return new_text


def process_all():
    stats = {"tool_pages": 0, "skipped": []}
    for page_name in TOOL_PAGES:
        path = PAGES / page_name
        if not path.exists():
            stats["skipped"].append(page_name)
            continue
        text = path.read_text(encoding="utf-8")
        new_text = inject_tool_schema(text)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            stats["tool_pages"] += 1
    return stats


if __name__ == "__main__":
    stats = process_all()
    print(f"Tool-Pages aktualisiert: {stats['tool_pages']}")
    if stats["skipped"]:
        print(f"Übersprungen: {stats['skipped']}")
