import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Bell, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Header({ onMenuClick, isRTL = false }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      
      {/* Search bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            type="search"
            placeholder={isRTL ? "חיפוש..." : "Search anything..."}
            className={cn(
              "h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary",
              isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
            )}
          />
          <kbd className={cn(
            "absolute top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
            isRTL ? "left-3" : "right-3"
          )}>
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        {/* User avatar */}
        <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors">
          <AvatarImage src="" alt="User" />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
