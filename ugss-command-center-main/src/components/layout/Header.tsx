import { useState } from "react";
import { Bell, Search, User, Calendar as CalendarIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const navigate = useNavigate();

  // logged in user
  const username = localStorage.getItem("user");

  // calendar
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    localStorage.getItem("selectedDate") ? new Date(localStorage.getItem("selectedDate")!) : new Date()
  );
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      localStorage.setItem("selectedDate", dateStr);
      // Dispatch a storage event so other components (like Overview) can listen
      window.dispatchEvent(new Event("storage"));
    }
  };

  // dropdowns
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      {/* LEFT */}
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {children}
      </div>

      {/* RIGHT */}
      <div className="relative flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>

        {/* Calendar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowCalendar(!showCalendar);
            setShowNotifications(false);
            setShowProfile(false);
          }}
        >
          <CalendarIcon className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowCalendar(false);
            setShowProfile(false);
          }}
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
            3
          </Badge>
        </Button>

        {/* Profile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowProfile(!showProfile);
            setShowCalendar(false);
            setShowNotifications(false);
          }}
        >
          <User className="h-5 w-5" />
        </Button>

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="absolute right-32 top-14 rounded-lg border bg-white p-3 shadow-lg">
            <p className="mb-2 text-sm font-medium">
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date"}
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </div>
        )}

        {/* Notifications Popup */}
        {showNotifications && (
          <div className="absolute right-16 top-14 w-64 rounded-lg border bg-white p-4 shadow-lg">
            <h3 className="mb-2 font-semibold">Notifications</h3>
            <ul className="space-y-2 text-sm">
              <li>🚨 New complaint received</li>
              <li>✅ Issue resolved</li>
              <li>⚠️ Maintenance due</li>
            </ul>
          </div>
        )}

        {/* Profile Popup */}
        {showProfile && (
          <div className="absolute right-0 top-14 w-56 rounded-lg border bg-white p-4 shadow-lg">
            <p className="mb-2 text-sm text-muted-foreground">Logged in as</p>
            <p className="mb-4 font-semibold">{username}</p>

            <Button
              variant="destructive"
              className="w-full flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
