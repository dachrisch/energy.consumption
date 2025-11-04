# Energy Consumption Monitor

A modern, mobile-first Next.js 16 application for tracking and visualizing household energy consumption (power and gas).

## Features

- **Energy Tracking**: Record and monitor power and gas consumption over time
- **Interactive Visualization**:
  - Chart.js-powered graphs and trends
  - Interactive timeline slider with data distribution histogram
  - Real-time filtering by date range and energy type
- **Contract Management**: Store and manage energy contracts with pricing
- **Cost Calculation**: Automatic cost calculation based on contracts
- **CSV Import**: Bulk import energy readings from CSV files or clipboard
- **Mobile-First Design**: Optimized for mobile devices with touch interactions
- **Multi-User Support**: User authentication with isolated data per user
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation

## Latest Updates

### V3: Interactive Timeline Slider (2025-11-04) 🆕

The filter experience has been completely redesigned with an interactive range slider:

- **Visual Data Distribution**: Mini histogram showing measurement density over time
- **Precise Date Selection**: Drag handles to select any custom date range
- **Smart Presets**: Quick-select buttons (Last 7/30/90 days, This month/year, All time)
- **Touch-Optimized**: Smooth 60fps dragging on mobile devices
- **Keyboard Navigation**: Full support for keyboard shortcuts
- **Accessible**: WCAG 2.1 AA compliant with screen reader support

See [CHANGELOG.md](feature-dev/CHANGELOG.md) for full details.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Environment variables configured (see below)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/energy.consumption.git
cd energy.consumption

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and NextAuth configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=mongodb://localhost:27017/energy_consumption
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## Development

```bash
# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linter
npm run lint
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js (JWT strategy)
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js
- **Icons**: Font Awesome 6.5.1
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker + CI/CD via GitHub Actions

## Project Structure

```
src/
├── app/
│   ├── components/       # React components
│   │   ├── energy/      # Energy-related components
│   │   │   └── RangeSlider/  # Interactive timeline slider (V3)
│   │   ├── contracts/   # Contract management
│   │   └── modals/      # Modal dialogs
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic services
│   ├── handlers/        # Data processing handlers
│   ├── utils/           # Utility functions
│   └── constants/       # Configuration constants
├── actions/             # Server actions
├── models/              # Mongoose models
└── lib/                 # External library configurations

feature-dev/             # Feature documentation
├── CHANGELOG.md         # High-level changelog
├── filter-redesign/     # V3 timeline slider docs
└── WORKFLOW.md          # Development workflow
```

## Key Features Explained

### Interactive Timeline Slider

The timeline slider provides an intuitive way to filter energy data by date:

- **Visual Histogram**: See measurement distribution at a glance
- **Drag Handles**: Select custom date ranges with mouse or touch
- **Preset Buttons**: Quick access to common ranges (Last 7 days, This month, etc.)
- **Responsive**: Optimized for both mobile and desktop
- **Performance**: Smooth 60fps dragging, < 100ms data aggregation

### CSV Import

Import energy readings in bulk:
- Upload CSV files or paste from clipboard
- Automatic duplicate detection by date + type
- Validation with detailed error reporting
- Success/skipped/error count summary

### User Data Isolation

Each user's data is automatically isolated:
- Mongoose middleware applies user filters
- No cross-user data access possible
- Secure session management with NextAuth

## Testing

The project maintains high test coverage:

- **Total Tests**: 412 (100% passing)
- **Coverage**: 83.9% statements, 90.8% branches
- **Test Files**: Co-located in `__tests__/` subdirectories
- **Timezone**: Tests run in Europe/Berlin timezone

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.tsx

# Run with coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Docker Deployment

```bash
# Build Docker image
docker build -t energy-consumption .

# Run container
docker run -p 3100:3100 \
  -e MONGODB_URI=your_mongodb_uri \
  -e NEXTAUTH_URL=http://localhost:3100 \
  -e NEXTAUTH_SECRET=your_secret \
  energy-consumption
```

## Documentation

- **Project Guide**: [CLAUDE.md](CLAUDE.md) - Comprehensive project documentation
- **Changelog**: [feature-dev/CHANGELOG.md](feature-dev/CHANGELOG.md) - Feature history
- **Workflow**: [feature-dev/WORKFLOW.md](feature-dev/WORKFLOW.md) - Development process
- **V3 Docs**: [feature-dev/filter-redesign/](feature-dev/filter-redesign/) - Timeline slider documentation

## Contributing

1. Follow the development workflow in [WORKFLOW.md](feature-dev/WORKFLOW.md)
2. Review project patterns in [CLAUDE.md](CLAUDE.md)
3. Ensure all tests pass before committing
4. Use conventional commit format (`feat:`, `fix:`, `refactor:`, `test:`)
5. Update documentation when adding new features

## License

MIT License - See LICENSE file for details

## Credits

Built with [Claude Code](https://claude.com/claude-code) AI assistant.

## Support

For issues and questions, please open an issue on GitHub or contact the project maintainer.

---

**Last Updated**: 2025-11-04
**Version**: 3.0.0 (Interactive Timeline Slider)
