import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isClientAuthenticated } from "../auth/clientAuth";

const ClientProtectedRoute = () => {
  const location = useLocation();

  if (!isClientAuthenticated()) {
    return <Navigate to="/client/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ClientProtectedRoute;
