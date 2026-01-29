# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.8.10](https://github.com/dachrisch/energy.consumption/compare/v3.8.9...v3.8.10) (2026-01-29)


### Features

* display discovered meter type in scan results ([65b9477](https://github.com/dachrisch/energy.consumption/commit/65b9477bb56d02d2a3da6aa51a58a69f4e0b4887))
* enhance Gemini prompt for better meter type discovery ([51e8360](https://github.com/dachrisch/energy.consumption/commit/51e83602011ec8435c276cb8523d0ca2fef5bab4))
* include discovered meter type in OCR scan API response ([7d76397](https://github.com/dachrisch/energy.consumption/commit/7d763978dcef52e992f4e14fa4188cbca27edc10))

### [3.8.9](https://github.com/dachrisch/energy.consumption/compare/v3.8.8...v3.8.9) (2026-01-29)

### [3.8.8](https://github.com/dachrisch/energy.consumption/compare/v3.8.7...v3.8.8) (2026-01-29)

### [3.8.7](https://github.com/dachrisch/energy.consumption/compare/v3.8.6...v3.8.7) (2026-01-29)

### [3.8.6](https://github.com/dachrisch/energy.consumption/compare/v3.8.5...v3.8.6) (2026-01-29)

### [3.8.5](https://github.com/dachrisch/energy.consumption/compare/v3.8.4...v3.8.5) (2026-01-29)


### Bug Fixes

* use boolean capture attribute to allow camera + gallery choice on mobile ([e9786a1](https://github.com/dachrisch/energy.consumption/commit/e9786a1356579acb5ef055b5a6a16d11be5d981c))

### [3.8.4](https://github.com/dachrisch/energy.consumption/compare/v3.8.3...v3.8.4) (2026-01-29)


### Bug Fixes

* provide dummy ENCRYPTION_KEY for Docker image test ([1affaf1](https://github.com/dachrisch/energy.consumption/commit/1affaf168116539d8639e7df9de6816150e0d347))

### [3.8.3](https://github.com/dachrisch/energy.consumption/compare/v3.8.2...v3.8.3) (2026-01-29)

### [3.8.2](https://github.com/dachrisch/energy.consumption/compare/v3.8.1...v3.8.2) (2026-01-29)


### Bug Fixes

* defer strict ENCRYPTION_KEY check to runtime to allow builds without it ([474dbf0](https://github.com/dachrisch/energy.consumption/commit/474dbf0c1d3557d2a19ef929360fec6837433cd3))

### [3.8.1](https://github.com/dachrisch/energy.consumption/compare/v3.8.0...v3.8.1) (2026-01-29)

## [3.8.0](https://github.com/dachrisch/energy.consumption/compare/v3.7.1...v3.8.0) (2026-01-29)


### Features

* add build version display in profile with CI injection ([#285](https://github.com/dachrisch/energy.consumption/issues/285)) ([6b461fe](https://github.com/dachrisch/energy.consumption/commit/6b461fe2ed9dc93defbad19f750fd2f080a07111))


### Bug Fixes

* allow photo picker to select from gallery on mobile ([#284](https://github.com/dachrisch/energy.consumption/issues/284)) ([ff02dc1](https://github.com/dachrisch/energy.consumption/commit/ff02dc1dd80f817c33164a07f27083c474dd69e7))

### [3.7.1](https://github.com/dachrisch/energy.consumption/compare/v3.7.0...v3.7.1) (2026-01-29)

## [3.7.0](https://github.com/dachrisch/energy.consumption/compare/v3.6.0...v3.7.0) (2026-01-29)


### Features

* integrate gemini ocr with auto-meter matching and user-specific api keys ([a940642](https://github.com/dachrisch/energy.consumption/commit/a940642005aa22f249645159189e051cc5dbf2b6))

## [3.6.0](https://github.com/dachrisch/energy.consumption/compare/v3.5.0...v3.6.0) (2026-01-28)


### Features

* remove OCR feature due to accuracy issues ([b281f6c](https://github.com/dachrisch/energy.consumption/commit/b281f6c2e69e38d34925e4a236221551782a58cb))

## [3.5.0](https://github.com/dachrisch/energy.consumption/compare/v3.4.0...v3.5.0) (2026-01-28)


### Features

* implement registration feature flag (ALLOW_SIGNUP) ([823065f](https://github.com/dachrisch/energy.consumption/commit/823065fafeaece27edb72c522c3297d3fd670c2b))

## [3.4.0](https://github.com/dachrisch/energy.consumption/compare/v3.3.0...v3.4.0) (2026-01-28)


### Features

* display daily cost average on meter details page ([27b33bc](https://github.com/dachrisch/energy.consumption/commit/27b33bcb73f9a936132690f7c808795e9c2d8dcd))
* pre-select first meter in CSV import and add warning if no meters available ([b02fdff](https://github.com/dachrisch/energy.consumption/commit/b02fdff7ae8c920e56d068fdd13bb9d9e61a7286))


### Bug Fixes

* correct static file paths in production server ([d7ad9c2](https://github.com/dachrisch/energy.consumption/commit/d7ad9c2cff2e5a5382d077c70e7348a88dd925c2))
* downgrade express to v4 and optimize backend bundle for production ([979ba17](https://github.com/dachrisch/energy.consumption/commit/979ba1768c2d94864012f5cfbdc79aed80ce171b))
* implement production node server to resolve api registration error ([92fe904](https://github.com/dachrisch/energy.consumption/commit/92fe904c8aca84ef86e0becfb196ebc33353b5bf))
* restore HEALTHCHECK to Dockerfile for CI tests ([484048a](https://github.com/dachrisch/energy.consumption/commit/484048a962be4aa90e31ed7dc212369820cb2d8e))

### [3.3.1](https://github.com/dachrisch/energy.consumption/compare/v3.3.0...v3.3.1) (2026-01-28)


### Features

* display daily cost average on meter details page ([27b33bc](https://github.com/dachrisch/energy.consumption/commit/27b33bcb73f9a936132690f7c808795e9c2d8dcd))
* pre-select first meter in CSV import and add warning if no meters available ([b02fdff](https://github.com/dachrisch/energy.consumption/commit/b02fdff7ae8c920e56d068fdd13bb9d9e61a7286))


### Bug Fixes

* implement production node server to resolve api registration error ([92fe904](https://github.com/dachrisch/energy.consumption/commit/92fe904c8aca84ef86e0becfb196ebc33353b5bf))

## [3.3.0](https://github.com/dachrisch/energy.consumption/compare/v3.2.0...v3.3.0) (2026-01-28)


### Features

* use time scale for chronological chart spacing ([7980ba7](https://github.com/dachrisch/energy.consumption/commit/7980ba74be9590dd5713e7728701c030476a2471))


### Bug Fixes

* resolve more any types and fix linting ([6ba27ea](https://github.com/dachrisch/energy.consumption/commit/6ba27eadd75b5bb6d2a55a5b8ef9e51d1e70e7c7))
* resolve more linting issues and remove console logs ([afcacda](https://github.com/dachrisch/energy.consumption/commit/afcacda16740dc21820f02ec9dcd91bb9a74cd55))
* resolve remaining linting errors and reduce warnings ([20e1a97](https://github.com/dachrisch/energy.consumption/commit/20e1a972f921aadeed59f9060ae0558295f30561))
* resolve typescript errors and strict linting rules ([737cdea](https://github.com/dachrisch/energy.consumption/commit/737cdeafff6c5aaa2994f81bb4c3aacb4e09b6ff))

## [3.2.0](https://github.com/dachrisch/energy.consumption/compare/v3.1.0...v3.2.0) (2026-01-27)


### Features

* 2-column meter grid and daily cost metric ([ae713be](https://github.com/dachrisch/energy.consumption/commit/ae713be663bf69d02ef253cb30b34e173c291ba9))
* contract gap detection and warning indicators ([37d9db5](https://github.com/dachrisch/energy.consumption/commit/37d9db5c9babd4cef26aecd3a6d522591a95037c))
* contract templates for coverage gaps ([105ac07](https://github.com/dachrisch/energy.consumption/commit/105ac07fcd02bdb39c7e69a650c9d5d0dce2120d))
* implement contract gap detection, projections and sorted contract list ([823f85d](https://github.com/dachrisch/energy.consumption/commit/823f85d20446bbe9a17ce98b967523099efca48e))
* non-blocking reading deletion with undo and robust consumption calculation ([baf7375](https://github.com/dachrisch/energy.consumption/commit/baf737524b0636752511f275539a5822030560e1))

## [3.1.0](https://github.com/dachrisch/energy.consumption/compare/v3.0.1...v3.1.0) (2026-01-27)


### Features

* **conductor:** initialize CSV and Photo import track ([4d57af4](https://github.com/dachrisch/energy.consumption/commit/4d57af4dbb98e0084ecdbb0997b89b6ffc4cfc66))
* implement AI photo OCR for reading entry ([ec07351](https://github.com/dachrisch/energy.consumption/commit/ec07351266a7f24f75b8ae14dfddde3194b711a5))
* implement CSV parser and bulk reading backend logic ([bac4f02](https://github.com/dachrisch/energy.consumption/commit/bac4f02ad660361180925cd1ba17a0cb4798ee6d))
* **ui:** add CSV import modal to dashboard ([6f2c653](https://github.com/dachrisch/energy.consumption/commit/6f2c6537dfe888da9b7e6137d1925011af5a5880))
* **ui:** enhance dashboard with dynamic summaries and contract prompts ([a696d8b](https://github.com/dachrisch/energy.consumption/commit/a696d8b28fd66e33510739895ee2dc4eae0e5ac0))
* **ui:** simplify CSV mapping and add locale-aware number parsing ([f63d33d](https://github.com/dachrisch/energy.consumption/commit/f63d33d390f19ff84fecd1c83505d1ea21ca8920))
* **ui:** support clipboard paste for CSV import ([cd5f558](https://github.com/dachrisch/energy.consumption/commit/cd5f558d7436b8cf398367174e18138692e24335))


### Bug Fixes

* restore missing parseDate function in CsvImportModal ([4d68e3e](https://github.com/dachrisch/energy.consumption/commit/4d68e3ef84f7ea035fa15f9a7141961ccc3e7238))

### [3.0.1](https://github.com/dachrisch/energy.consumption/compare/v0.0.1...v3.0.1) (2026-01-26)

### [0.0.1](https://github.com/dachrisch/energy.consumption/compare/v2.5.1...v0.0.1) (2026-01-25)


### Features

* **api:** implement financial aggregation logic and endpoint ([9ab795f](https://github.com/dachrisch/energy.consumption/commit/9ab795f45c23f3720c1985432123a658c075aec2))
* **architecture:** Phase 2 - Frontend Adapter Layer Implementation ([4295eaa](https://github.com/dachrisch/energy.consumption/commit/4295eaa7bee9180639c2dace25d59e3e33a3a510))
* **auth:** implement shadcn-based login and register pages ([5d74647](https://github.com/dachrisch/energy.consumption/commit/5d746471e31a152ec5dac82c74a15770a1acefca))
* **chart:** phase 2 - implement inverted chart configuration ([ac5c4c5](https://github.com/dachrisch/energy.consumption/commit/ac5c4c5b95170997508e05ec5de3924e4c706ca6))
* **chart:** phase 3 - refactor component for responsive switching ([96558de](https://github.com/dachrisch/energy.consumption/commit/96558dedf731029fe26c4ca79d9e1c700c5ffc8e))
* **data-entry:** implement transparent meter and reading flow ([b1608e6](https://github.com/dachrisch/energy.consumption/commit/b1608e66544af5555e0af173d8782d5a431a44f2))
* implement AuthProvider and ProtectedRoute for secure navigation ([4e53327](https://github.com/dachrisch/energy.consumption/commit/4e5332714fc90692dc55d7aedae4d76f674fecec))
* implement profile and contract management with e2e tests ([a30fd8c](https://github.com/dachrisch/energy.consumption/commit/a30fd8c191ef34d800d39a4cc9dec7bd9d1c1c28))
* **insights:** Remove Monthly Breakdown section for a cleaner UI ([55bb93e](https://github.com/dachrisch/energy.consumption/commit/55bb93e95b3c838be0c2921a44a8b9a1d619fadc))
* **layout:** implement global card foundation and fluid typography ([5033cb8](https://github.com/dachrisch/energy.consumption/commit/5033cb848443e1de8a7160189f18f1a26a175447))
* **models:** implement Meter and Reading schemas ([3cdd2de](https://github.com/dachrisch/energy.consumption/commit/3cdd2de7fbc4b33e8779df24e866c8801311b464))
* **nav:** overhaul navigation with desktop top-nav and mobile bottom-nav ([e4fc661](https://github.com/dachrisch/energy.consumption/commit/e4fc661e005e8f31a0ce23f7a933d8ba5de6b642))
* **projections:** expose projections via server action and update service factory ([9419bca](https://github.com/dachrisch/energy.consumption/commit/9419bca43e33a5d4da38305544572ce63e7813e9))
* **projections:** implement contract management and simplified projections ([f184fa7](https://github.com/dachrisch/energy.consumption/commit/f184fa7d439ef18e2c52670f037ccabfc5ab5a1e))
* **projections:** implement core projection logic and cost estimation ([503ac59](https://github.com/dachrisch/energy.consumption/commit/503ac5996672dcfb87b682014a588783b5c32bfd))
* **projections:** implement dashboard visualization components and integration ([b5b118d](https://github.com/dachrisch/energy.consumption/commit/b5b118d0cf46fc7f2a4fa329185685f10e2f959c))
* **projections:** implement ProjectionService and Contract repository ([691d6d0](https://github.com/dachrisch/energy.consumption/commit/691d6d0760ad1cc0d9bbc3f9027d6293e713f760))
* **radix-slider:** complete implementation and fix regressions ([9e84337](https://github.com/dachrisch/energy.consumption/commit/9e84337f93865df912635eaebab394acd785de87))
* **radix-slider:** date-to-slider mapping logic ([6100308](https://github.com/dachrisch/energy.consumption/commit/61003081c9e9067744db380fbe4698da3ae662e2))
* **radix-slider:** implement accessible range slider and refactor visualization ([eb9d719](https://github.com/dachrisch/energy.consumption/commit/eb9d719bf3037e587c12bf421f2e845d5e36c8c0))
* **radix-slider:** project setup and dependency installation ([120e09a](https://github.com/dachrisch/energy.consumption/commit/120e09a9305023efd135a97ffd1341dd738a0aa6))
* **radix-slider:** state integration and mobile polish ([c0f9c51](https://github.com/dachrisch/energy.consumption/commit/c0f9c51d5e4f9b577b4b3b2b3ea5403f6b7fab73))
* **restart:** complete unified simplified restart implementation ([fa96564](https://github.com/dachrisch/energy.consumption/commit/fa965645bb3040d71c025ab57ca57f113bb2576b))
* **shadcn:** initialize shadcn/ui and base theme ([5db803a](https://github.com/dachrisch/energy.consumption/commit/5db803abd9302204c660f8f17d6b873d40f8a96b))
* **tooling:** add feature flag management script and testing guide ([d88d7a2](https://github.com/dachrisch/energy.consumption/commit/d88d7a2177a71812c4f5a662e82ca3a45a41d71f))
* **tooling:** add MongoDB collection dump script for easy inspection ([c50df50](https://github.com/dachrisch/energy.consumption/commit/c50df505288744adfc02f9486543ef0cfb295a73))
* **ui:** enhance Add Reading with meter selection and persistence ([851f7f2](https://github.com/dachrisch/energy.consumption/commit/851f7f2cd786772b84907d11d17341758b70292f))
* **ui:** implement financial cockpit dashboard with aggregated costs ([298000f](https://github.com/dachrisch/energy.consumption/commit/298000f6096d103b2e91372c0352dba46aac656d))
* **ui:** implement global Toast and Confirm system and remove native dialogs ([1f4fc23](https://github.com/dachrisch/energy.consumption/commit/1f4fc236692983dee69331634a1eea6abe3dba98))
* **ui:** implement mobile-responsive bottom navigation ([a375747](https://github.com/dachrisch/energy.consumption/commit/a375747e63e51f9c7502c2cb5bffbc331d34323c))
* **ui:** refine meter pre-selection logic in AddReading ([e15701c](https://github.com/dachrisch/energy.consumption/commit/e15701c5805f62156017690e2429e881c2133439))
* **ui:** reorganize routes and add dedicated /meters view ([34bd603](https://github.com/dachrisch/energy.consumption/commit/34bd6035c6beecac9b68ed48d67376ae76b4ad4f))
* **ux:** apply custom colorffy dark theme palette ([c51f126](https://github.com/dachrisch/energy.consumption/commit/c51f1266badfce27c489547be561fd09e52673c4))
* **ux:** optimize touch targets and clean up CSS stability ([d2ff493](https://github.com/dachrisch/energy.consumption/commit/d2ff493dba45ccd1153cc4b6695e4b430dafab94))


### Bug Fixes

* **ci:** add Docker healthcheck and improve test robustness ([070ba6a](https://github.com/dachrisch/energy.consumption/commit/070ba6ad1cc39bd50aaa0d4263d6b28b0a2ec326))
* **ci:** make docker healthcheck more aggressive ([3bb2494](https://github.com/dachrisch/energy.consumption/commit/3bb2494e69f3290036a59eb84facf4f52b5f059a))
* **ci:** use correct vitest reporter flag ([abde8a5](https://github.com/dachrisch/energy.consumption/commit/abde8a5967a59f2f92d1ab8c9c59ce023fcfb0d2))
* **ci:** use correct vitest reporter flag ([a68ac72](https://github.com/dachrisch/energy.consumption/commit/a68ac72aeca3745401de041f4c8f4e5b33bd1b21))
* **ci:** use nc for healthcheck and improve diagnostics ([dbbae57](https://github.com/dachrisch/energy.consumption/commit/dbbae57b8d6cb3c1bb9be53ffab3333cda9c5268))
* correct TypeScript type errors in display-data route ([405f0ec](https://github.com/dachrisch/energy.consumption/commit/405f0ec28f4433c6e23b95c81a38e20283190db6))
* **deps:** update nextjs monorepo to v16.1.0 ([#254](https://github.com/dachrisch/energy.consumption/issues/254)) ([320c984](https://github.com/dachrisch/energy.consumption/commit/320c984874df27f2420f77012dcfb8cf71fccf84))
* **deps:** update nextjs monorepo to v16.1.1 ([#257](https://github.com/dachrisch/energy.consumption/issues/257)) ([6230031](https://github.com/dachrisch/energy.consumption/commit/6230031293a6eab5cfc93988d34ffa309c311975))
* **deps:** update nextjs monorepo to v16.1.2 ([#273](https://github.com/dachrisch/energy.consumption/issues/273)) ([93d7ff0](https://github.com/dachrisch/energy.consumption/commit/93d7ff089d2e4bed34614e12a71d7d6fb79fc838))
* **deps:** update nextjs monorepo to v16.1.3 ([#276](https://github.com/dachrisch/energy.consumption/issues/276)) ([20c490d](https://github.com/dachrisch/energy.consumption/commit/20c490d0278fc0cd4f17357a13fbbcdc9e66aa15))
* **docker:** use 127.0.0.1 for healthcheck to avoid resolution issues ([a470f24](https://github.com/dachrisch/energy.consumption/commit/a470f245c189f967a9830fccf7452fa3aba1b303))
* health endpoint status code and release script improvements ([#263](https://github.com/dachrisch/energy.consumption/issues/263)) ([9399a95](https://github.com/dachrisch/energy.consumption/commit/9399a959ffcec8877a17be50b49284cdab2f5e1d))
* **lint:** resolve all eslint errors and reduce warnings ([deca85d](https://github.com/dachrisch/energy.consumption/commit/deca85d5af2b7da97bbdc835d37bdc8b6e7549b7))
* resolve all ESLint errors to pass CI checks ([9bc7a33](https://github.com/dachrisch/energy.consumption/commit/9bc7a33a7aeea1b08ee7bdc2f2609001d588ff34))
* resolve all unit test failures (108 → 0) ([7e08dc9](https://github.com/dachrisch/energy.consumption/commit/7e08dc94f508c2c3d8b528590ef6a79b3b789ec0))
* resolve dev server login by specifying dbName and adding auth logging ([24c4e03](https://github.com/dachrisch/energy.consumption/commit/24c4e03a493686250d1a15b47a675076d96251ea))
* **testing:** resolve integration test infrastructure issues ([1ff8182](https://github.com/dachrisch/energy.consumption/commit/1ff81820a1fe0aee8864edbfd4590a08b78fa0da))
* **tooling:** prevent MongoDB connection error in flag manager script ([4e8829f](https://github.com/dachrisch/energy.consumption/commit/4e8829fa76c486e7a8c9a9b55972f36db22cdae3))
* **types:** resolve typescript errors in component, models and config ([7d4800d](https://github.com/dachrisch/energy.consumption/commit/7d4800dfb7918486f8d57ba59a3fdd1c271204f0))
* **ui:** resolve routing conflict for Quick Add and add empty states ([2b64387](https://github.com/dachrisch/energy.consumption/commit/2b643876fb4ef4e020db8416c056b94fe85b49ba))
