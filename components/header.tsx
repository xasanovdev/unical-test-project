interface HeaderProps {
  username: string;
}

export default function Header({ username }: HeaderProps) {
  const initials = username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Dashboard Builder</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden md:inline-block">
            Welcome, {username}
          </span>
        </div>
      </div>
    </header>
  );
}
