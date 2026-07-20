import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Upload as UploadIcon,
  Receipt as ReceiptIcon,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: "/", label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: "/upload", label: t('nav.scanReceipt'), icon: UploadIcon },
    { path: "/receipts", label: t('nav.allReceipts'), icon: FileText },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur flex items-center justify-center">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="h-6 w-6 text-primary" />
            <h2 className="font-semibold">{t('app.name')}</h2>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <LanguageSwitcher />
            {user && (
              <Button variant="ghost" size="sm" onClick={handleSignOut} title={t('auth.signOut')}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full flex-col h-auto py-2 gap-1"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
          <Button
            variant="ghost"
            className="w-full flex-col h-auto py-2 gap-1"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs">{t('auth.signOut')}</span>
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6 pb-20 md:pb-6">{children}</main>
    </div>
  );
}
