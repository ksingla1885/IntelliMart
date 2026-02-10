import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store/store";
import { useEffect } from "react";
import { setUser, setLoading } from "./store/slices/authSlice";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Categories from "./pages/Categories";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import UserManagement from "./pages/UserManagement";
import AuditLogs from "./pages/AuditLogs";
import Profile from "./pages/Profile";
import MyShops from "./pages/MyShops";
import BackupExport from "./pages/BackupExport";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/Layout/AppLayout";
import api from "@/lib/api";

const queryClient = new QueryClient();

function AuthHandler({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Optionally verify token with backend here if you had a /me endpoint
        // For now, we decode basic info or just trust presence + future 401s
        // Since we don't have a /me endpoint returning full user details yet, 
        // we rely on what we might have stored or just set a placeholder.
        // Ideally: stored user info in localStorage too, or fetch it.
        // Let's assume we want to persist user state. 
        // For now, let's just set loading false and assume the token is valid.
        // The ProtectedRoute checks if user is present.
        // We need to set 'user' to something truthy.

        // Ideally we should decode the token to get userId
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          dispatch(setUser({ id: payload.userId, email: 'user@example.com' })); // Email is lost unless in token
        } catch (e) {
          localStorage.removeItem('token');
          dispatch(setUser(null));
        }
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    };
    checkAuth();
  }, [dispatch]);

  return <>{children}</>;
}

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthHandler>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute>
                <AppLayout>
                  <Products />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute>
                <AppLayout>
                  <Inventory />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute>
                <AppLayout>
                  <Categories />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute>
                <AppLayout>
                  <POS />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute>
                <AppLayout>
                  <Sales />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute>
                <AppLayout>
                  <Invoices />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute>
                <AppLayout>
                  <Suppliers />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute>
                <AppLayout>
                  <Customers />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute>
                <AppLayout>
                  <AuditLogs />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/shops" element={<ProtectedRoute>
                <AppLayout>
                  <MyShops />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/backup-export" element={<ProtectedRoute>
                <AppLayout>
                  <BackupExport />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthHandler>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
