export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light min-h-screen flex items-center justify-center px-4 py-12" style={{ colorScheme: "light", background: "#F7F6F3" }}>
      {children}
    </div>
  );
}
