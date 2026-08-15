# Contributing to Zorveus TypeScript & React SDKs

Thank you for contributing to the Zorveus SDKs! We welcome bug fixes, documentation improvements, and feature enhancements.

---

## 🏗️ Monorepo Architecture

This repository is managed with npm workspaces:

```
zorveus-ts-sdk/
├── packages/
│   ├── sdk/                 # @zorveus/sdk (Core TypeScript SDK)
│   └── react/               # @zorveus/react (React hooks & components)
├── examples/
│   ├── mindspire-studio/    # PulseWrite AI Studio Demo
│   └── saasify-suite/       # Saasify Multi-Tool Workspace Demo
├── public_documentation/    # OpenAPI Schema & API Documentation
└── vitest.workspace.ts      # Multi-package test configuration
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Setup

```bash
# Clone the repository
git clone https://github.com/zorveus/zorveus-ts-sdk.git
cd zorveus-ts-sdk

# Install all workspace dependencies
npm install
```

---

## 🧪 Development Workflow

### Build Packages

We use `tsup` for high-performance dual ESM/CJS bundling and TypeScript declaration generation:

```bash
# Build all workspaces
npm run build

# Build a single workspace
npm run build --workspace=@zorveus/sdk
npm run build --workspace=@zorveus/react
```

### Typechecking

Always verify zero TypeScript diagnostics:

```bash
# Typecheck all packages and example apps
npm run typecheck
```

### Running Tests

We use `vitest` with `jsdom` for testing across all packages:

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Running Example Apps Locally

```bash
# Launch MindSpire Studio demo on http://localhost:5173
npm run demo:mindspire

# Launch Saasify Suite demo
npm run demo:saasify
```

---

## 📐 Coding & Style Guidelines

To keep the codebase maintainable and skimmable:

1. **Readability & Skimmability**: Write clean, self-explanatory code. Avoid unnecessary cleverness or deeply nested abstractions.
2. **Early Returns**: Use guard clauses and return early to keep function bodies flat and readable.
3. **Financial Decimal Precision**: Any monetary value (credit amounts, spend caps, balances) must be passed and validated as strict Decimal strings (e.g., `"50.000000000000"`), never native JavaScript floating-point numbers.
4. **Zero-Network Unauthenticated Guard**: Hooks like `useZorveusModels` and `useZorveusInference` must never trigger outbound network requests when unauthenticated.
5. **No Broken Links**: Always ensure exported symbols and internal imports resolve properly.

---

## 🚀 Pull Request Process

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b fix/oauth-callback-handling
   ```
2. Make your changes and add corresponding unit tests in `packages/*/tests/`.
3. Ensure all validation checks pass:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
4. Commit your changes with clear, semantic commit messages:
   * `feat: add getByExternalId product user query`
   * `fix: handle undefined error parameter in oauth validation`
   * `docs: update quickstart instructions`
5. Submit your Pull Request against the `main` branch.

---

## 📄 License

By contributing to this repository, you agree that your contributions will be licensed under the MIT License.
