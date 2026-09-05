import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

import { useNavigate } from 'react-router-dom';

import apiClient from '../services/apiClient';

/* ============================================================
   TYPES
============================================================ */

interface UserProfile {
  name: string;
  email: string;
  username: string;
  accountId: string;
}

/* ============================================================
   PROFILE
============================================================ */

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [profile, setProfile] =
    useState<UserProfile>({
      name: '',
      email: '',
      username: '',
      accountId: '',
    });

  const [name, setName] =
    useState('');

  const [username, setUsername] =
    useState('');

  /* ==========================================================
     LOAD PROFILE
  ========================================================== */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      let loadedUser: any = null;

      /* --------------------------------------------------------
         TRY BACKEND FIRST
      -------------------------------------------------------- */

      try {
        const response =
          await apiClient.get(
            '/auth/profile'
          );

        const data =
          response.data || {};

        loadedUser =
          data.user || data;
      } catch (backendError) {
        console.warn(
          'Backend profile endpoint unavailable. Using stored account information.',
          backendError
        );
      }

      /* --------------------------------------------------------
         LOCAL STORAGE FALLBACK
      -------------------------------------------------------- */

      if (!loadedUser) {
        const possibleKeys = [
          'user',
          'currentUser',
          'authUser',
          'profile',
        ];

        for (const key of possibleKeys) {
          const stored =
            localStorage.getItem(key);

          if (!stored) {
            continue;
          }

          try {
            const parsed =
              JSON.parse(stored);

            if (
              parsed &&
              typeof parsed === 'object'
            ) {
              loadedUser = parsed;
              break;
            }
          } catch {
            continue;
          }
        }
      }

      /* --------------------------------------------------------
         JWT FALLBACK
      -------------------------------------------------------- */

      if (!loadedUser) {
        const token =
          localStorage.getItem(
            'authToken'
          ) ||
          localStorage.getItem(
            'accessToken'
          ) ||
          localStorage.getItem(
            'token'
          );

        if (token) {
          try {
            const parts =
              token.split('.');

            if (parts.length === 3) {
              const normalized =
                parts[1]
                  .replace(/-/g, '+')
                  .replace(/_/g, '/');

              const decoded =
                atob(normalized);

              loadedUser =
                JSON.parse(decoded);
            }
          } catch {
            loadedUser = null;
          }
        }
      }

      /* --------------------------------------------------------
         BUILD PROFILE
      -------------------------------------------------------- */

      const user =
        loadedUser || {};

      const firstName =
        String(
          user.firstName ||
            user.first_name ||
            ''
        ).trim();

      const lastName =
        String(
          user.lastName ||
            user.last_name ||
            ''
        ).trim();

      const combinedName =
        `${firstName} ${lastName}`.trim();

      const loadedProfile: UserProfile = {
        name: String(
          user.name ||
            user.fullName ||
            user.full_name ||
            combinedName ||
            ''
        ).trim(),

        email: String(
          user.email ||
            user.emailAddress ||
            ''
        ).trim(),

        username: String(
          user.username ||
            user.userName ||
            ''
        ).trim(),

        accountId: String(
          user.accountId ||
            user.account_id ||
            user.id ||
            user._id ||
            ''
        ).trim(),
      };

      setProfile(
        loadedProfile
      );

      setName(
        loadedProfile.name
      );

      setUsername(
        loadedProfile.username
      );
    } catch (err) {
      console.error(
        'Profile loading error:',
        err
      );

      setError(
        'Unable to load your account profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     LOAD ON PAGE OPEN
  ========================================================== */

  useEffect(() => {
    loadProfile();
  }, []);

  /* ==========================================================
     DISPLAY NAME
  ========================================================== */

  const displayName =
    useMemo(() => {
      if (profile.name) {
        return profile.name;
      }

      if (profile.username) {
        return profile.username;
      }

      return 'Account Holder';
    }, [
      profile.name,
      profile.username,
    ]);

  /* ==========================================================
     INITIALS
  ========================================================== */

  const initials =
    useMemo(() => {
      const source =
        profile.name ||
        profile.username ||
        'Account';

      const parts =
        source
          .trim()
          .split(/\s+/)
          .filter(Boolean);

      if (parts.length >= 2) {
        return (
          parts[0][0] +
          parts[
            parts.length - 1
          ][0]
        ).toUpperCase();
      }

      return parts[0][0]
        .toUpperCase();
    }, [
      profile.name,
      profile.username,
    ]);

  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  const handleSave = async () => {
    setError('');
    setSuccess('');

    const trimmedName =
      name.trim();

    const trimmedUsername =
      username.trim();

    if (!trimmedName) {
      setError(
        'Please enter your full name.'
      );
      return;
    }

    if (!trimmedUsername) {
      setError(
        'Please enter your username.'
      );
      return;
    }

    try {
      setSaving(true);

      let backendSaved = false;

      /* --------------------------------------------------------
         TRY BACKEND
      -------------------------------------------------------- */

      try {
        await apiClient.put(
          '/auth/profile',
          {
            name: trimmedName,
            username:
              trimmedUsername,
          }
        );

        backendSaved = true;
      } catch (backendError) {
        console.warn(
          'Backend profile update unavailable.',
          backendError
        );
      }

      /* --------------------------------------------------------
         UPDATE LOCAL STORAGE
      -------------------------------------------------------- */

      const possibleKeys = [
        'user',
        'currentUser',
        'authUser',
        'profile',
      ];

      let updatedLocalStorage =
        false;

      for (const key of possibleKeys) {
        const stored =
          localStorage.getItem(key);

        if (!stored) {
          continue;
        }

        try {
          const parsed =
            JSON.parse(stored);

          if (
            parsed &&
            typeof parsed === 'object'
          ) {
            localStorage.setItem(
              key,
              JSON.stringify({
                ...parsed,
                name: trimmedName,
                username:
                  trimmedUsername,
              })
            );

            updatedLocalStorage =
              true;

            break;
          }
        } catch {
          continue;
        }
      }

      /*
       * If no existing user object was found,
       * create one so the dashboard can use
       * the updated profile information.
       */
      if (!updatedLocalStorage) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            name: trimmedName,
            username:
              trimmedUsername,
            email:
              profile.email,
            accountId:
              profile.accountId,
          })
        );
      }

      /* --------------------------------------------------------
         UPDATE STATE
      -------------------------------------------------------- */

      setProfile(
        (previous) => ({
          ...previous,
          name: trimmedName,
          username:
            trimmedUsername,
        })
      );

      setName(trimmedName);

      setUsername(
        trimmedUsername
      );

      setSuccess(
        backendSaved
          ? 'Your profile has been updated successfully.'
          : 'Your profile has been updated on this device.'
      );
    } catch (err) {
      console.error(
        'Profile update error:',
        err
      );

      setError(
        'Unable to update your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    const keys = [
      'token',
      'accessToken',
      'authToken',
      'user',
      'currentUser',
      'authUser',
      'profile',
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    navigate('/login');
  };

  /* ==========================================================
     TEXT FIELD STYLE
  ========================================================== */

  const inputSx = {
    '& .MuiInputLabel-root': {
      color: '#aebeff',
    },

    '& .MuiInputLabel-root.Mui-focused': {
      color: '#5ce8ff',
    },

    '& .MuiOutlinedInput-root': {
      color: '#fff',

      '& fieldset': {
        borderColor:
          'rgba(140,170,255,0.35)',
      },

      '&:hover fieldset': {
        borderColor: '#5ce8ff',
      },

      '&.Mui-focused fieldset': {
        borderColor: '#5ce8ff',
      },
    },
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: '#fff',

        background:
          'radial-gradient(circle at top right, rgba(25,84,199,0.30), transparent 30%), linear-gradient(180deg,#02071f 0%,#071453 55%,#091b68 100%)',

        pb: 6,
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,

          background:
            'rgba(2,7,31,0.96)',

          backdropFilter:
            'blur(14px)',

          borderBottom:
            '1px solid rgba(125,150,255,0.18)',
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              py: 1.5,
            }}
          >
            {/* ------------------------------------------------
                BACK TO DASHBOARD
            ------------------------------------------------ */}

            <IconButton
              onClick={() =>
                navigate(
                  '/dashboard'
                )
              }
              sx={{
                color: '#fff',

                background:
                  'rgba(60,90,220,0.25)',

                '&:hover': {
                  background:
                    'rgba(60,90,220,0.45)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            {/* ------------------------------------------------
                TITLE
            ------------------------------------------------ */}

            <Box
              sx={{
                flexGrow: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: 18,
                    sm: 22,
                  },

                  fontWeight: 900,
                }}
              >
                Account Profile
              </Typography>

              <Typography
                sx={{
                  color: '#7691e5',
                  fontSize: 9,
                  letterSpacing: 1,
                }}
              >
                GLOBAL DIGITAL MARKET
              </Typography>
            </Box>

            {/* ------------------------------------------------
                DESKTOP LOGOUT
            ------------------------------------------------ */}

            <Button
              onClick={
                handleLogout
              }
              startIcon={
                <LogoutIcon />
              }
              sx={{
                color: '#ff8297',

                textTransform:
                  'none',

                display: {
                  xs: 'none',
                  sm: 'flex',
                },
              }}
            >
              Logout
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <Container
        maxWidth="lg"
        sx={{
          py: {
            xs: 3,
            md: 5,
          },
        }}
      >
        {/* ====================================================
            PAGE TITLE
        ==================================================== */}

        <Box
          sx={{
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: 30,
                md: 42,
              },

              fontWeight: 900,

              letterSpacing: -1,
            }}
          >
            Your Account
          </Typography>

          <Typography
            sx={{
              color: '#8ea4e8',
              mt: 0.5,
            }}
          >
            Manage your account
            information and
            security.
          </Typography>
        </Box>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <Alert
            severity="error"
            onClose={() =>
              setError('')
            }
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccess('')
            }
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {success}
          </Alert>
        )}

        {/* ====================================================
            PROFILE HEADER
        ==================================================== */}

        <Card
          sx={{
            mb: 3,
            borderRadius: 4,
            color: '#fff',
            overflow: 'hidden',

            background:
              'linear-gradient(135deg,#10216d 0%,#154ec7 60%,#087fda 100%)',

            border:
              '1px solid rgba(130,190,255,0.28)',

            boxShadow:
              '0 20px 60px rgba(0,0,0,0.25)',
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 3,
                md: 4,
              },
            }}
          >
            {loading ? (
              <Stack
                alignItems="center"
                spacing={2}
                sx={{
                  py: 4,
                }}
              >
                <CircularProgress
                  sx={{
                    color: '#5ce8ff',
                  }}
                />

                <Typography
                  sx={{
                    color: '#c7d7ff',
                  }}
                >
                  Loading account
                  profile...
                </Typography>
              </Stack>
            ) : (
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                spacing={3}
                alignItems={{
                  xs: 'flex-start',
                  sm: 'center',
                }}
              >
                {/* AVATAR */}

                <Avatar
                  sx={{
                    width: 90,
                    height: 90,
                    fontSize: 30,
                    fontWeight: 900,

                    background:
                      'linear-gradient(135deg,#19d8ff,#285cff)',

                    border:
                      '3px solid rgba(255,255,255,0.25)',

                    boxShadow:
                      '0 12px 35px rgba(0,0,0,0.25)',
                  }}
                >
                  {initials}
                </Avatar>

                {/* USER INFORMATION */}

                <Box
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: {
                        xs: 26,
                        md: 32,
                      },

                      fontWeight: 900,
                    }}
                  >
                    {displayName}
                  </Typography>

                  <Typography
                    sx={{
                      color: '#c5d5ff',
                      mt: 0.5,
                    }}
                  >
                    {profile.email ||
                      'Email not available'}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      mt: 1.5,
                    }}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      icon={
                        <VerifiedUserIcon
                          sx={{
                            color:
                              '#4df28d !important',
                          }}
                        />
                      
