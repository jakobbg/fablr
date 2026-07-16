.PHONY: smoke lint-smoke release-notes release

RELEASE_NOTES_FILE ?= .release-notes.md

lint-smoke:
	php -l tests/smoke.php
	php -l tests/media_stream_smoke.php
	php -l tests/web_utils_smoke.php
	php -l tests/structure_smoke.php
	php -l tests/metadata_smoke.php
	php -l tests/utils_smoke.php
	php -l tests/markdown_smoke.php

smoke: lint-smoke
	sh tests/run_smoke.sh

release-notes:
	@printf '%s\n' \
		'## Changes' \
		'- Add change summary bullet 1.' \
		'- Add change summary bullet 2.' \
		'' \
		'## Validation' \
		'- make smoke' \
		> "$(RELEASE_NOTES_FILE)"
	@echo "Wrote $(RELEASE_NOTES_FILE). Edit it before running make release VERSION=x.y.z"

release:
	@[ -n "$(VERSION)" ] || (echo "Usage: make release VERSION=1.8.4" && exit 1)
	@command -v gh >/dev/null 2>&1 || (echo "GitHub CLI (gh) is required" && exit 1)
	@test -f "$(RELEASE_NOTES_FILE)" || (echo "Missing $(RELEASE_NOTES_FILE). Run make release-notes first." && exit 1)
	@git diff --quiet && git diff --cached --quiet || (echo "Working tree is not clean. Commit or stash changes first." && exit 1)
	@git rev-parse "v$(VERSION)" >/dev/null 2>&1 && (echo "Tag v$(VERSION) already exists" && exit 1) || true
	git push origin main
	git tag -a "v$(VERSION)" -F "$(RELEASE_NOTES_FILE)"
	git push origin "v$(VERSION)"
	gh release create "v$(VERSION)" --title "v$(VERSION)" --notes-file "$(RELEASE_NOTES_FILE)"
