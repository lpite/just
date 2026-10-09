import { Link, useLocation } from "wouter";

export function NavBar() {
  return (
    <nav className="py-4 border-b px-3">
      <ul className="flex gap-2">
        <NavLink href="/" text="Товари" />
        <NavLink href="/list/income-document" text="Документи надходження" />
        <NavLink href="/list/sales-document" text="Документи продажу" />
        <NavLink href="/list/price-setting-document" text="Ціни" />
        <NavLink href="/reports/" text="Звіти" />
      </ul>
    </nav>
  );
}

function NavLink({ text, href }: { text: string; href: string }) {
  const [location] = useLocation()

  const isActive = location === href;

  return (
    <li>
      <Link
        className={`px-4 py-3 rounded-xl hover:bg-blue-100 duration-150 ${isActive && "bg-blue-200"}`}
        href={href}
      >
        {text}
      </Link>
    </li>
  );
}
