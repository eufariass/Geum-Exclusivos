import { supabase } from '@/integrations/supabase/client';
import type { UserRole, UserWithRole } from '@/types';

export const usersService = {
  /**
   * Buscar todos os usuários com suas roles (apenas admins)
   */
  async getUsers(): Promise<UserWithRole[]> {
    try {
      // Buscar profiles com user_roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles carregados:', profiles);

      // Buscar todas as roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
        throw rolesError;
      }

      console.log('Roles carregadas:', roles);

      // Mapear roles para cada usuário
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      console.log('Role Map:', roleMap);

      // Combinar dados
      const usersWithRoles: UserWithRole[] = profiles?.map(profile => {
        const userRole = roleMap.get(profile.id) as UserRole;
        console.log(`User ${profile.nome_completo}:`, {
          id: profile.id,
          status: profile.status,
          role: userRole,
          rawStatus: profile.status,
        });
        
        return {
          id: profile.id,
          nome_completo: profile.nome_completo,
          email: profile.email || undefined,
          avatar_url: profile.avatar_url || undefined,
          cargo: profile.cargo || undefined,
          status: (profile.status as 'ativo' | 'inativo') || 'ativo',
          role: userRole || 'corretor',
          created_at: profile.created_at || undefined,
        };
      }) || [];

      console.log('Users with roles final:', usersWithRoles);
      return usersWithRoles;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  /**
   * Convidar novo usuário (enviar email de convite)
   */
  async inviteUser(email: string, nomeCompleto: string, role: UserRole): Promise<void> {
    try {
      // Criar usuário via signup com senha temporária
      const tempPassword = Math.random().toString(36).slice(-12);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            nome_completo: nomeCompleto,
          },
          emailRedirectTo: `${window.location.origin}/definir-senha`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário');

      // O profile será criado automaticamente pelo trigger
      // Aguardar um momento para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar a role se necessário (trigger já criou como corretor ou admin)
      if (role === 'admin') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id);

        if (roleError) throw roleError;
      }

      // Enviar email de convite
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: { 
          email, 
          userName: nomeCompleto,
          role 
        }
      });

      if (emailError) {
        console.error('Erro ao enviar email de convite:', emailError);
        // Não lançar erro aqui pois o usuário foi criado com sucesso
      }
    } catch (error) {
      console.error('Erro ao convidar usuário:', error);
      throw error;
    }
  },

  /**
   * Atualizar role do usuário
   */
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      throw error;
    }
  },

  /**
   * Ativar/desativar usuário
   */
  async updateUserStatus(userId: string, status: 'ativo' | 'inativo'): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  },

  /**
   * Reenviar e-mail de convite
   */
  async resendInvite(email: string, nomeCompleto: string, role: UserRole): Promise<void> {
    try {
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: { 
          email, 
          userName: nomeCompleto,
          role 
        }
      });

      if (emailError) {
        console.error('Erro ao reenviar email de convite:', emailError);
        throw new Error('Falha ao enviar e-mail de convite');
      }
    } catch (error) {
      console.error('Erro ao reenviar convite:', error);
      throw error;
    }
  },

  /**
   * Buscar role do usuário atual
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.role as UserRole || null;
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      return null;
    }
  },

  /**
   * Verificar se usuário atual é admin
   */
  async isAdmin(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin';
  },
};
