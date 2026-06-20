from pathlib import Path
import re, json

guide_data = {
    "color-theory-basics": {
        "cta_tools": [
            ("/color-palette-generator/", "Palette Generator", "Create palettes based on color theory harmonies"),
            ("/color-wheel/", "Color Wheel", "Visualize hue relationships"),
            ("/color-mixer/", "Color Mixer", "Blend colors subtractively"),
        ],
        "faq_questions": [
            ("What is the 60-30-10 rule?", "The 60-30-10 rule is a balanced color distribution framework: 60% dominant color (usually neutral for backgrounds), 30% secondary color for main UI elements, and 10% accent color for calls to action and highlights."),
            ("How many colors should a palette have?", "A well-balanced palette typically contains 3 to 5 colors: a primary color for branding, a secondary color for contrast, an accent color for highlights, plus one or two neutrals for backgrounds and text."),
            ("What is the difference between tint, shade, and tone?", "A tint is created by adding white to a pure hue (making it lighter), a shade by adding black (making it darker), and a tone by adding gray (reducing saturation). Explore these with the Color Mixer tool."),
            ("How do warm and cool colors affect design?", "Warm colors (reds, oranges, yellows) advance visually and create energy. Cool colors (blues, greens, purples) recede and create calm. Successful designs often balance both."),
            ("What is the best way to start learning color theory?", "Start with the color wheel and the six basic harmonies. Use the Color Palette Generator to see principles in action, then test on real UI components with the Palette Preview tool."),
        ]
    },
    "how-to-choose-a-color-palette": {
        "cta_tools": [
            ("/color-palette-generator/", "Palette Generator", "Generate harmonious palettes instantly"),
            ("/brand-color-palette-generator/", "Brand Palette", "Extract palettes from logos and branding"),
            ("/color-wheel/", "Color Wheel", "Explore color harmony relationships visually"),
            ("/preview/", "Palette Preview", "Test your palette on real UI components"),
        ],
        "faq_questions": [
            ("How do I choose a base color?", "Start with the purpose of your project. For brand identity, begin with the company's logo color. For a new product, consider the emotional response you want. The Color Picker helps refine your base color."),
            ("How many colors should a brand palette have?", "A brand palette typically has 3 to 5 core colors: primary, secondary accent, neutral for backgrounds, and 1-2 additional accents. Successful brands use a consistent, limited palette."),
            ("How do I ensure my palette is accessible?", "Check your color combinations with the Contrast Checker for WCAG 2.1 compliance. Also test with the Color Blindness Simulator to verify your palette works for users with CVD."),
            ("Should I use monochromatic or complementary schemes?", "Monochromatic schemes are subtle and professional. Complementary schemes are energetic and high-contrast. Choose based on your project's goals."),
        ]
    },
    "accessibility-color-contrast": {
        "cta_tools": [
            ("/contrast-checker/", "Contrast Checker", "Check WCAG AA/AAA compliance"),
            ("/color-blindness-simulator/", "Color Blindness Simulator", "Test your designs for CVD accessibility"),
            ("/color-picker/", "Color Picker", "Find accessible color alternatives"),
            ("/preview/", "Palette Preview", "Test contrast on real UI components"),
        ],
        "faq_questions": [
            ("What is the difference between WCAG AA and AAA?", "AA requires 4.5:1 for normal text and 3:1 for large text. AAA requires 7:1 for normal text and 4.5:1 for large text. AA is the legal minimum in most jurisdictions; AAA is the gold standard."),
            ("Does contrast ratio matter for non-text elements?", "WCAG 2.1 Non-text Contrast (1.4.11) requires a 3:1 ratio for UI components and graphical objects like icons, buttons, and form field borders."),
            ("How do I fix a failing contrast ratio?", "Three approaches: darken the foreground, lighten the background, or increase font weight/size. The Color Picker helps find accessible alternatives close to your brand color."),
            ("Can I use low-contrast colors if text is large enough?", "Large text (>=18pt or >=14pt bold) only needs 3:1 for AA compliance instead of 4.5:1. AAA still requires 4.5:1 for large text."),
            ("What is the best way to check contrast during design?", "Use the Contrast Checker as you design. For ongoing monitoring, integrate contrast checks into your design system."),
        ]
    },
    "hex-vs-rgb-vs-hsl": {
        "cta_tools": [
            ("/color-converter/", "Color Converter", "Convert between HEX, RGB, HSL instantly"),
            ("/color-picker/", "Color Picker", "Pick and explore colors in all formats"),
            ("/hex-to-rgb/", "HEX to RGB", "Quick HEX-to-RGB conversion"),
            ("/rgb-to-hex/", "RGB to HEX", "Quick RGB-to-HEX conversion"),
        ],
        "faq_questions": [
            ("Which color format is best for web development?", "There is no single best format. HEX is common for static colors. HSL is best for programmatic manipulation. RGB is useful for fine-grained control."),
            ("Can I use HSL in all browsers?", "Yes, HSL has been supported since IE9. CSS Color Module Level 4 adds comma-less syntax and hwb()."),
            ("How do I convert HEX to RGB manually?", "Split the six-digit hex into three pairs: red, green, blue. Convert each pair from hex (base-16) to decimal."),
            ("Why does HSL make color manipulation easier?", "HSL separates color into three intuitive axes: hue, saturation, lightness. To create a tint just increase lightness."),
        ]
    },
    "web-design-color-tips": {
        "cta_tools": [
            ("/color-palette-generator/", "Palette Generator", "Create cohesive web color palettes"),
            ("/contrast-checker/", "Contrast Checker", "Verify WCAG compliance for your UI"),
            ("/color-blindness-simulator/", "Color Blindness Simulator", "Check CVD accessibility"),
            ("/export/", "Export Center", "Export your palette as CSS, Tailwind, or Figma tokens"),
        ],
        "faq_questions": [
            ("What is the first step in choosing web colors?", "Start with your brand's primary color and the purpose of your site. A utility app benefits from professional blues, a creative portfolio from bolder accents."),
            ("How do I maintain brand consistency across pages?", "Define design tokens with CSS custom properties. The Export Center generates CSS Variables and Tailwind config for your palette."),
            ("How many colors should a website use?", "Most well-designed websites use 3 to 5 core colors: 1-2 neutrals, 1-2 accents, and optionally a highlight color."),
            ("Should I design in light or dark mode first?", "Design in light mode first, then adapt for dark mode. Test both modes in the Palette Preview tool."),
        ]
    }
}

