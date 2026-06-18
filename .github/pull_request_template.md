## Summary
- Ticket:
- Scope:
- Risk:

## Change Type
- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Docs
- [ ] CI/CD
- [ ] Tests / Guards
- [ ] Tool registry / generated data

## Release Checklist
- [ ] User-facing behavior and acceptance criteria are covered
- [ ] i18n keys updated across all supported locales, if applicable
- [ ] Tool manifest, metadata, related tools, and generated registry files updated, if applicable
- [ ] Tests or guards updated for changed behavior or structure
- [ ] Desktop, mobile, keyboard, and focus states checked for UI changes
- [ ] No secrets, private payloads, local reports, or process files committed

## Commands Run
- [ ] `npm run check:audit:prod-high`
- [ ] `npm run generate:tool-index`
- [ ] `npm run check:tool-index`
- [ ] `npm run generate:client-tool-lookup`
- [ ] `npm run check:client-tool-lookup`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run check:types`
- [ ] `npm run validate`
- [ ] `npm run build`
- [ ] `npm run test:e2e:smoke`

## Route Metadata / Export Checklist
- [ ] Canonical/hreflang checks pass
- [ ] Content template sections present and localized when required
- [ ] Static export post-processing checks pass

## Validation Evidence
- Commands run:
- Key output:
- Screenshots / recordings:

## Rollback Plan
- What to revert:
- User impact:
