import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if token is valid on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Check if token is expired
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expired, remove it
            localStorage.removeItem('token');
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            return;
          }

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user profile
          const response = await api.get('/auth/profile');
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.data.user });
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: accessToken });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/register', userData);
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: accessToken });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if needed
      if (state.token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Clear API headers
      delete api.defaults.headers.common['Authorization'];
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh-token', {
        refreshToken: refreshTokenValue,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      // Store new tokens
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Set new token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: accessToken });

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.put('/users/profile', updates);
      const updatedUser = response.data.data.user;

      // Update state
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });

      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset request failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/reset-password', { token, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!state.user) return false;
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    return userRoles.includes(state.user.role);
  };

  // Check if user is student
  const isStudent = () => hasRole('student');

  // Check if user is tutor
  const isTutor = () => hasRole('tutor');

  // Check if user is admin
  const isAdmin = () => hasRole(['admin', 'super_admin']);

  // Check if user is super admin
  const isSuperAdmin = () => hasRole('super_admin');

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    forgotPassword,
    resetPassword,
    
    // Utility functions
    hasRole,
    isStudent,
    isTutor,
    isAdmin,
    isSuperAdmin,
    
    // Dispatch (for advanced usage)
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;