export const STORE_APPS = [
  { id: "music", title: "Birch Music", category: "Entertainment", detail: "Your music, playlists and discoveries", tone: "green" },
  { id: "movies", title: "Movies & Anime", category: "Entertainment", detail: "Movies, shows and animation", tone: "coral" },
  { id: "games", title: "Birch Arcade", category: "Gaming", detail: "Arcade and cloud games", tone: "cyan" },
  { id: "web", title: "Birch Browser", category: "Productivity", detail: "Your window to the web", tone: "cyan" },
  { id: "chat", title: "BirchBlock AI", category: "Productivity", detail: "Chat with your personal assistant", tone: "gold" },
  { id: "memory", title: "Memory", category: "Productivity", detail: "Your saved notes and memories", tone: "violet" },
  { id: "voice", title: "Voice", category: "Productivity", detail: "Talk with BirchBlock", tone: "rose" },
  { id: "social", title: "Friends & parties", category: "Social", detail: "Your friends and conversations", tone: "green" },
] as const;
export type StoreAppId = typeof STORE_APPS[number]["id"];