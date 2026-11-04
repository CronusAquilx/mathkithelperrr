# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Console Mode

Sony Console includes Games and Media home screens, real cloud and arcade games, install/uninstall and wishlist menus, an app library, profile editing, background selection, and device/layout setup. Installations are library shortcuts simulated locally per signed-in user; provider subscriptions and hardware requirements still apply.

### Adding a skin

A skin consists of scoped theme tokens in `src/styles.css`, a layout configuration in `src/lib/console/skins.ts`, and home/store/library/settings/profile components. Add its ID to preferences, register the components in `ConsoleScreen`, and expose it in layout selection only once those screens work. Reuse `useConsoleCtx`, `useConsoleInput`, catalog queries, and library actions; do not change classic/launcher or gameplay layouts. Focus sounds default off and all motion respects reduced-motion preferences. Xbox skins remain separate future work.
