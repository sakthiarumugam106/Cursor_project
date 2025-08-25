import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Grid,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School,
  Email,
  Lock,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      
      toast.success('Login successful! Welcome back!');
      
      // Redirect to intended page or home
      navigate(from, { replace: true });
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error.message,
      });
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.2,
        ease: 'easeOut',
      },
    },
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo and Title */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <School
                sx={{
                  fontSize: 64,
                  color: 'primary.main',
                  mb: 2,
                }}
              />
            </motion.div>
            
            <Typography
              component="h1"
              variant="h3"
              sx={{
                fontWeight: 700,
                textAlign: 'center',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: 'center' }}
            >
              Sign in to your Education Management account
            </Typography>
          </Box>

          {/* Login Form */}
          <motion.div variants={formVariants} initial="hidden" animate="visible">
            <Paper
              elevation={8}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Error Alert */}
              {errors.root && (
                <Fade in={!!errors.root}>
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.root.message}
                  </Alert>
                </Fade>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  {/* Email Field */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      variant="outlined"
                      size="large"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={isLoading}
                    />
                  </Grid>

                  {/* Password Field */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      size="large"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                              disabled={isLoading}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={isLoading}
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              {/* Divider */}
              <Box sx={{ my: 3 }}>
                <Divider>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>
              </Box>

              {/* Demo Accounts Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                  Demo Accounts (Password: password123)
                </Typography>
                <Grid container spacing={1} justifyContent="center">
                  <Grid item>
                    <Typography variant="caption" color="primary">
                      Student: student@std.com
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="caption" color="primary">
                      Tutor: tutor@tut.com
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="caption" color="primary">
                      Admin: admin@adm.com
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Links */}
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot your password?
                </Link>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" component="span" color="text.secondary">
                    Don't have an account?{' '}
                  </Typography>
                  <Link
                    component={RouterLink}
                    to="/register"
                    variant="body2"
                    sx={{
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Sign up here
                  </Link>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Login;