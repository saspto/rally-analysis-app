import { NavLink } from 'react-router-dom'
import { BarChart3, Download, FileText } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary-200" />
              <span className="text-xl font-bold tracking-tight">Rally Analysis</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-600'
                  }`
                }
              >
                <Download className="w-4 h-4" />
                Exports
              </NavLink>
              <NavLink
                to="/summary"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-800 text-white' : 'text-primary-100 hover:bg-primary-600'
                  }`
                }
              >
                <FileText className="w-4 h-4" />
                Generate Summary
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Rally Analysis App — Powered by Claude AI
      </footer>
    </div>
  )
}
