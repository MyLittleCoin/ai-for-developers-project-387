# Changelog

## [1.1.1](https://github.com/MyLittleCoin/ai-for-developers-project-387/compare/calendar-booking-service-v1.1.0...calendar-booking-service-v1.1.1) (2026-08-31)


### Documentation

* **web:** прокомментировать formatDuration ([08f883b](https://github.com/MyLittleCoin/ai-for-developers-project-387/commit/08f883bc0b3ebc1b2281a86e59c7fe6c28449854))


### Miscellaneous Chores

* **ci:** switch opencode model to deepseek-v4-flash-free ([68c2ef5](https://github.com/MyLittleCoin/ai-for-developers-project-387/commit/68c2ef5350203254ea3df09eaee7f5cf16b9fb01))
* **ci:** switch opencode model to openrouter ([9fa47b9](https://github.com/MyLittleCoin/ai-for-developers-project-387/commit/9fa47b94d1450ccf2a428ed046fd1f78c44bfbe5))


### Continuous Integration

* **opencode:** switch to self-hosted runner and local vLLM model ([b7b78c4](https://github.com/MyLittleCoin/ai-for-developers-project-387/commit/b7b78c423fddd58101fa498ac3f7d3e7c16c76bc))
* **release:** add release-please workflow and config ([6197f87](https://github.com/MyLittleCoin/ai-for-developers-project-387/commit/6197f87d18d3dd2f82d198473fa30cf50683f931))
* **release:** fix release-please action name ([a6da555](https://github.com/MyLittleCoin/ai-for-developers-project-387/commit/a6da555afdcf8fc4f2a7cec25f017770a7b57d6c))

## [1.1.0](https://github.com/MyLittleCoin/ai-for-developers-project-386/compare/v1.0.0...v1.1.0) (2026-08-16)


### Features

* guest schedule of meetings and owner-mode switch ([4ebce5e](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/4ebce5eaf916f8141a171230bab8c84722ea566a))
* **web:** render /schedule as a calendar view ([5b126e5](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/5b126e56226f518e5f3c65f05e5804220b840024))

## 1.0.0 (2026-08-16)


### Features

* **server:** backend API implementation per contract ([138310b](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/138310b7411847232b8440d59ed1c08db02389ac))
* **web:** admin event-types table, create dialog, detail page + tests ([c8544e6](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/c8544e6c9442058eaa78d1c10a00bcf985d00c46))
* **web:** admin upcoming bookings table + tests ([3c8d218](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/3c8d218710a8a1af51fe9662e75c4d75f26ffd94))
* **web:** api client with typed wrappers, error mapping, date utils, vitest setup ([f07bfe8](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/f07bfe8c32bd13065d7fa5f0dfe539af06872c49))
* **web:** guest event-type list with cards and tests ([06d255c](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/06d255c81a958dfa512e9d8148d86b60cbb2d4a3))
* **web:** guest slot picker, booking form, booking flow + conflict handling ([475b75a](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/475b75afba65b28226c5eef06f1ac1bcf35a285a))
* **web:** router shell, layouts, toaster, not-found page ([0f1b8e5](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/0f1b8e547fe4bcc602115b7de7613ecc632b7210))


### Bug Fixes

* **e2e:** add @types/node for tsconfig typecheck ([897068b](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/897068b2c69b3cf1f0233c0151bc795072a58401))
* **e2e:** final review fixes (gaps reservation, day-switch assert, docs) ([4b9dde1](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/4b9dde10e46f469183fb906bd31d66618def57e7))
* **web:** import schema types via api re-exports ([202f7c0](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/202f7c087df6bd3b75379f2f4d427ce100f204ce))
* **web:** proxy rewrite to strip /api/v1 for prism mock ([20e0304](https://github.com/MyLittleCoin/ai-for-developers-project-386/commit/20e03046b949aa7cf65bc3588523157568b01ae1))
