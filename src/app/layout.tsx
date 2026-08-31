import "./globals.css";

export const metadata = {
  title: "Community Membership Platform",
  description: "Privacy-first digital membership, verified payments, and secure credentials for community organizations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-hub-ink" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
