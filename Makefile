.PHONY: help build test typecheck demo-mindspire demo-saasify release

.DEFAULT_GOAL := help

help:
	@echo "Zorveus SDK Monorepo Commands:"
	@echo "  make build                 Build @zorveus/sdk and @zorveus/react packages"
	@echo "  make test                  Run Vitest test suite"
	@echo "  make typecheck             Run TypeScript typecheck across workspace"
	@echo "  make demo-mindspire        Start MindSpire Studio React demo app"
	@echo "  make demo-saasify          Start SaaSify Suite React demo app"
	@echo "  make release VERSION=X.Y.Z Update package versions, commit, tag, and trigger release"

build:
	npm run build

test:
	npm run test

typecheck:
	npm run typecheck

demo-mindspire:
	npm run demo:mindspire

demo-saasify:
	npm run demo:saasify

release:
	@if [ -z "$(VERSION)" ]; then \
		echo "Error: VERSION is required. Example: make release VERSION=0.2.0"; \
		exit 1; \
	fi
	@echo "Updating package versions to $(VERSION)..."
	@npm pkg set version=$(VERSION) --workspace=@zorveus/sdk --workspace=@zorveus/react
	@npm run build
	@npm run typecheck
	@npm run test
	@git add packages/sdk/package.json packages/react/package.json
	@git commit -m "release: v$(VERSION)"
	@git tag -a "v$(VERSION)" -m "Release v$(VERSION)"
	@git push origin main --tags
	@echo "Version updated, committed, and tag v$(VERSION) pushed to GitHub!"
