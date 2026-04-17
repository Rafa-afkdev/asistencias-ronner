import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Asistencias",
  description: "Registro de asistencia para profesores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${roboto.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <main className="w-full h-screen overflow-y-auto bg-background">
                <div className="flex items-center p-4 border-b">
                  <SidebarTrigger />
                  <h1 className="ml-4 text-xl font-bold">Asistencias</h1>
                </div>
                <div className="p-6">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
