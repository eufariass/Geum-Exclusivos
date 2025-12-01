import { useState, useEffect } from 'react';
import { usersService } from '@/services/users.service';
import type { UserRole } from '@/types';

export const usePermissions = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    try {
      const userRole = await usersService.getCurrentUserRole();
      console.log('🔐 Role carregada:', userRole);
      setRole(userRole);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isCorretor = role === 'corretor';

  // Permissões específicas
  const canManageUsers = isAdmin;
  const canSeeAllLeads = isAdmin;
  const canSeeAllImoveis = isAdmin;
  const canDeleteData = isAdmin;
  const canExportData = isAdmin;
  const canManageSettings = isAdmin;

  return {
    role,
    loading,
    isAdmin,
    isCorretor,
    canManageUsers,
    canSeeAllLeads,
    canSeeAllImoveis,
    canDeleteData,
    canExportData,
    canManageSettings,
    refreshRole: loadRole,
  };
};
