# Energy Consumption Tracker

A professional full-stack application designed to track, manage, and analyze energy consumption across multiple utility sources (Power and Gas). Features a modern, responsive UI with deep financial insights and automated data processing.

## 🚀 Key Features

- **Financial Cockpit**: Real-time aggregated insights with stacked cost charts and Year-to-Date (YTD) comparisons.
- **Utility Management**: Comprehensive tracking for Power and Gas meters with custom units and identifiers.
- **Contract & Pricing**: Advanced management of energy providers, pricing structures, and automatic detection of coverage gaps.
- **Smart Data Import/Export**: 
  - **Unified Backups**: Complete JSON-based system state restoration.
  - **CSV Import**: Intelligent field mapping for historical data migration.
- **OCR Support**: Automated reading extraction from meter photos.
- **Modern UI/UX**: Built with SolidJS, Tailwind CSS, and DaisyUI, featuring a top-aligned desktop layout and optimized mobile responsiveness (< 600px).

## 🛠 Tech Stack

- **Frontend**: [SolidJS](https://www.solidjs.com/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [DaisyUI](https://daisyui.com/), [Chart.js](https://www.chartjs.org/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (utilizes `mongodb-memory-server` for local development)
- **Quality Assurance**: [Vitest](https://vitest.dev/) (99+ tests), [Playwright](https://playwright.dev/), [ESLint](https://eslint.org/) (strict configuration)

## 🏁 Getting Started

### Prerequisites

- Node.js (v24+ recommended)
- pnpm (optional, but used for lockfile)

### Installation

```bash
# Clone the repository
git clone https://github.com/dachrisch/energy.consumption.git
cd energy.consumption

# Install dependencies
npm install
```

### Development

The project includes a built-in MongoDB Memory Server for seamless local setup.

```bash
# Start development server (includes local Mongo)
npm run dev
```

The app will be available at `http://localhost:3000` (or the next available port).

## 🧪 Testing & Linting

We maintain a high standard of code quality with 100% success rate on tests.

```bash
# Run unit and integration tests
npm test

# Run E2E tests (Playwright)
npm run test:e2e

# Run linting check
npm run lint
```

## 📦 Building for Production

```bash
# Build both client and server
npm run build

# Start the production server
npm run start:prod
```

## 🏷 Release Management

This project uses `standard-version` for automated versioning and changelog generation.

```bash
npm run release:patch  # Bump version x.x.X
npm run release:minor  # Bump version x.X.x
npm run release:major  # Bump version X.x.x
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
