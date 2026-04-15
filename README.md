# Pixi Mario H5

A high-performance, web-based Mario-inspired game built using **PixiJS** and **TypeScript**. This project leverages the power of WebGL via PixiJS to deliver smooth 2D gameplay directly in the browser.

## 🚀 Features

- **High Performance**: Powered by `pixi.js` for efficient WebGL rendering.
- **Modern Tooling**: Built with `Vite` for ultra-fast development and bundling.
    - `TypeScript` for robust, type-safe code.
    - `Vitest` for unit testing.
- **Responsive Design**: Scalable viewport management to fit various screen sizes.
- **Modular Architecture**: Clean separation of concerns using Scene Managers, Input Managers, and Game Systems.

## 🛠️ Tech Stack

- **Engine**: [PixiJS](https://pixijs.com/) (v6.5.10)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Testing**: Vitest
- **Runtime**: Browser (HTML5)

## 📦 Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd h5-mario-game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to play.

## 🏗️ Project Structure

- `src/`: The core source code.
    - `app/`: Main game logic, including `Game` engine and `SceneManager`.
    - `scenes/`: Individual game scenes (e.g., `BootScene`).
    - `systems/`: Core systems like `InputManager`.
    - `config/`: Game configuration and constants.
- `dist/`: Production-ready build output.
- `docs/`: Project documentation.

## 🧪 Testing

Run the test suite using Vitest:

```bash
npm run test
```

## 🚀 Building for Production

To create a production-ready bundle, run:

```bash
npm run build
```
The output will be generated in the `dist/` directory.

## 📜 License

[Specify License, e.g., MIT]
