# Rene Baterboolean 🧮

A modern, beautiful, and mobile-friendly Boolean Logic Minimizer built with React, Vite, and Tailwind CSS.

## 🚀 Features

* **Visual Karnaugh Maps (Up to 6 Variables):** Automatically generated K-Maps with interactive cells and prime implicant group highlighting.
* **Tabular Method (Quine-McCluskey):** Generates step-by-step tables showing term merges and the Prime Implicant Covering Chart, perfect for students checking their homework!
* **Truth Table Editor:** Quickly toggle outputs for minterms (`1`) and don't-cares (`X`).
* **Logic Gate Schematic:** Automatically visualizes the minimized boolean equation into a standard logic gate circuit (AND, OR, NOT).
* **Multiple Notations:** Supports both Sum of Products (SOP) and Product of Sums (POS).
* **PWA Ready:** Installable as a native standalone app on iOS, Android, and Desktop.
* **History Tracking:** Automatically saves your recent problems locally.

## 🌐 Live Demo
Try it live: [https://renebaterboolean.vercel.app/](https://renebaterboolean.vercel.app/)

## 🛠️ Tech Stack
* React 19
* TypeScript
* Tailwind CSS 4
* Vite 8
* Lucide React

## 💻 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/NekoIsUnavailable/boolean-tool.git
   cd boolean-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 License
MIT License
