import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * RegisterPage redirect:
 * Streamlined authentication is now unified at /login with dual-mode
 * Option 1 (Phone + OTP) and Option 2 (Email + Password).
 */
export function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
}
