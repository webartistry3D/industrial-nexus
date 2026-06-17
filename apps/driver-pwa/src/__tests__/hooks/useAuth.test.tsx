import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import axios from 'axios';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear = jest.fn();
    localStorage.getItem = jest.fn(() => null);
    localStorage.setItem = jest.fn();
    localStorage.removeItem = jest.fn();
  });

  it('should initialize with null user when no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('should login successfully and store tokens', async () => {
    const mockResponse = {
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        userId: 'user-1',
        email: 'driver@example.com',
        role: 'DRIVER',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('driver@example.com', 'password123');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
  });

  it('should logout and clear tokens', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});
