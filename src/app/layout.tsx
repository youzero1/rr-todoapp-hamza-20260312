import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'A fullstack Todo application built with Next.js and TypeORM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif', backgroundColor: '#f0f2f5' }}>
        {children}
      </body>
    </html>
  );
}
