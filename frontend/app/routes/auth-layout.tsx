import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";

export default function AuthLayout() {
  const { isAuthenticated, isAuthenticating } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticating && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isAuthenticating, navigate]);

  if (isAuthenticating || !isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
