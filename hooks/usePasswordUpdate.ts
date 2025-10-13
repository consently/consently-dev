import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';

interface UsePasswordUpdateReturn {
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updating: boolean;
}

/**
 * Custom hook to update user password
 */
export function usePasswordUpdate(): UsePasswordUpdateReturn {
  const [updating, setUpdating] = useState<boolean>(false);

  const updatePassword = useCallback(async (newPassword: string) => {
    setUpdating(true);

    try {
      const response = await api.profile.updatePassword(newPassword);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { 
        success: true, 
        message: response.message || 'Password updated successfully' 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      return { success: false, error: errorMessage };
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updatePassword,
    updating,
  };
}
