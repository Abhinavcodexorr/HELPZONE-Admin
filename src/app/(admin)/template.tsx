// A template remounts on every navigation, so each page eases in.
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-slide-up">{children}</div>;
}
