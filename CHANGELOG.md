# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.6.0](https://github.com/dachrisch/energy.consumption/compare/v2.5.1...v2.6.0) (2025-12-30)


### Features

* allow releases from any branch, not just main ([40e2785](https://github.com/dachrisch/energy.consumption/commit/40e27859ff58bf7f650035fa26381a118fb762a6))


### Bug Fixes

* correct health endpoint to return 200 with status in body ([5e8c350](https://github.com/dachrisch/energy.consumption/commit/5e8c350917ac40eeafb98ec93c8ced2b7148403b))

### [2.5.1](https://github.com/dachrisch/energy.consumption/compare/v2.5.0...v2.5.1) (2025-12-14)


### Bug Fixes

* **deps:** update dependency mongoose to v9 ([24434c6](https://github.com/dachrisch/energy.consumption/commit/24434c6f06f372810a0a1336bbb2f548ff8866d3))
* **deps:** update dependency next to v16.0.10 [security] ([#244](https://github.com/dachrisch/energy.consumption/issues/244)) ([991fc68](https://github.com/dachrisch/energy.consumption/commit/991fc680c29fe3575f7e58248155fc762dde04a8))
* **deps:** update dependency next to v16.0.7 [security] ([#230](https://github.com/dachrisch/energy.consumption/issues/230)) ([785b0e1](https://github.com/dachrisch/energy.consumption/commit/785b0e1c01c044c3f0d1b5a90d3488c30131e600))
* **deps:** update dependency next to v16.0.9 [security] ([#242](https://github.com/dachrisch/energy.consumption/issues/242)) ([cd041f6](https://github.com/dachrisch/energy.consumption/commit/cd041f6af5c3dea9b19d0c1719c4b9b4ddd7b683))
* **deps:** update dependency react-datepicker to v9 ([ba5037a](https://github.com/dachrisch/energy.consumption/commit/ba5037aeca56c3fc70f612a09cc550e92e995236))
* **deps:** update nextjs monorepo to v16.0.4 ([#220](https://github.com/dachrisch/energy.consumption/issues/220)) ([6893a03](https://github.com/dachrisch/energy.consumption/commit/6893a03c20bdb196856d59f0f0eb251d19379895))
* **deps:** update nextjs monorepo to v16.0.5 ([#222](https://github.com/dachrisch/energy.consumption/issues/222)) ([9b0ad92](https://github.com/dachrisch/energy.consumption/commit/9b0ad92a9ca39b715cc87eccf8253508dfdc98e7))
* **deps:** update nextjs monorepo to v16.0.6 ([#223](https://github.com/dachrisch/energy.consumption/issues/223)) ([cc7a12e](https://github.com/dachrisch/energy.consumption/commit/cc7a12e07d8ab3f6339242329e04c6a4a40539d7))
* **deps:** update nextjs monorepo to v16.0.8 ([#235](https://github.com/dachrisch/energy.consumption/issues/235)) ([0e0a76c](https://github.com/dachrisch/energy.consumption/commit/0e0a76c57d34e695db9e079a1c8872e42cf0d9a2))
* **hooks:** remove unnecessary filtersJson dependency warnings ([bb90ea7](https://github.com/dachrisch/energy.consumption/commit/bb90ea78e028519b2821163abb591e45e7457ef1))
* migrate v2 API routes from Pages Router to App Router ([a8f36a1](https://github.com/dachrisch/energy.consumption/commit/a8f36a150490795bca48b4ec1a565503ca34d085))
* update sessionFilter to Mongoose v9 compatibility ([7ebe02b](https://github.com/dachrisch/energy.consumption/commit/7ebe02b5d8bfabea503efc26ff283bceed71d9fd)), closes [#217](https://github.com/dachrisch/energy.consumption/issues/217)

## [2.5.0](https://github.com/dachrisch/energy.consumption/compare/v2.4.0...v2.5.0) (2025-11-17)


### Features

* **backend:** implement event-based repository architecture with gradual migration infrastructure ([4c58114](https://github.com/dachrisch/energy.consumption/commit/4c58114fca836c5ad1c7ba6eb98e2e7ddddd3348))
* **charts:** add dual y-axis with monthly consumption bars ([4e20714](https://github.com/dachrisch/energy.consumption/commit/4e207147098067e9f3019be632c3757a821ad375))


### Bug Fixes

* **charts:** add nextJanuary fallback for December consumption ([db68fbb](https://github.com/dachrisch/energy.consumption/commit/db68fbb31f7d9a0cad56e3207f1cfa76b87e80d2))
* **charts:** calculate December consumption using next January ([0335a6c](https://github.com/dachrisch/energy.consumption/commit/0335a6cfb373f13f758c8595eca971e0667b358f))
* **deps:** update nextjs monorepo to v16.0.2 ([#207](https://github.com/dachrisch/energy.consumption/issues/207)) ([210f300](https://github.com/dachrisch/energy.consumption/commit/210f300eed1f50a93077c0808b299e9c722539d7))
* **deps:** update nextjs monorepo to v16.0.3 ([b9f9666](https://github.com/dachrisch/energy.consumption/commit/b9f9666aeb9f2ef0cc5786f9b2dd99ff191c2a60))

## [2.4.1] - 2025-11-06

### Added
- **Dual Y-Axis Monthly Charts**: Charts now display both meter readings (left axis) and monthly consumption (right axis)
  - Bar chart overlay showing monthly consumption differences
  - Consumption = Current month meter reading - Previous month meter reading
  - Semi-transparent bars (70% opacity) to avoid obscuring line chart
  - Enhanced tooltips showing both meter reading and consumption values
  - First month (January) shows null for consumption (no previous month)
  - Derived consumption flagged with dashed borders
  - Colors: Power consumption (teal `rgba(124, 245, 220, 0.7)`), Gas consumption (pink `rgba(255, 159, 128, 0.7)`)

### Technical Details
- New service function: `calculateMonthlyConsumption()` in `MonthlyDataAggregationService`
- New type: `MonthlyConsumptionPoint` with quality tracking (isActual, isDerived)
- Chart.js dual y-axis configuration with independent scales
  - Left axis (`y-left`): Meter readings, beginAtZero: false
  - Right axis (`y-right`): Consumption, beginAtZero: true
- Mixed chart type support: Line chart (meter readings) + Bar chart (consumption)
- 18 new comprehensive tests for consumption calculation (service layer)
- 481 total tests passing (100%)
- No breaking changes - backward compatible enhancement

### Documentation
- Comprehensive feature documentation in `feature-dev/dual-axis-monthly-charts/`
- Updated CLAUDE.md with dual-axis configuration details
- Implementation notes with design decisions and performance optimizations

## [2.4.0](https://github.com/dachrisch/energy.consumption/compare/v2.3.1...v2.4.0) (2025-11-06)


### Features

* **charts:** redesign with monthly meter readings view ([c9f07e7](https://github.com/dachrisch/energy.consumption/commit/c9f07e70716ab2ffdcd166895bc1a18dad938e66))

## [2.4.0](https://github.com/dachrisch/energy.consumption/compare/v2.3.1...v2.4.0) (2025-11-06)


### Features

* **charts:** complete redesign of monthly charts with end-of-month meter readings visualization
  - New dedicated MonthlyMeterReadingsChart component with separate Power and Gas charts
  - MonthlyDataAggregationService for calculating end-of-month readings
  - Data quality indicators: actual readings (solid lines), interpolated values (dashed), and extrapolated estimates (longer dashed)
  - Year navigation with prev/next buttons and dropdown selector
  - Mobile-first responsive design with optimized chart heights and touch-friendly controls
  - Linear interpolation between readings and extrapolation for edge cases
  - Custom Chart.js segment styling for dynamic line patterns based on data quality
  - 3-day tolerance window for identifying actual month-end readings
  - Independent Y-axis scales for Power and Gas charts for better readability
  - Empty state handling with helpful messaging
  - Comprehensive test coverage for service and component

### Breaking Changes

* **charts:** The old monthly view in UnifiedEnergyChart has been replaced with a new dedicated implementation
  - Users will see a completely new visualization focused on meter readings instead of consumption
  - Chart now shows end-of-month meter states rather than monthly consumption differences
  - Data quality is clearly indicated with visual patterns (actual, interpolated, extrapolated)
  - No migration needed - the new view is automatically available at `/charts`

### [2.3.1](https://github.com/dachrisch/energy.consumption/compare/v2.3.0...v2.3.1) (2025-11-06)


### Bug Fixes

* remove haptic feedback ([08662be](https://github.com/dachrisch/energy.consumption/commit/08662be0c7308d62a3a5ebbbb49cb579461a6411))

## [2.3.0](https://github.com/dachrisch/energy.consumption/compare/v2.2.2...v2.3.0) (2025-11-05)


### Features

* **filters:** add interactive timeline slider with data visualization ([3772f6d](https://github.com/dachrisch/energy.consumption/commit/3772f6d2d4b4f81733fd10c2daadbabb1f1904c9))


### Bug Fixes

* add settings ([0e0aace](https://github.com/dachrisch/energy.consumption/commit/0e0aace1004afe20f8e215de8cc68633fc047593))
* add settings ([d6a5e71](https://github.com/dachrisch/energy.consumption/commit/d6a5e71ef06d7f1f12251f19e3f422e39aaf2c25))
* **filters:** V3.1 refinements - address user feedback and fix critical drag bug ([31496a1](https://github.com/dachrisch/energy.consumption/commit/31496a16ab2eed6019a8574fe608e3eaa5a3db0b))

### [2.2.2](https://github.com/dachrisch/energy.consumption/compare/v2.2.1...v2.2.2) (2025-11-03)


### Bug Fixes

* **ui:** make login and register form inputs full width ([8073384](https://github.com/dachrisch/energy.consumption/commit/807338429ec7f747b74d4e9b22c20fd0d58809fe))
* **ui:** properly remove all focus highlighting from navigation ([4270968](https://github.com/dachrisch/energy.consumption/commit/4270968e7992e92f4623ca02d26ed42a48ccf6f9))
* **ui:** remove unwanted focus borders from navigation elements ([653e4d7](https://github.com/dachrisch/energy.consumption/commit/653e4d72c62bccc3d2cd96506ab7c55e849ebca0))
* wrap all hover effects in [@media](https://github.com/media) (hover: hover) to prevent stuck hover states on touch devices ([d164083](https://github.com/dachrisch/energy.consumption/commit/d164083d34d18e47c0886efb8da755007ca219b2))

### [2.2.1](https://github.com/dachrisch/energy.consumption/compare/v2.2.0...v2.2.1) (2025-11-03)

## [2.2.0](https://github.com/dachrisch/energy.consumption/compare/v2.1.0...v2.2.0) (2025-11-03)


### Features

* add theme switcher to profile menu with mobile positioning fix ([2f6aed6](https://github.com/dachrisch/energy.consumption/commit/2f6aed61627469e7b5c2cda978e60cd3c67ffb00))


### Bug Fixes

* replace any type with AppRouterInstance in AppBar test ([1832eb4](https://github.com/dachrisch/energy.consumption/commit/1832eb4bb5e866e0e1869691652bdb3ea52267c9))

## [2.1.0](https://github.com/dachrisch/energy.consumption/compare/v2.0.0...v2.1.0) (2025-11-03)


### Features

* **mobile:** implement comprehensive mobile optimization and UI enhancements ([dab8abb](https://github.com/dachrisch/energy.consumption/commit/dab8abb0a4a999aae54a6c188589d482ddf98ab6))


### Bug Fixes

* **ci:** add JSON schema references to all workflow files ([812529f](https://github.com/dachrisch/energy.consumption/commit/812529f9c45e097f3e6e886874e98530dea353ac))

## [2.0.0](https://github.com/dachrisch/energy.consumption/compare/v1.12.1...v2.0.0) (2025-11-02)


### Bug Fixes

* lint issues ([4448eea](https://github.com/dachrisch/energy.consumption/commit/4448eea0e42dc34a871e659fe11f772a92c83608))
* pathname issue during build ([d5273c5](https://github.com/dachrisch/energy.consumption/commit/d5273c5e0c0013f708fd9c2e7f3657ecd0b622c8))

### [1.12.1](https://github.com/dachrisch/energy.consumption/compare/v1.12.0...v1.12.1) (2025-11-02)

## [1.12.0](https://github.com/dachrisch/energy.consumption/compare/v1.11.1...v1.12.0) (2025-11-02)


### Features

* back button for contracts ([1cb9989](https://github.com/dachrisch/energy.consumption/commit/1cb9989162afbff6e6917ee601bcac40b04f04d4))
* chart with costs ([1de341b](https://github.com/dachrisch/energy.consumption/commit/1de341bcb543d065be7cfaaf7e999292b670fb20))
* interpolating & ui stylings ([896caaf](https://github.com/dachrisch/energy.consumption/commit/896caaf8a9719269355ad001ba05a530484a8d27))


### Bug Fixes

* **chartData:** enforce consistent date formatting using en-GB locale ([0e4ecdb](https://github.com/dachrisch/energy.consumption/commit/0e4ecdb8b42e79e9ddc85e4a152f76e96b7761d6))
* **deps:** update nextjs monorepo to v16.0.1 ([#185](https://github.com/dachrisch/energy.consumption/issues/185)) ([22f68fc](https://github.com/dachrisch/energy.consumption/commit/22f68fcf0d5480a90e265f93daac52dca7f72d02))
* indents & format ([3d70fa2](https://github.com/dachrisch/energy.consumption/commit/3d70fa2f4799c142524e735480b288692dbed077))
* layout ([4fbbf46](https://github.com/dachrisch/energy.consumption/commit/4fbbf462ae571efe72f50bf7ee07bc5e3ed370cf))
* lint errors ([534ffe3](https://github.com/dachrisch/energy.consumption/commit/534ffe35b881d4390a5456bad67905a08d7fe73c))
* remove testing check ([c534da8](https://github.com/dachrisch/energy.consumption/commit/c534da8a690905d870d61064f91d7d085bdcd931))
* suppress hydration warning ([c956bb1](https://github.com/dachrisch/energy.consumption/commit/c956bb1d8fb5e1cf948f691675fc825f55eb7241))
* test improvements ([2e9d27e](https://github.com/dachrisch/energy.consumption/commit/2e9d27ee9e20b4009647f7b313b2e8fdac7f8bb6))
* tests fixed ([1259f81](https://github.com/dachrisch/energy.consumption/commit/1259f8135fdc73e011ebcbac67a36c6f39f50948))
* update charts view ([0a239f1](https://github.com/dachrisch/energy.consumption/commit/0a239f149787f529ffbca6783f78abae8e1017aa))

### [1.11.1](https://github.com/dachrisch/energy.consumption/compare/v1.11.0...v1.11.1) (2025-10-26)


### Bug Fixes

* middleware to proxy ([016413b](https://github.com/dachrisch/energy.consumption/commit/016413bd905f110aad3b725ad0903b5d2bf70252))

## [1.11.0](https://github.com/dachrisch/energy.consumption/compare/v1.10.1...v1.11.0) (2025-10-26)

### [1.10.1](https://github.com/dachrisch/energy.consumption/compare/v1.10.0...v1.10.1) (2025-10-26)


### Bug Fixes

* **deps:** update dependency mongoose to v8.16.3 ([#66](https://github.com/dachrisch/energy.consumption/issues/66)) ([2d38d3e](https://github.com/dachrisch/energy.consumption/commit/2d38d3ea1848df626748dfe8f01eec6120fbe39f))
* **deps:** update dependency mongoose to v8.16.4 ([#71](https://github.com/dachrisch/energy.consumption/issues/71)) ([ba258a2](https://github.com/dachrisch/energy.consumption/commit/ba258a28ba8078273eede2a361c26a4bea09cfdb))
* **deps:** update dependency mongoose to v8.16.5 ([#78](https://github.com/dachrisch/energy.consumption/issues/78)) ([cdbb63d](https://github.com/dachrisch/energy.consumption/commit/cdbb63d5770113acd410d6f36a19fd34b2078a94))
* **deps:** update dependency mongoose to v8.17.0 ([#86](https://github.com/dachrisch/energy.consumption/issues/86)) ([7a84aa9](https://github.com/dachrisch/energy.consumption/commit/7a84aa992083614f8689770afe3889584fbcc0ae))
* **deps:** update dependency mongoose to v8.17.1 ([#92](https://github.com/dachrisch/energy.consumption/issues/92)) ([0adb121](https://github.com/dachrisch/energy.consumption/commit/0adb12137b6a8fa200660968c7665f904d82e611))
* **deps:** update dependency mongoose to v8.17.2 ([#103](https://github.com/dachrisch/energy.consumption/issues/103)) ([541631a](https://github.com/dachrisch/energy.consumption/commit/541631a91fbb5e393f68c4f3a53bd58c2bb11cd6))
* **deps:** update dependency mongoose to v8.18.0 ([#110](https://github.com/dachrisch/energy.consumption/issues/110)) ([f3a28f5](https://github.com/dachrisch/energy.consumption/commit/f3a28f5e733cf2faf7e387bcd1da870df0274b4a))
* **deps:** update dependency mongoose to v8.18.1 ([#126](https://github.com/dachrisch/energy.consumption/issues/126)) ([e4d3a47](https://github.com/dachrisch/energy.consumption/commit/e4d3a471ec7d8f26ebf30a1cdc97ec1a6afa2485))
* **deps:** update dependency mongoose to v8.18.2 ([#139](https://github.com/dachrisch/energy.consumption/issues/139)) ([73afe3d](https://github.com/dachrisch/energy.consumption/commit/73afe3d842a4646ef9fc80bc5ba88ba3ee069da2))
* **deps:** update dependency react-datepicker to v8.5.0 ([#101](https://github.com/dachrisch/energy.consumption/issues/101)) ([ee3d124](https://github.com/dachrisch/energy.consumption/commit/ee3d1249100d3fcc62d9732624630090b1b28be7))
* **deps:** update dependency react-datepicker to v8.6.0 ([#105](https://github.com/dachrisch/energy.consumption/issues/105)) ([16f1efa](https://github.com/dachrisch/energy.consumption/commit/16f1efa0abb2c98b82a18b2c98e47243cc2fabe8))
* **deps:** update dependency react-datepicker to v8.7.0 ([#107](https://github.com/dachrisch/energy.consumption/issues/107)) ([1451bba](https://github.com/dachrisch/energy.consumption/commit/1451bba65c9591bf79b143b3c76182e3afce7dc9))
* **deps:** update nextjs monorepo to v15.4.1 ([#69](https://github.com/dachrisch/energy.consumption/issues/69)) ([45072ba](https://github.com/dachrisch/energy.consumption/commit/45072ba7a03cb066f714353648279417e82a5997))
* **deps:** update nextjs monorepo to v15.4.2 ([#72](https://github.com/dachrisch/energy.consumption/issues/72)) ([054003e](https://github.com/dachrisch/energy.consumption/commit/054003e13bc6a37552dc9f7f253027d1e8cbaca4))
* **deps:** update nextjs monorepo to v15.4.3 ([#76](https://github.com/dachrisch/energy.consumption/issues/76)) ([d6b0b74](https://github.com/dachrisch/energy.consumption/commit/d6b0b744a0a23e2e93ed397793b9f085446add6f))
* **deps:** update nextjs monorepo to v15.4.4 ([#77](https://github.com/dachrisch/energy.consumption/issues/77)) ([af4050d](https://github.com/dachrisch/energy.consumption/commit/af4050daecba496b0427d9cc269fbf008274a964))
* **deps:** update nextjs monorepo to v15.4.5 ([#85](https://github.com/dachrisch/energy.consumption/issues/85)) ([21bae6a](https://github.com/dachrisch/energy.consumption/commit/21bae6a1740beb40cc11e81611c957e809183467))
* **deps:** update nextjs monorepo to v15.4.6 ([#91](https://github.com/dachrisch/energy.consumption/issues/91)) ([e7ca98a](https://github.com/dachrisch/energy.consumption/commit/e7ca98a626598c4dbced19a0f0936f80b3f50eb6))
* **deps:** update nextjs monorepo to v15.4.7 ([#104](https://github.com/dachrisch/energy.consumption/issues/104)) ([58e93c3](https://github.com/dachrisch/energy.consumption/commit/58e93c37493dd782d8f32eaf495caa11011f93ac))
* **deps:** update nextjs monorepo to v15.5.0 ([#106](https://github.com/dachrisch/energy.consumption/issues/106)) ([6825099](https://github.com/dachrisch/energy.consumption/commit/6825099e3706227effc8b5667935180acaaab5a6))
* **deps:** update nextjs monorepo to v15.5.2 ([#115](https://github.com/dachrisch/energy.consumption/issues/115)) ([d19176c](https://github.com/dachrisch/energy.consumption/commit/d19176c1648a785bae69414cf29790346a0dfc9b))
* **deps:** update nextjs monorepo to v15.5.3 ([#127](https://github.com/dachrisch/energy.consumption/issues/127)) ([02498ba](https://github.com/dachrisch/energy.consumption/commit/02498bac901bebc149185721762781330d77c231))
* **deps:** update nextjs monorepo to v15.5.4 ([#140](https://github.com/dachrisch/energy.consumption/issues/140)) ([31b5ddc](https://github.com/dachrisch/energy.consumption/commit/31b5ddc4ca2cf339f86d4d18dcde50148fd079ff))
* **deps:** update nextjs monorepo to v15.5.5 ([#167](https://github.com/dachrisch/energy.consumption/issues/167)) ([55e6a11](https://github.com/dachrisch/energy.consumption/commit/55e6a11002ba30de7ac016310f826543c83b311b))
* **deps:** update nextjs monorepo to v15.5.6 ([#171](https://github.com/dachrisch/energy.consumption/issues/171)) ([3fbec10](https://github.com/dachrisch/energy.consumption/commit/3fbec10002b3a80213e459e53f0061b02118abf6))
* **deps:** update nextjs monorepo to v16 ([5afcdf9](https://github.com/dachrisch/energy.consumption/commit/5afcdf951e41cb53d9ead39fba6c3335b8f0c682))
* **deps:** update nextjs monorepo to v16 ([65f46d5](https://github.com/dachrisch/energy.consumption/commit/65f46d5ea0b504aea0d9e381bdec1da764801b3f))
* **deps:** update react monorepo to v19.1.1 ([#82](https://github.com/dachrisch/energy.consumption/issues/82)) ([acad228](https://github.com/dachrisch/energy.consumption/commit/acad2283ae02b3a8ce2c43f57dd2772d0c5f0a83))
* next lint to eslint and setState fixes ([41ab008](https://github.com/dachrisch/energy.consumption/commit/41ab008d401d3425cc99bd7cc7d8bfe08ab6198c))
* next lint to eslint and setState fixes ([b7b7f62](https://github.com/dachrisch/energy.consumption/commit/b7b7f62839910b3f0d109edd376d828911f7de58))
* npm i ([02ed1fb](https://github.com/dachrisch/energy.consumption/commit/02ed1fbfb4f7dfb548af3e14fa016b87f3084cf4))
* override nextauth nexus dependency unti l https://github.com/nextauthjs/next-auth/issues/13302 is fixed ([a167836](https://github.com/dachrisch/energy.consumption/commit/a167836304d149b84e58723b115e9a2c6e48da7e))
* override nextauth nexus dependency unti l https://github.com/nextauthjs/next-auth/issues/13302 is fixed ([d70d476](https://github.com/dachrisch/energy.consumption/commit/d70d47688ef113cd1d60c86658842b39993c2019))
* The following suggested values were added to your tsconfig.json. These values can be changed to fit your project's needs: ([11a7c08](https://github.com/dachrisch/energy.consumption/commit/11a7c088ed686af3236497ceddda6348dcdb6fb3))
* The following suggested values were added to your tsconfig.json. These values can be changed to fit your project's needs: ([d5d8c87](https://github.com/dachrisch/energy.consumption/commit/d5d8c87fdc58a3cd89a1160aa866241e557ccc30))

## [1.10.0](https://github.com/dachrisch/energy.consumption/compare/v1.9.5...v1.10.0) (2025-07-07)


### Bug Fixes

* **deps:** update dependency chart.js to v4.5.0 ([#46](https://github.com/dachrisch/energy.consumption/issues/46)) ([9f53695](https://github.com/dachrisch/energy.consumption/commit/9f536956bd22648edd41630387cd621a934bf360))
* **deps:** update dependency immutable to v5.1.3 ([#42](https://github.com/dachrisch/energy.consumption/issues/42)) ([358ee10](https://github.com/dachrisch/energy.consumption/commit/358ee10897afe8c1f62aca2157ec33194e06ecaa))
* **deps:** update dependency moment-timezone to ^0.6.0 ([#21](https://github.com/dachrisch/energy.consumption/issues/21)) ([5f49e0f](https://github.com/dachrisch/energy.consumption/commit/5f49e0f1bc9a84b9aae0c1fa31c92b291c1351d0))
* **deps:** update dependency mongoose to v8.15.0 ([#11](https://github.com/dachrisch/energy.consumption/issues/11)) ([f9f1e7e](https://github.com/dachrisch/energy.consumption/commit/f9f1e7e58aa8316047510a841a1de15843e7af30))
* **deps:** update dependency mongoose to v8.15.1 ([#24](https://github.com/dachrisch/energy.consumption/issues/24)) ([05036dc](https://github.com/dachrisch/energy.consumption/commit/05036dc7a588a1b8d11d31f3cd854eeea65dae7d))
* **deps:** update dependency mongoose to v8.15.2 ([#44](https://github.com/dachrisch/energy.consumption/issues/44)) ([9fcef5b](https://github.com/dachrisch/energy.consumption/commit/9fcef5b2858602f53222362646731ccea28b72fe))
* **deps:** update dependency mongoose to v8.16.0 ([#49](https://github.com/dachrisch/energy.consumption/issues/49)) ([f465c43](https://github.com/dachrisch/energy.consumption/commit/f465c431ae6ecd2ab36e08ab0a2172e74a77f5e9))
* **deps:** update dependency mongoose to v8.16.1 ([#54](https://github.com/dachrisch/energy.consumption/issues/54)) ([ff78d7f](https://github.com/dachrisch/energy.consumption/commit/ff78d7fd2dc7376e5b75d522943ce9e0b6940149))
* **deps:** update dependency mongoose to v8.16.2 ([#63](https://github.com/dachrisch/energy.consumption/issues/63)) ([9ea1ebe](https://github.com/dachrisch/energy.consumption/commit/9ea1ebe2764003d2a145d7176fc26b31096db6ee))
* **deps:** update dependency react-datepicker to v8.4.0 ([#22](https://github.com/dachrisch/energy.consumption/issues/22)) ([dbfebd7](https://github.com/dachrisch/energy.consumption/commit/dbfebd7cfa704936f657f88bda97465845178cde))
* **deps:** update nextjs monorepo to v15.3.2 ([#12](https://github.com/dachrisch/energy.consumption/issues/12)) ([0a1e41d](https://github.com/dachrisch/energy.consumption/commit/0a1e41db0c2594adca7bd10d706814e2a671099e))
* **deps:** update nextjs monorepo to v15.3.3 ([#30](https://github.com/dachrisch/energy.consumption/issues/30)) ([bc562b6](https://github.com/dachrisch/energy.consumption/commit/bc562b6706747126f36efda17155a3f6c719a0bb))
* **deps:** update nextjs monorepo to v15.3.4 ([#50](https://github.com/dachrisch/energy.consumption/issues/50)) ([2d5dd05](https://github.com/dachrisch/energy.consumption/commit/2d5dd05b61133c4006284311f0b249d1dc3b727e))
* **deps:** update nextjs monorepo to v15.3.5 ([#60](https://github.com/dachrisch/energy.consumption/issues/60)) ([2dc956d](https://github.com/dachrisch/energy.consumption/commit/2dc956d59c1a18719b0276f8a3458155f53140ce))
* match types ([d9c4ae5](https://github.com/dachrisch/energy.consumption/commit/d9c4ae5e588f7132666ae433bb9e3cb86a2507cd))
* removed trailing slash ([ed4bf8d](https://github.com/dachrisch/energy.consumption/commit/ed4bf8d530f27efeed5821b6113601bd512ad9dd))

### [1.9.5](https://github.com/dachrisch/energy.consumption/compare/v1.9.4...v1.9.5) (2025-05-03)


### Bug Fixes

* add dashboard test ([0068238](https://github.com/dachrisch/energy.consumption/commit/0068238c6099f320e59035d6162bd8279f97841e))
* Parse dates correctly in API responses ([8d56dc2](https://github.com/dachrisch/energy.consumption/commit/8d56dc26b21ac239d333bc0df9dfcda6e764db3d))

### [1.9.4](https://github.com/dachrisch/energy.consumption/compare/v1.9.3...v1.9.4) (2025-04-28)

### [1.9.3](https://github.com/dachrisch/energy.consumption/compare/v1.9.2...v1.9.3) (2025-04-28)


### Bug Fixes

* handle dates consistently across app ([de2de7c](https://github.com/dachrisch/energy.consumption/commit/de2de7c2aeae21c6df24b6549387a1a6fdf074fb))

### [1.9.2](https://github.com/dachrisch/energy.consumption/compare/v1.9.1...v1.9.2) (2025-04-28)

### [1.9.1](https://github.com/dachrisch/energy.consumption/compare/v1.8.10...v1.9.1) (2025-04-28)


### Features

* add pond library ([f49134a](https://github.com/dachrisch/energy.consumption/commit/f49134ae3ae58e8a4e93ef246e9defc135bdd494))
* add time series handling for energy data ([86f6f32](https://github.com/dachrisch/energy.consumption/commit/86f6f3257f1ade14d139538bde349d9262c449b8))
* monthly view ([6eb5243](https://github.com/dachrisch/energy.consumption/commit/6eb5243e93f47ed608960da722bac846646e16bd))

## [1.9.0](https://github.com/dachrisch/energy.consumption/compare/v1.8.10...v1.9.0) (2025-04-27)


### Features

* add time series handling for energy data ([c79f9f3](https://github.com/dachrisch/energy.consumption/commit/c79f9f3423e5354d42388df5d68a3bc3506de003))

### [1.8.10](https://github.com/dachrisch/energy.consumption/compare/v1.8.9...v1.8.10) (2025-04-19)

### [1.8.9](https://github.com/dachrisch/energy.consumption/compare/v1.8.8...v1.8.9) (2025-04-19)

### [1.8.8](https://github.com/dachrisch/energy.consumption/compare/v1.8.7...v1.8.8) (2025-04-19)

### [1.8.7](https://github.com/dachrisch/energy.consumption/compare/v1.8.6...v1.8.7) (2025-04-19)

### [1.8.6](https://github.com/dachrisch/energy.consumption/compare/v1.8.5...v1.8.6) (2025-04-19)

### [1.8.5](https://github.com/dachrisch/energy.consumption/compare/v1.8.4...v1.8.5) (2025-04-19)


### Features

* Add app version to config and display in AppBar ([004f712](https://github.com/dachrisch/energy.consumption/commit/004f712cf2ff15f9dcc4ebfe3b6381c8121c7f17))

### [1.8.4](https://github.com/dachrisch/energy.consumption/compare/v1.8.3...v1.8.4) (2025-04-18)


### Features

* **contracts:** add EditIcon to contract components ([ea58d5b](https://github.com/dachrisch/energy.consumption/commit/ea58d5bae79c790928b6d203605f6345c4258630))

### [1.8.3](https://github.com/dachrisch/energy.consumption/compare/v1.8.2...v1.8.3) (2025-04-18)

### [1.8.2](https://github.com/dachrisch/energy.consumption/compare/v1.8.1...v1.8.2) (2025-04-18)


### Features

* Add cost analysis and contract validation ([d3516db](https://github.com/dachrisch/energy.consumption/commit/d3516db02c492bb272fdfce808a1eabd59b6cdfa))

### [1.8.1](https://github.com/dachrisch/energy.consumption/compare/v1.8.0...v1.8.1) (2025-04-18)

## [1.8.0](https://github.com/dachrisch/energy.consumption/compare/v1.7.3...v1.8.0) (2025-04-18)


### Features

* **contract:** add and display contracts ([b8c87e4](https://github.com/dachrisch/energy.consumption/commit/b8c87e428c73536822fa94c339be2f060506ac42))
* **contract:** add contract data ([297e2a8](https://github.com/dachrisch/energy.consumption/commit/297e2a8b71cf7f1727382eadc329349a3f9b9b77))
* **contract:** add contract data ([d2a9635](https://github.com/dachrisch/energy.consumption/commit/d2a9635c6c9876da163f27a0ad24acb86390b004))
* **contract:** add contract data ([b1ba528](https://github.com/dachrisch/energy.consumption/commit/b1ba5281eda9d322e5eca9b0b0b223df45bb20a7))

### [1.7.3](https://github.com/dachrisch/energy.consumption/compare/v1.7.2...v1.7.3) (2025-04-18)


### Features

* Add reusable AddEnergyDataIcon component ([2f9c8c5](https://github.com/dachrisch/energy.consumption/commit/2f9c8c565a0b9471956a72965e8f8befea742aee))

### [1.7.2](https://github.com/dachrisch/energy.consumption/compare/v1.7.1...v1.7.2) (2025-04-18)

### [1.7.1](https://github.com/dachrisch/energy.consumption/compare/v1.7.0...v1.7.1) (2025-04-18)


### Bug Fixes

* nicer color for dark theme ([28200c7](https://github.com/dachrisch/energy.consumption/commit/28200c758e30779f2f6ee8a453a55384bd506dbb))

## [1.7.0](https://github.com/dachrisch/energy.consumption/compare/v1.6.7...v1.7.0) (2025-04-17)


### Features

* **paging:** for table display ([eb322d5](https://github.com/dachrisch/energy.consumption/commit/eb322d5289b77b2c7edf981dddeaeca83486d2f3))

### [1.6.7](https://github.com/dachrisch/energy.consumption/compare/v1.6.6...v1.6.7) (2025-04-13)

### [1.6.6](https://github.com/dachrisch/energy.consumption/compare/v1.6.5...v1.6.6) (2025-04-13)

### [1.6.5](https://github.com/dachrisch/energy.consumption/compare/v1.6.4...v1.6.5) (2025-04-13)

### [1.6.4](https://github.com/dachrisch/energy.consumption/compare/v1.6.3...v1.6.4) (2025-04-13)

### [1.6.3](https://github.com/dachrisch/energy.consumption/compare/v1.6.2...v1.6.3) (2025-04-13)

### [1.6.2](https://github.com/dachrisch/energy.consumption/compare/v1.6.1...v1.6.2) (2025-04-13)

### [1.6.1](https://github.com/dachrisch/energy.consumption/compare/v1.6.0...v1.6.1) (2025-04-13)

## [1.6.0](https://github.com/dachrisch/energy.consumption/compare/v1.5.1...v1.6.0) (2025-04-13)


### Features

* **registration:** use feature flag to allow registration ([4d22d44](https://github.com/dachrisch/energy.consumption/commit/4d22d44a025d40057f953732170e073f3e54d21f))

### [1.5.1](https://github.com/dachrisch/energy.consumption/compare/v1.5.0...v1.5.1) (2025-04-13)


### Bug Fixes

* **user profile:** add user id to the database request ([298a641](https://github.com/dachrisch/energy.consumption/commit/298a641f2a18f3888d4190eb20dff453d2f667b2))

## [1.5.0](https://github.com/dachrisch/energy.consumption/compare/v1.4.1...v1.5.0) (2025-04-13)


### Features

* **profile:** update user profile ([8d8fe7e](https://github.com/dachrisch/energy.consumption/commit/8d8fe7e67175e702ff939098c93211954e3f6e75))
* **user:** add data per user ([5e3c784](https://github.com/dachrisch/energy.consumption/commit/5e3c7844ff83e923d827e2b4982a2e9084437a57))

### [1.4.1](https://github.com/dachrisch/energy.consumption/compare/v1.4.0...v1.4.1) (2025-04-12)

## [1.4.0](https://github.com/dachrisch/energy.consumption/compare/v1.3.4...v1.4.0) (2025-04-12)


### Features

* **EnergyTableFilters:** Added React Date Picker with date range selection ([4eeacf6](https://github.com/dachrisch/energy.consumption/commit/4eeacf6a4faf783bb2c39259b1698d6b9a2e507d))

### [1.3.4](https://github.com/dachrisch/energy.consumption/compare/v1.3.3...v1.3.4) (2025-04-12)

### [1.3.3](https://github.com/dachrisch/energy.consumption/compare/v1.3.2...v1.3.3) (2025-04-12)

### [1.3.2](https://github.com/dachrisch/energy.consumption/compare/v1.3.1...v1.3.2) (2025-04-12)

### [1.3.1](https://github.com/dachrisch/energy.consumption/compare/v1.3.0...v1.3.1) (2025-04-11)

## [1.3.0](https://github.com/dachrisch/energy.consumption/compare/v1.2.0...v1.3.0) (2025-04-11)


### Features

* **chart:** energy charts ([0263ed4](https://github.com/dachrisch/energy.consumption/commit/0263ed419da75a29688aaa83d0f3a9aaeda24888))

## [1.2.0](https://github.com/dachrisch/energy.consumption/compare/v1.1.0...v1.2.0) (2025-04-11)

## [1.1.0](https://github.com/dachrisch/energy.consumption/compare/v1.0.7...v1.1.0) (2025-04-11)

### [1.0.7](https://github.com/dachrisch/energy.consumption/compare/v1.0.6...v1.0.7) (2025-04-10)

### [1.0.6](https://github.com/dachrisch/energy.consumption/compare/v1.0.5...v1.0.6) (2025-04-10)

### [1.0.5](https://github.com/dachrisch/energy.consumption/compare/v1.0.4...v1.0.5) (2025-04-10)

### [1.0.4](https://github.com/dachrisch/energy.consumption/compare/v1.0.3...v1.0.4) (2025-04-10)

### [1.0.3](https://github.com/dachrisch/energy.consumption/compare/v1.0.2...v1.0.3) (2025-04-10)

### [1.0.2](https://github.com/dachrisch/energy.consumption/compare/v1.0.1...v1.0.2) (2025-04-10)

### [1.0.1](https://github.com/dachrisch/energy.consumption/compare/v1.0.0...v1.0.1) (2025-04-10)

## 1.0.0 (2025-04-10)


### Features

* **energy:** copy from clipboard ([daca7e5](https://github.com/dachrisch/energy.consumption/commit/daca7e5847fbd2d9bed6407841d08a08ad8ff166))

### Fixed
- **December Consumption Calculation**: December now uses January of the next year for consumption calculation, ensuring all months (except the first month in the entire dataset) show consumption values
  - January consumption = January - December(previous year)
  - December consumption = January(next year) - December(current year)
  - Added 8 comprehensive tests for boundary month logic
  - Component now passes `nextJanuary` parameter alongside `previousDecember`
