import "./globals.css";

export const metadata = {
  title: "TutorHub",
  description: "Notes, DPPs and lectures for every subject, organized by your teachers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
