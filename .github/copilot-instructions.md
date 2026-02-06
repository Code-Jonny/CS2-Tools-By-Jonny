# Svelte 5 and Neutralino Guidelines

This is a Windows App using Tauri v2 and Vue 3.5. It will improve the gaming experience with Counter-Strike 2.

When you write code, please follow these guidelines:

1. **Use Vue 3.5 for UI**: All UI components should be written in Vue 3.5. Use Vue's reactive features to manage state and props effectively.
2. **Use Tauri v2 for Backend**: Use Tauri's API to handle file operations, system commands, and other backend functionalities.
3. **File Structure**: Organize your code into components, services, and utilities. Keep the main application logic separate from UI components.
4. **State Management**: Use Vue's built-in reactive and ref features for managing application state. Avoid using global variables.
5. **Error Handling**: Implement error handling for file operations and system commands. Use try-catch blocks where necessary.
6. **Code Comments**: Write clear comments explaining the purpose of complex code blocks. Use JSDoc style comments for functions and components.
7. **Testing**: Write unit tests for critical components and services. Use Vue's testing utilities where applicable.
8. **Performance Optimization**: Optimize performance by minimizing reactivity where possible. Use Vue's lifecycle methods effectively.
9. **Vue 3.5**: Ensure to only use modern Vue 3.5 features and syntax. It is important to only use the latest features available in Vue 3.5. Refrain from using deprecated features or syntax from previous versions.
10. **Typescript**: Use TypeScript for type safety. Define interfaces for props and state where applicable.
11. **Comments**: Use comments to explain code logic or decisions in the code. Explain alternative approaches and why the chosen approach is favored. Avoid redundant comments that do not add value. use jsdoc style for every js / ts file and function. Use the syntax of the VS Code extension "Better Comments" to highlight sections of code (e.g. TODO, FIXME, etc.)

# Design Guidelines

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
   Icon Style: Solar Icons (Bold)
   Description: Use the solar- icon set with the bold style. Icons should be monochrome, using the Off-White (#E0E0E0) color by default. For interactive icons, they can change to the Primary Accent (Cyan) on hover or when active.
