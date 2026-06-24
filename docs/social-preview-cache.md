# Social Preview Cache Notes

Open Graph and Twitter card images are static JPEG files generated at 1200x630.

Run `npm run generate:og-tool-images` after tool titles, categories, workflow pages, comparison pages, or high-value guide metadata changes. For small content-only additions, `npm run generate:og-tool-images -- --missing-only` can create only absent files.

Social preview caches are controlled by external platforms. After deploying changed images, validate the URL with the target platform preview debugger and request a re-scrape where the platform supports it. Do not add user input, file names, tokens, prompts, logs, request bodies, response bodies, or generated tool output to social image filenames, metadata, or image text.
