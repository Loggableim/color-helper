import re, json
from pathlib import Path

guides = ["color-theory-basics", "how-to-choose-a-color-palette", "accessibility-color-contrast", "hex-vs-rgb-vs-hsl", "web-design-color-tips"]

guide_data = {
    "color-theory-basics": [
        ("What is the 60-30-10 rule?", "A balanced framework: 60% dominant, 30% secondary, 10% accent."),
        ("How many colors should a palette have?", "Typically 3 to 5: primary, secondary, accent, plus neutrals."),
        ("What is the difference between tint, shade, and tone?", "Tint: add white. Shade: add black. Tone: add gray."),
        ("How do warm and cool colors affect design?", "Warm colors energize. Cool colors calm. Balance both."),
        ("How to start learning?", "Start with the color wheel and Palette Generator."),
    ],
    "how-to-choose-a-color-palette": [
        ("How do I choose a base color?", "Start with your project's purpose or brand logo color."),
        ("How many colors should a brand palette have?", "3 to 5 core colors: primary, secondary, neutrals, accents."),
        ("How do I ensure my palette is accessible?", "Use the Contrast Checker for WCAG AA compliance."),
        ("Monochromatic vs complementary?", "Mono = subtle. Complementary = high-contrast for CTAs."),
    ],
    "accessibility-color-contrast": [
        ("AA vs AAA?", "AA: 4.5:1 text. AAA: 7:1 text. AA is legal minimum."),
        ("Does non-text need contrast?", "Yes, WCAG 2.1 requires 3:1 for UI components."),
        ("How to fix failing contrast?", "Darken foreground, lighten background, or increase font size."),
        ("Can low-contrast work for large text?", "Large text (>=18pt) needs 3:1 for AA. AAA still needs 4.5:1."),
        ("Best way to check contrast?", "Use the Contrast Checker during design."),
    ],
    "hex-vs-rgb-vs-hsl": [
        ("Which format is best?", "HEX for static, HSL for manipulation, RGB for precision."),
        ("Can I use HSL in all browsers?", "Yes, supported since IE9."),
        ("How to convert HEX to RGB?", "Split into 3 pairs, convert base-16 to decimal."),
        ("Why is HSL easier?", "Separates hue, saturation, lightness. Tint = one number change."),
    ],
    "web-design-color-tips": [
        ("First step in choosing colors?", "Start with brand color and site purpose."),
        ("How to maintain brand consistency?", "Use CSS custom properties for your palette."),
        ("How many colors for a website?", "3 to 5 core colors."),
        ("Light or dark mode first?", "Design light mode first, adapt for dark."),
    ]
}

for guide in guides:
    path = Path(f"C:\\projekte\\color\\src\\pages\\guides\\{guide}.astro")
    text = path.read_text(encoding='utf-8')
    
    # Remove any existing faqSchema 
    text = re.sub(r'const faqSchema = \{[\s\S]*?"mainEntity": \[[\s\S]*?\]\s?\};\s*', '', text)
    
    # Build FAQ block
    faq_entries = []
    for q, a in guide_data[guide]:
        qs = json.dumps(q)
        ajs = json.dumps(a)
        faq_entries.append(f'        {{ "@type": "Question", "name": {qs}, "acceptedAnswer": {{ "@type": "Answer", "text": {ajs} }} }}')
    
    sep = ",\n"
    faq_block = f'''const faqSchema = {{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
{sep.join(faq_entries)}
    ]
}};
'''

    # Insert before const articleSchema
    text = text.replace('const articleSchema', f'{faq_block}\n\nconst articleSchema', 1)
    
    # Remove duplicate empty blocks
    text = re.sub(r'\n\n\n+', '\n\n', text)
    
    path.write_text(data=text, encoding='utf-8')
    print(f"  Fixed: {guide}")
