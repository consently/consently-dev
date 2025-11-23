import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { UserProfileData, UpdateProfileInput } from '@/types/settings';

interface UseUserProfileReturn {
  data: UserProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<{ success: boolean; error?: string }>;
  updating: boolean;
}

/**
 * Custom hook to fetch and manage user profile data
 */
export function useUserProfile(): UseUserProfileReturn {
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.profile.get();

      if (response.error) {
        throw new Error(response.error);
      }

      // Handle response structure - it might be wrapped or direct
      const responseData = response as any;
      if (responseData && responseData.profile) {
        setData(responseData as UserProfileData);
      } else if (response.data) {
        setData(response.data);
      } else {
        // Log the response for debugging
        console.error('Unexpected response structure:', responseData);
        throw new Error('Invalid response structure from API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Error fetching user profile:', {
        error: err,
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updateData: UpdateProfileInput) => {
    setUpdating(true);

    try {
      const response = await api.profile.update({
        full_name: updateData.full_name,
        avatar_url: updateData.avatar_url,
        company_name: updateData.company_name,
        phone: updateData.phone,
        website: updateData.website,
      });

      if (response.error) {
        return { success: false, error: response.error };
      }

      // Refetch profile data to get updated information
      await fetchData();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      return { success: false, error: errorMessage };
    } finally {
      setUpdating(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateProfile,
    updating,
  };
}
