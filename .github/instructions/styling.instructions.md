CS2Tools by Jonny - Design Style Guide

1. Core Identity & Philosophy

   App Name: CS2Tools by Jonny
   Core Purpose: An optimization utility for Counter-Strike 2 players. It boosts in-game performance by managing background processes and intelligently switching Windows power plans when the game is active.
   Target Audience: Intermediate to advanced CS2 players who are technically inclined and seek to maximize their PC's performance for a competitive edge.
   Brand Personality: Simple, Lightweight, Modern, Community-Focused.

2. Color Palette

The color scheme is built on a dark theme to be easy on the eyes during late-night gaming sessions. The cyan accent color provides a modern, tech-focused highlight that stands out clearly.

    Theme: Dark
    Primary Accent: Cyan
        Used for primary buttons, active toggles, links, selected items, and key headings.
        HEX: #00BFFF
        RGB: (0, 191, 255)
    Background (Primary): Dark Charcoal
        The main background color for the application window.
        HEX: #1A1A1A
        RGB: (26, 26, 26)
    Background (Secondary): Subtle Gray
        Used for content containers, cards, and alternating table rows to create separation.
        HEX: #242424
        RGB: (36, 36, 36)
    Text (Primary): Off-White
        For all standard body text and labels. Softer than pure white.
        HEX: #E0E0E0
        RGB: (224, 224, 224)
    Text (Secondary): Light Gray
        For less important helper text, captions, or disabled states.
        HEX: #888888
        RGB: (136, 136, 136)
    System Colors:
        Success: Green - Indicates a process was terminated successfully or a setting was applied. (HEX: #28A745)
        Warning: Amber - Indicates a process needs attention or a non-critical issue. (HEX: #FFC107)
        Error / Danger: Red - Indicates a failure, a stopped service, or a critical warning. (HEX: #DC3545)

3. Typography

The typography is clean, modern, and highly legible, using the versatile "Inter" font family. The hierarchy is clear and helps users scan information quickly.

    Font Family: Inter

    Type Hierarchy:
        H1 (Main Title): Inter Bold, 32px (e.g., "Dashboard", "Settings")
        H2 (Section Heading): Inter Semi-Bold, 24px (e.g., "Process Management", "Power Plans")
        H3 (Card/Item Title): Inter Medium, 18px (e.g., "Active Processes", "On Game Start")
        Body Text: Inter Regular, 16px (For all descriptions, explanations, and general text.)
        Labels & Captions: Inter Regular, 14px (For UI element labels, table headers, and small helper text.)
        Button Text: Inter Semi-Bold, 16px

4. UI Components & Interaction

The UI elements are designed to be modern and intuitive, with soft corners and clear visual feedback.

    Window Style:
        The main application window should have slightly rounded corners (e.g., 8-12px corner radius).
        It should use a custom-designed title bar that integrates seamlessly with the dark theme, rather than the default Windows title bar.

    Buttons:
        Primary Button:
            Style: Filled with the Primary Accent (Cyan) color. Text is a dark color (e.g., #1A1A1A) for high contrast.
            Hover State: The button brightens slightly (e.g., a 10% brightness increase).
            On-Click State: A subtle, animated ripple effect emanates from the click position. The button background darkens momentarily.
        Secondary Button:
            Style: Outlined with a Light Gray (#888888) border. The background is transparent. Text color is Off-White (#E0E0E0).
            Hover State: The background fills with the Subtle Gray (#242424) color.
            On-Click State: The background fill darkens slightly.

    Tables:
        Use the Background Primary (#1A1A1A) and Background Secondary (#242424) for alternating row colors (zebra striping) to enhance readability.
        Table headers should use the Labels & Captions typography style.

    Toggles / Switches:
        Use a modern, pill-shaped toggle switch.
        When "On," the switch background is the Primary Accent (Cyan).
        When "Off," the switch background is Subtle Gray (#242424).

5. Iconography

   Icon Library: Iconify
   Icon Style: Solar Icons (Linear)
   Description: Use the solar- icon set with the linear (outline) style. Icons should be monochrome, using the Off-White (#E0E0E0) color by default. For interactive icons, they can change to the Primary Accent (Cyan) on hover or when active.
   Example Icons:
   Settings: solar:settings-linear
   Play/Start: solar:play-bold
   Power: solar:bolt-linear
   Processes/Task: solar:checklist-minimalistic-linear
   Info: solar:info-circle-line
