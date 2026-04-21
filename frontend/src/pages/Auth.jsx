import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, ArrowLeft, ShieldCheck, Mail, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { setUser, setSession } from "@/store/slices/authSlice";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('token', data.token);
      const user = { id: data.userId, email: email, name: data.name };
      dispatch(setUser(user));
      dispatch(setSession({ user, access_token: data.token }));
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Access Denied",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      setShowOtp(true);
      toast({
        title: "Security Verified",
        description: "Check your inbox for the 6-digit access code.",
      });
    } catch (error) {
      toast({
        title: "Registration Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast({
        title: "Account Ready",
        description: "Verification successful. You can now log in.",
      });
      setShowOtp(false);
      setOtp("");
      setActiveTab("login");
    } catch (error) {
      toast({
        title: "Invalid Code",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setResetPasswordMode(true);
      toast({
        title: "Recovery Sent",
        description: "Instructions sent to your email.",
      });
    } catch (error) {
      toast({
        title: "Recovery Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast({
        title: "Password Updated",
        description: "Your security credentials have been updated.",
      });
      setResetPasswordMode(false);
      setForgotPasswordMode(false);
      setOtp("");
      setNewPassword("");
      setActiveTab("login");
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left Side: Clean Professional Visuals */}
      <div className="hidden lg:flex flex-col bg-slate-900 p-12 text-white relative items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="absolute top-12 left-12 flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">IntelliMart</span>
        </div>

        <div className="relative z-10 max-w-md w-full">
          <div className="mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-400 text-xs font-semibold mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enterprise Grade Security</span>
             </div>
             <h2 className="text-4xl font-extrabold mb-6 tracking-tight leading-tight">
               Precision Inventory <br/> for Modern Retailers.
             </h2>
             <p className="text-slate-400 text-lg font-medium leading-relaxed">
               Access your multi-branch dashboard and oversee your logistics with absolute clarity and control.
             </p>
          </div>

          <div className="space-y-6">
             {[
               "Real-time Stock Synchronization",
               "Automated Branch Reporting",
               "Granular Access Control"
             ].map((text, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className="w-5 h-5 rounded-full bg-indigo-600/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                 </div>
                 <span className="text-slate-300 font-medium">{text}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-slate-500 text-xs font-medium border-t border-white/5 pt-8">
            © {new Date().getFullYear()} IntelliMart Logistics Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Clean Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-[#FDFDFD]">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900">IntelliMart</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {activeTab === "login" ? (forgotPasswordMode ? "Reset Password" : "Welcome Back") : "Create Account"}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {activeTab === "login" 
                ? (forgotPasswordMode ? "Enter your email to recover access" : "Please enter your details to sign in") 
                : "Join over 2,500+ businesses today"}
            </p>
          </div>

          {/* Verification View */}
          {showOtp ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-700 font-medium mb-4">
                We've sent a code to <br/><span className="font-bold underline">{email}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Verification Code</Label>
                <Input 
                  placeholder="Enter 6-digit code" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  maxLength={6} 
                  className="h-12 border-slate-200 focus:border-indigo-600 transition-all rounded-xl text-center text-xl font-bold tracking-[0.5em]"
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Activate
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-500 font-medium" onClick={() => setShowOtp(false)}>
                Back to signup
              </Button>
            </form>
          ) : (
            <>
              {/* Form Switching */}
              {!forgotPasswordMode && (
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                  <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('login')}
                  >
                    Login
                  </button>
                  <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'signup' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('signup')}
                  >
                    Register
                  </button>
                </div>
              )}

              {forgotPasswordMode ? (
                /* Forgot/Reset Password Form */
                resetPasswordMode ? (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                       <Label className="text-slate-700 font-semibold">Email Address</Label>
                       <Input value={email} disabled className="h-12 bg-slate-50 border-slate-100 text-slate-400 font-medium rounded-xl" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-slate-700 font-semibold">Security Code</Label>
                       <Input placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} className="h-12 border-slate-200 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-slate-700 font-semibold">New Password</Label>
                       <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 border-slate-200 rounded-xl" required />
                    </div>
                    <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl" disabled={loading}>Reset Password</Button>
                    <Button variant="ghost" className="w-full h-12 rounded-xl text-slate-500" onClick={() => { setResetPasswordMode(false); setForgotPasswordMode(false); }}>Cancel</Button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10 border-slate-200 rounded-xl" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Verification Code
                    </Button>
                    <button type="button" className="w-full text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-2 pt-2" onClick={() => setForgotPasswordMode(false)}>
                       <ArrowLeft className="w-3 h-3" /> Back to Login
                    </button>
                  </form>
                )
              ) : (
                /* Main Login/Signup Forms */
                <form onSubmit={activeTab === 'login' ? handleLogin : handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-12 pl-10 border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-xl font-medium" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-slate-700 font-semibold">Password</Label>
                      {activeTab === 'login' && (
                        <button type="button" className="text-xs font-bold text-indigo-600 hover:underline" onClick={() => setForgotPasswordMode(true)}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="h-12 pl-10 border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-xl font-medium" 
                        required 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {activeTab === 'login' ? 'Sign In to Dashboard' : 'Create Enterprise Account'}
                  </Button>

                  <p className="text-center text-xs text-slate-400 font-medium px-4 leading-relaxed mt-6">
                    By continuing, you agree to IntelliMart's <br/>
                    <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span> and <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
