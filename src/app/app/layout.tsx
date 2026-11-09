import { Providers } from "@/components/providers";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { AppShell } from "@/components/app-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <Providers><WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider></Providers>;
}
