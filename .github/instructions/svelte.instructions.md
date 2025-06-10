---
applyTo: "**/*.ts,**/*.svelte,**/*.js,**/*.json,**/*.svelte.ts"
---

This is a Windows App using Neutralino and Svelte. It will improve the gaming experience with Counter-Strike 2.

When you write code, please follow these guidelines:

1. **Use Svelte for UI**: All UI components should be written in Svelte. Use Svelte's reactive features to manage state and props effectively.
2. **Use Neutralino for Backend**: Use Neutralino's API to handle file operations, system commands, and other backend functionalities.
3. **File Structure**: Organize your code into components, services, and utilities. Keep the main application logic separate from UI components.
4. **State Management**: Use Svelte's built-in stores for managing application state. Avoid using global variables.
5. **Error Handling**: Implement error handling for file operations and system commands. Use try-catch blocks where necessary.
6. **Code Comments**: Write clear comments explaining the purpose of complex code blocks. Use JSDoc style comments for functions and components.
7. **Testing**: Write unit tests for critical components and services. Use Svelte's testing utilities where applicable.
8. **Performance Optimization**: Optimize performance by minimizing reactivity where possible. Use Svelte's `onMount` and `beforeUpdate` lifecycle methods effectively.
9. **Svelte 5**: Ensure compatibility with Svelte 5 features and syntax. Use the only the latest features available in Svelte 5.
10. **Typescript**: Use TypeScript for type safety. Define interfaces for props and state where applicable.
