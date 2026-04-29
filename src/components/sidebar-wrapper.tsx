import { CommandPaletteWrapper } from "./command-palette-wrapper";
import { Sidebar } from "./sidebar";

export function SidebarWrapper() {
  return <Sidebar commandPalette={<CommandPaletteWrapper />} />;
}
