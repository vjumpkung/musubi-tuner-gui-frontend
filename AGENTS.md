# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React TypeScript frontend. Application code lives in `src/`, with the entry point in `src/main.tsx` and the root UI switchboard in `src/App.tsx`. Feature UI is organized under `src/components/`: `training/`, `inference/`, `logs/`, `settings/`, plus `sidebar.tsx`. Shared training controls live in `src/components/training/shared/`, and model-specific training pieces live in `src/components/training/model_specific/`. Reusable hooks belong in `src/hooks/`. Static assets are served from `public/`, such as `public/logo.png`. Build output in `dist/` is generated and ignored.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the Vite development server.
- `pnpm build`: run TypeScript checks with `tsc`, then create the production Vite build.
- `pnpm preview`: preview the production build locally with Vite.
- `pnpm start`: serve `dist/` with `serve -s ./dist`.
- `pnpm format`: format `src/` using Prettier.
- `pnpm format:check`: check formatting without modifying files.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the repository Prettier settings: 4-space indentation, single quotes, no semicolons, LF endings, no trailing commas, and 100-character line width. Imports and Tailwind classes are sorted by the configured Prettier plugins. Use `PascalCase` for component symbols, `useCamelCase` for hooks, and keep existing file naming patterns for model modules such as `flux_kontext.tsx` and `hunyuan_video.tsx`.

## Testing Guidelines

No test runner is currently configured in `package.json`. For now, validate changes with `pnpm build` and `pnpm format:check`. When adding tests, add an explicit test script and keep tests close to the code they cover, using names like `component-name.test.tsx` or a clear `src/__tests__/` folder. Cover menu routing, model-specific form behavior, and terminal/log interactions when those areas change.

## Commit & Pull Request Guidelines

Existing commits use short, lower-case imperative messages such as `add mock` and `add basic menu`. Keep commits focused and concise; include a scope when helpful, for example `add wan inference controls`. Pull requests should include a brief summary, linked issue if applicable, verification commands run, and screenshots or screen recordings for visible UI changes. Note any configuration or environment changes explicitly.

## Security & Configuration Tips

Do not commit `.env`, `*.env`, `node_modules/`, or `dist/`. Keep secrets in local environment files and document required variables without including real values.
