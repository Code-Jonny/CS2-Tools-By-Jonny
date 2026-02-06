<div align="center">
  <img src="logo/logo.png" alt="CS2 Tools by Jonny Logo" width="160" height="160">

# CS2 Tools by Jonny

**Maximize your competitive edge in Counter-Strike 2 with intelligent system optimization.**

[![Release](https://img.shields.io/github/v/release/Code-Jonny/cs2tools-by-jonny?style=for-the-badge&color=00BFFF)](https://github.com/Code-Jonny/cs2tools-by-jonny/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows)](https://github.com/Code-Jonny/cs2tools-by-jonny)
[![License](https://img.shields.io/github/license/Code-Jonny/cs2tools-by-jonny?style=for-the-badge)](https://github.com/Code-Jonny/cs2tools-by-jonny/blob/main/LICENSE)

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-usage">Usage</a> •
    <a href="#-roadmap">Roadmap</a>
  </p>
</div>

---

## 🚀 About

**CS2 Tools** is a lightweight, high-performance utility built with **Rust** and **Tauri v2**. It runs quietly purely in the background to enforce optimal system conditions whenever you play Counter-Strike 2, and cleans up when you're done.

## ✨ Features

| Feature                 | Description                                                                                                       |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **⚡ Power Management** | Automatically engages the `High Performance` power plan when CS2 launches to prevent downclocking.                |
| **💀 Process Killer**   | Configure a "kill list" (e.g., Chrome, Spotify) to automatically close apps that eat CPU/RAM.                     |
| **🎨 Digital Vibrance** | **(Nvidia Only)** Automatically boost Digital Vibrance to 100% in-game for better visibility, and revert on exit. |
| **🧠 CPU Affinity**     | Optimize CPU core usage. Use the "Optimized" preset to keep CS2 off system-heavy Core 0.                          |
| **🛡️ VAC Safe**         | Works strictly with Windows APIs. Does **not** touch game memory or game files.                                   |

## ⚙️ How It Works

The application intelligently monitors for `cs2.exe`.

**When the game starts:**

1.  Terminates processes in your "Kill List".
2.  Switches to your designated Power Plan.
3.  Applies Digital Vibrance settings.
4.  Applies CPU Affinity rules.

**When the game closes:**

1.  Reverts to your previous Power Plan.
2.  Restores your Desktop Vibrance level.

## 📥 Installation

1.  **Download** the latest installer from the [Releases Page](https://github.com/Code-Jonny/cs2tools-by-jonny/releases).
2.  **Install** the application.
3.  **Run** `CS2 Tools by Jonny` via the desktop shortcut or start menu.

## 🕹️ Usage

1.  **Dashboard:** Check which monitor hooks are active.
2.  **Settings:**
    - Enable **Autostart with Windows**.
    - Toggle **Start Minimized**.
3.  **Process Management:** Add heavy background apps to the kill list.
4.  **Minimise:** Send the app to the system tray. It consumes minimal resources (~0% CPU).

## ❓ FAQ

<details>
<summary><strong>Is this safe? Will I get VAC banned?</strong></summary>
<br>
Yes, it is safe. CS2 Tools operates entirely outside of the game. It manages Windows settings (Power Plans, Process Priority, Color Settings) and does not interact with the game's memory or code injection.
</details>

<details>
<summary><strong>Does it improve FPS?</strong></summary>
<br>
Yes, mostly by improving frametime consistency (1% lows). By moving background tasks and ensuring the CPU doesn't downclock, the game runs smoother.
</details>

<details>
<summary><strong>What is the performance impact of the app itself?</strong></summary>
<br>
Negligible. Written in Rust, it uses minimal RAM and CPU. You can adjust the polling rate in settings to lower it further if needed.
</details>

## 🔮 Roadmap & Wishlist

### Planned

- [ ] **Game-Specific Windows Settings**: Disable visual effects/network throttling on launch.
- [ ] **Config Switcher**: Manager for `autoexec.cfg` and `video.txt`.
- [ ] **Auto-Updates**: In-app update notifications.
- [ ] **Color Management**: Advanced LUT curves for R/G/B channels.

### Under Consideration

- **System Overlay**: In-game CPU/GPU temps (feasibility study in progress).
- **Community Profiles**: Share/Import optimization configs.
- **Server Status**: Embedded Steam Status checker.

---

<div align="center">
  <sub>Built with Vue 3.5, Tauri v2, and Rust. Designed for the CS2 Community.</sub>
</div>
