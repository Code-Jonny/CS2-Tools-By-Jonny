# CS2Tools by Jonny

## Installation

1.  **Download:** Grab the latest release from the [GitHub Releases](https://github.com/your-username/cs2-tools/releases) page.
2.  **Extract:** Unzip the downloaded file to your desired location.
3.  **Run:** Execute `cs2-tools.exe` (or the equivalent for your OS).

## Usage

CS2Tools by Jonny is designed to optimize your Counter-Strike 2 gaming experience.

- **Dashboard:** Provides an overview of the current status, including active power plan and monitored processes.
- **Process Management:**
  - View a list of currently running processes.
  - Add processes to a "kill list" that will be terminated when CS2 starts.
  - Configure CS2Tools to automatically terminate these processes when `cs2.exe` is detected.
- **Power Plan Management:**
  - View available Windows power plans.
  - Set a specific power plan to be activated when CS2 starts.
  - Configure CS2Tools to revert to the original power plan when CS2 closes.
- **Settings:**
  - Configure CS2Tools to launch on Windows startup.
  - Configure CS2Tools to always launch minimized to the system tray.
  - Change polling interval.

The application intelligently monitors for `cs2.exe`. When the game starts, it will:

1.  Terminate processes defined in your "kill list".
2.  Switch to your designated "gaming" power plan.

When `cs2.exe` closes, it will:

1.  Revert to the power plan that was active before the game started.

## FAQ

**Q: Is this tool safe to use? Will it get me VAC banned?**
A: CS2Tools by Jonny operates by managing system-level processes and power plans. It does not interact with or modify Counter-Strike 2 game files or memory in any way. Therefore, it is highly unlikely to trigger a VAC ban. However, always use third-party tools at your own discretion.

**Q: What operating systems are supported?**
A: Currently, CS2Tools is primarily developed and tested for Windows 11 x64. Windows 10 should be supported as well. If you encounter any issues, feel free to contact me.

**Q: How do I add a process to the kill list?**
A: Navigate to the "Process Management" section. You can either manually type the process name (e.g., `chrome.exe`) or select it from the list of running processes and click "Add to Kill List".

**Q: Can I suggest features or report bugs?**
A: Yes! Please open an issue on the [GitHub Issues](https://github.com/your-username/cs2-tools/issues) page.

**Q: How does the power plan switching work?**
A: The application uses a small helper executable (`power_plans.exe` - written in C++) to list and switch Windows power plans. This is done to ensure proper permissions and execution. When CS2 starts, it switches to your selected gaming power plan. When CS2 closes, it reverts to the plan that was active before CS2 launched.

**Q: Will this tool significantly boost my FPS?**
A: The impact on FPS can vary depending on your system specifications and what background processes are typically running. By terminating unnecessary processes and ensuring your PC is using an optimal power plan, CS2Tools aims to free up system resources, which can lead to smoother gameplay and potentially higher FPS.

## Coming Features

I'm always looking to improve CS2Tools! Here's a sneak peek at what I'm planning or considering for future releases:

**Planned:**

- **Advanced Game-Specific Optimizations:** Beyond process termination, I plan to allow users to configure specific Windows settings (e.g., disabling certain visual effects, adjusting network adapter priorities) that apply automatically when CS2 is launched and revert when it's closed.
- **CS2 Configuration Switcher:** A utility to easily backup, restore, and switch between different Counter-Strike 2 configuration files (like `autoexec.cfg`, `video.txt`) directly from the app.
- **Automatic Application Updates:** Get notified within CS2Tools when a new version is available and update with a single click.

**Maybe Coming (Under Consideration):**

- **Real-time System Performance Overlay:** An optional, lightweight overlay to display key performance metrics (e.g., CPU/GPU temperature and load) in-game. (Feasibility with Neutralino is being explored).
- **Expanded Process Management:** More granular control, such as setting CPU affinity or priority for specific processes, or more detailed whitelisting/blacklisting options.
- **Community-Sourced Optimization Profiles:** Ability to import/export optimization settings or browse profiles shared by the community.
- **Plugin Support:** A system to allow for community-developed plugins to extend functionality (e.g., support for other games, specific hardware optimizations).

I welcome your suggestions! If you have a feature you'd love to see, please [open an issue](https://github.com/your-username/cs2-tools/issues) and let me know.

## Community Wishlist & Long-Term Vision

Beyond my immediate plans, here are some ideas that I am considering for the longer-term evolution of CS2Tools, or that might be driven by community interest:

- **Theme Customization:**
  - Allow users to select from a few predefined themes (e.g., a light theme, alternative accent colors) to personalize their experience.
- **CS2 Server Status Checker:**
  - Integrate a quick link or an embedded status indicator for official Counter-Strike 2 server health, helping players know if issues are widespread or local.
- **Detailed Performance Logging:**
  - Explore options for users to enable logging of key performance metrics (e.g., FPS, frametimes, system resource usage during CS2 sessions) to a local file. This could help users track their system's performance over time or diagnose issues. (Technical feasibility with Neutralino for in-depth, low-overhead logging will need to be assessed).
- **Multi-language Support (Internationalization):**
  - Translate the application interface into multiple languages to make it accessible to a broader international CS2 community.
- **Tutorial & Guided Setup Wizard:**
  - Implement an optional first-launch tutorial or a guided setup wizard to help new users understand all the features and configure the optimal settings for their needs.
- **CS2 Launch Options Manager:**
  - A dedicated interface to manage Counter-Strike 2 launch options, allowing users to easily add, remove, and toggle common launch parameters without manually editing them.
- **Sound Profile Switcher:**
  - Ability to automatically switch Windows default sound output (e.g., to a headset) and input devices when CS2 starts, and revert when it closes.

Your feedback on these or any other ideas is highly encouraged!

## Roadmap

This roadmap outlines my planned progression of CS2Tools by Jonny. It's a living document and priorities may shift based on my development progress and community feedback.

**Phase 1: Core Functionality & Enhancements (Short-Term)**

- **Automatic Application Updates:** Implement a system for users to easily update to the latest version from within the application.
- **CS2 Configuration Switcher:** Develop a utility for managing different CS2 `autoexec.cfg` and `video.txt` files.
- **Advanced Game-Specific Optimizations (Initial Set):** Introduce options for users to toggle specific Windows settings (e.g., disabling visual effects) when CS2 is active.

**Phase 2: Expanding Utility & User Experience (Mid-Term)**

- **Expanded Process Management:** Introduce more granular controls like setting CPU affinity/priority for processes, and improved whitelisting/blacklisting.
- **Tutorial & Guided Setup Wizard:** Create an onboarding experience for new users.
- **CS2 Launch Options Manager:** Provide an interface for managing CS2 launch parameters.
- **Theme Customization (Basic):** Offer a few predefined themes (e.g., light mode, alternative accent colors).
- **Multi-language Support (Initial Languages):** Begin internationalization efforts with a few key languages.

**Phase 3: Advanced Features & Community Focus (Long-Term)**

- **Real-time System Performance Overlay:** Investigate and implement a lightweight in-game overlay for performance metrics (contingent on Neutralino capabilities and performance impact).
- **Community-Sourced Optimization Profiles:** Allow users to share and import optimization configurations.
- **Plugin Support Architecture:** Design a system to allow for community-developed extensions.
- **Detailed Performance Logging:** Enable optional logging of performance data for analysis.
- **CS2 Server Status Checker:** Integrate a utility to check official server statuses.
- **Sound Profile Switcher:** Automate switching of audio input/output devices.

I aim to deliver a robust and user-friendly tool. Your input is invaluable in shaping this roadmap!
