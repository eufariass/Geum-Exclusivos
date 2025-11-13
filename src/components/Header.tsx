import { useState } from 'react';
import logoWhite from '@/assets/logo-geum-white.png';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { ProfileModal } from './ProfileModal';

export const Header = () => {
  const { signOut, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="bg-primary text-primary-foreground py-4 px-6 sticky top-0 z-40 shadow-md no-print">
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img src={logoWhite} alt="Geum" className="h-8 w-auto" />
            <div className="hidden sm:block border-l border-primary-foreground/20 pl-4">
              <p className="text-xs font-light tracking-widest uppercase text-primary-foreground">
                Gestão de Exclusivos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden md:inline text-xs text-primary-foreground/80">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProfileOpen(true)}
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            >
              <User className="h-3 w-3" />
              <span className="hidden sm:inline">Perfil</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
};
