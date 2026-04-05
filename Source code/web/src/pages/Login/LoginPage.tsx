import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/hooks/useAuth';
import { colors, spacing, borderRadius, shadows, typography } from '../../core/theme';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing[4]} ${spacing[4]}`,
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: borderRadius.lg,
    fontSize: typography.sizes.base,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: colors.background,
      padding: spacing[4],
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: spacing[10] }}>
          <div style={{
            width: 72,
            height: 72,
            background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})`,
            borderRadius: borderRadius.xl,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[4],
            boxShadow: shadows.lg,
          }}>
            <span style={{ fontSize: 36 }}>🌿</span>
          </div>
          <h1 style={{ 
            fontSize: typography.sizes['3xl'], 
            fontWeight: typography.weights.bold,
            color: colors.textPrimary,
            margin: 0,
          }}>
            AgriTrace
          </h1>
          <p style={{ 
            color: colors.textSecondary, 
            marginTop: spacing[2],
            fontSize: typography.sizes.base,
          }}>
            Hệ thống truy xuất nguồn gốc nông sản
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: colors.surface,
          borderRadius: borderRadius.xl,
          boxShadow: shadows.lg,
          padding: spacing[10],
          border: `1px solid ${colors.neutral[200]}`,
        }}>
          <h2 style={{ 
            fontSize: typography.sizes.xl, 
            fontWeight: typography.weights.semibold,
            color: colors.textPrimary,
            marginBottom: spacing[6],
            textAlign: 'center',
          }}>
            Đăng nhập
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
              {/* Email Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: spacing[2], 
                  fontWeight: typography.weights.medium,
                  fontSize: typography.sizes.sm,
                  color: colors.textPrimary,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary[500];
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary[100]}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.neutral[300];
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: spacing[2], 
                  fontWeight: typography.weights.medium,
                  fontSize: typography.sizes.sm,
                  color: colors.textPrimary,
                }}>
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary[500];
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary[100]}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.neutral[300];
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  color: colors.error,
                  padding: spacing[4],
                  borderRadius: borderRadius.lg,
                  fontSize: typography.sizes.sm,
                  textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: `${spacing[4]} ${spacing[6]}`,
                  background: loading ? colors.neutral[400] : colors.primary[600],
                  color: 'white',
                  border: 'none',
                  borderRadius: borderRadius.lg,
                  fontSize: typography.sizes.base,
                  fontWeight: typography.weights.semibold,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: spacing[2],
                }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p style={{ 
          textAlign: 'center', 
          marginTop: spacing[6], 
          color: colors.textMuted,
          fontSize: typography.sizes.sm,
        }}>
          © 2024 AgriTrace. Truy xuất minh bạch, tiêu dùng an tâm.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
