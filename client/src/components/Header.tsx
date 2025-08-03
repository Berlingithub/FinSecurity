import { Shield } from "lucide-react";

interface HeaderProps {
  showNav?: boolean;
}

export default function Header({ showNav = true }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Shield className="text-primary-500 h-8 w-8 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">SecureReceivables</h1>
          </div>
          {showNav && (
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-primary-500 transition-colors">About</a>
              <a href="#" className="text-gray-600 hover:text-primary-500 transition-colors">Features</a>
              <a href="#" className="text-gray-600 hover:text-primary-500 transition-colors">Contact</a>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
