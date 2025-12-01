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

      if (profilesError) throw profilesError;

      // Buscar todas as roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Mapear roles para cada usuário
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      // Combinar dados
      const usersWithRoles: UserWithRole[] = profiles?.map(profile => ({
        id: profile.id,
        nome_completo: profile.nome_completo,
        email: profile.email || undefined,
        avatar_url: profile.avatar_url || undefined,
        cargo: profile.cargo || undefined,
        status: (profile.status as 'ativo' | 'inativo') || 'ativo',
        role: (roleMap.get(profile.id) as UserRole) || 'corretor',
        created_at: profile.created_at || undefined,
      })) || [];

      return usersWithRoles;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  /**
   * Convidar novo usuário (criar via signup)
   * Nota: O usuário precisará confirmar o email e fazer login
   */
  async inviteUser(email: string, nomeCompleto: string, role: UserRole): Promise<void> {
    try {
      // Criar usuário via signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12), // Senha temporária
        options: {
          data: {
            nome_completo: nomeCompleto,
          },
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