nl = "\n"

for guide, data in guide_data.items():
    path = Path(f"C:\\projekte\\color\\src\\pages\\guides\\{guide}.astro")
    text = path.read_text(encoding='utf-8')
    
    # 1. Tool CTA block — inject before FAQ section
    cta_lines = [
        '    <section class="guide-tool-ctas">',
        '      <h2>Try These Color Tools</h2>',
        '      <p>Apply what you learned in this guide with our free browser-based tools:</p>',
        '      <div class="guide-tool-grid">',
    ]
    for href, name, desc in data["cta_tools"]:
        cta_lines.append(f'        <a href="{href}" class="guide-tool-card">')
        cta_lines.append(f'          <strong>{name}</strong>')
        cta_lines.append(f'          <span>{desc}</span>')
        cta_lines.append(f'        </a>')
    cta_lines.append('      </div>')
    cta_lines.append('    </section>')
    cta_block = nl.join(cta_lines)
    
    if 'id="faq"' in text:
        text = text.replace('<section id="faq"', f'{cta_block}{nl}        <section id="faq"')
    else:
        idx = text.find('</article>')
        text = text[:idx] + f'        {cta_block}{nl}' + text[idx:]
    
    # 2. Build FAQ schema as frontmatter variable definition + script
    faq_entries = []
    for q, a in data["faq_questions"]:
        faq_entries.append(f'        {{ "@type": "Question", "name": {json.dumps(q)}, "acceptedAnswer": {{ "@type": "Answer", "text": {json.dumps(a)} }} }}')
    
    faq_var_block = f'''const faqSchema = {{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
{nl.join(faq_entries)}
    ]
}};'''
    
    # Remove any existing FAQPage script blocks
    text = re.sub(r'<script type="application/ld\+json" set:html=\{JSON\.stringify\(\{[^}]*"@type": "FAQPage"[^}]*\}\)}></script>\n*', '', text)
    
    # Add faqSchema frontmatter before the articleSchema declaration
    # Find the articleSchema declaration
    old_article_decl = 'const articleSchema'
    new_article_decl = f'{faq_var_block}\n\n{old_article_decl}'
    text = text.replace(old_article_decl, new_article_decl)
    
    # Add FAQPage script tag alongside existing Article schema
    # Replace `set:html={JSON.stringify(articleSchema)}>` with both
    old_article_script = '<script type="application/ld+json" set:html={JSON.stringify(articleSchema)}>'
    new_article_script = f'<script type="application/ld+json" set:html={{JSON.stringify(faqSchema)}}></script>\n  {old_article_script}'
    text = text.replace(old_article_script, new_article_script)
    
    path.write_text(data=text, encoding='utf-8')
    print(f"  Updated: {guide}")
