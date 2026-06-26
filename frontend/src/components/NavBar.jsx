import { NavLink } from 'react-router-dom';
import { ShoppingCart, Settings, LogOut } from 'lucide-react';

export default function NavBar({ user, onLogout }) {
    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <img
                            src="/src/assets/logo.avif"
                            alt="FoodOrder Logo"
                            className="h-8"
                        />
                        <span className="text-xl font-bold text-gray-900">Food Order System</span>
                    </div>

                    {user && (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500 ml-2 mr-1">
                               Welcome, {user.username}!
                            </span>
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
