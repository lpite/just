import { Link } from "wouter";
import { NavBar } from "../components/nav-bar";

const reports = [
  {
    href: "/reports/stock-history",
    title: "Історія складу",
    description: "Зміна залишків кожного продукту за документами",
  },
];

export default function ReportsPage() {
  return (
    <main>
      <NavBar />
      <div className="p-4">
        <h1 className="text-3xl mb-4">Звіти</h1>
        <ul className="space-y-2">
          {reports.map((report) => (
            <li key={report.href}>
              <Link
                className="block border rounded p-4 hover:bg-blue-50"
                href={report.href}
              >
                <span className="font-semibold">{report.title}</span>
                <p className="text-sm text-gray-500">{report.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
