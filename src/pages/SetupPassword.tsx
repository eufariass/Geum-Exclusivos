import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, CheckCircle2 } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';
import { toast } from 'sonner';

const SetupPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se já estiver autenticado e a senha já foi definida, redirecionar
    if (user) {
      // Verificar se é um novo usuário (sem senha definida ainda)
      // Se já tem senha, redireciona para o sistema
      const urlParams = new URLSearchParams(window.location.search);
      const isNewUser = urlParams.get('type') === 'invite' || urlParams.get('type') === 'recovery';
      
      if (!isNewUser) {
        navigate('/sistema', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    const { error } = await updatePassword(password);

    if (error) {
      setError('Erro ao definir senha. Tente novamente.');
      setLoading(false);
    } else {
      toast.success('Senha definida com sucesso!');
      navigate('/sistema', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <picture>
            <source srcSet={logoWhite} media="(prefers-color-scheme: dark)" />
            <img src={logoBlack} alt="GEUM Imóveis" className="h-16" />
          </picture>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Você foi convidado!</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Defina sua senha para acessar o sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSetupPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Definindo senha...' : 'Definir Senha e Acessar'}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Sistema de Gestão de Imóveis GEUM
        </p>
      </Card>
    </div>
  );
};

export default SetupPassword;
