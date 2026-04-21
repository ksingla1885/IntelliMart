import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Package,
  LineChart,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  LayoutDashboard,
  CheckCircle2,
  Store,
  Layers,
  Sparkles
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('token');

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
              <Package className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              IntelliMart
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">Solutions</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            {!isLoggedIn && (
              <Button
                onClick={() => navigate("/auth")}
                variant="ghost"
                className="text-slate-600 font-medium hover:text-indigo-600 hover:bg-indigo-50"
              >
                Sign In
              </Button>
            )}
            <Button
              onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-5"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Simple & Clean Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[13px] font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Inventory Simplified</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-[1.1]">
            Manage your inventory with <br className="hidden md:block" />
            <span className="text-indigo-600 font-extrabold italic">effortless precision.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed font-medium">
            IntelliMart helps growing businesses sync multiple branches, 
            automate stock tracking, and generate deep retail insights in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 px-4">
            <Button
              onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
              size="lg"
              className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md w-full sm:w-auto rounded-xl"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Start Your Free Trial'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-10 text-lg border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto rounded-xl"
              onClick={() => {
                const el = document.getElementById('features');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See how it works
            </Button>
          </div>

          {/* Clean Dashboard Preview Placeholder */}
          <div className="max-w-6xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative border border-slate-200 rounded-2xl bg-white shadow-xl p-2 md:p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-4 px-2 pt-2 border-b border-slate-100 pb-3">
                 <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                 </div>
                 <div className="mx-auto bg-slate-50 rounded-md py-1 px-8 text-[10px] text-slate-400 font-mono">app.intellimart.io/dashboard</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 md:p-6 text-left">
                {[
                  { label: "Total Revenue", val: "$42,850", trend: "+12.5%", color: "indigo" },
                  { label: "Active Orders", val: "156", trend: "+8.2%", color: "amber" },
                  { label: "Low Stock Items", val: "12", trend: "-5.0%", color: "slate" },
                  { label: "Return Rate", val: "1.4%", trend: "-0.2%", color: "indigo" }
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-slate-800">{stat.val}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:flex gap-8 px-8 pb-8 pt-4">
                 <div className="flex-1 h-40 rounded-xl bg-slate-50 relative flex items-center justify-center">
                    <LineChart className="w-12 h-12 text-slate-200" />
                 </div>
                 <div className="w-1/3 h-40 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Users className="w-12 h-12 text-slate-200" />
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Bar */}
        <section className="py-12 bg-white border-y border-slate-50">
          <div className="container mx-auto px-6 overflow-hidden">
            <p className="text-center text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mb-8">
              Reliable infrastructure for retail leaders
            </p>
            <div className="flex flex-wrap justify-between items-center gap-10 opacity-30 grayscale saturate-0 px-12">
               <span className="text-xl font-bold tracking-tight">VANTAGE</span>
               <span className="text-xl font-bold tracking-tight">ORBIT</span>
               <span className="text-xl font-bold tracking-tight">ZEPHIR</span>
               <span className="text-xl font-bold tracking-tight">ELEMENT</span>
               <span className="text-xl font-bold tracking-tight">LUMINA</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-[#FDFDFD]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
              <div className="text-left max-w-2xl">
                <span className="text-indigo-600 font-bold text-sm tracking-widest uppercase mb-4 block">Power Features</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Everything you need to <br/> scale your retail business.
                </h2>
              </div>
              <p className="text-slate-500 font-medium max-w-sm md:text-right">
                All-in-one platform built for speed, accuracy, and operational excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: Globe, 
                  title: "Multi-branch Sync", 
                  desc: "Connect all your physical and digital storefronts with real-time stock synchronization.",
                  color: "bg-indigo-600" 
                },
                { 
                  icon: LineChart, 
                  title: "Predictive Analytics", 
                  desc: "Anticipate demand surges and low-stock events before they impact your daily sales.",
                  color: "bg-slate-900"
                },
                { 
                  icon: ShieldCheck, 
                  title: "Retail Integrity", 
                  desc: "Role-based access controls and detailed audit logs of every movement in your warehouse.",
                  color: "bg-indigo-600"
                },
                { 
                   icon: Zap, 
                   title: "Turbo-POS Integration", 
                   desc: "Process sales faster than ever with an optimized interface designed for high-traffic stores.",
                   color: "bg-slate-900"
                },
                { 
                   icon: Layers, 
                   title: "Inventory Intelligence", 
                   desc: "Smart categorization and automated SKUs to keep your warehouse organized and efficient.",
                   color: "bg-indigo-600"
                },
                { 
                   icon: Store, 
                   title: "Supplier Relations", 
                   desc: "Integrated supplier portal to manage orders and track inbound logistics effortlessly.",
                   color: "bg-slate-900"
                }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
                  <div className={`w-12 h-12 rounded-lg ${f.color} flex items-center justify-center text-white mb-6 transform transition-transform group-hover:scale-110`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Simple & Impactful */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
               <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-[1.1]">
                    Stop guessing. <br/> Start growing.
                  </h2>
                  <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl mx-auto font-medium">
                    Join 2,500+ small businesses who managed to grow 40% faster after switching to IntelliMart.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                      onClick={() => navigate("/auth")}
                      size="lg"
                      className="bg-white text-slate-900 hover:bg-slate-100 h-16 px-12 text-lg font-bold rounded-xl"
                    >
                      Start Free Trial
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-16 px-12 text-lg border-slate-700 text-white hover:bg-slate-800 rounded-xl"
                    >
                      Talk to an expert
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="text-white w-4 h-4" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-900">IntelliMart</span>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                 The operating system for retail businesses. Trusted by modern shop owners worldwide.
               </p>
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group cursor-pointer">
                     <Globe className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group cursor-pointer">
                     <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 col-span-1 md:col-span-3 gap-8">
               <div className="space-y-6">
                 <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-900">Platform</h4>
                 <ul className="space-y-4 text-sm text-slate-500 font-medium">
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Integrations</a></li>
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Security</a></li>
                 </ul>
               </div>
               <div className="space-y-6">
                 <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-900">Company</h4>
                 <ul className="space-y-4 text-sm text-slate-500 font-medium">
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">About</a></li>
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Career</a></li>
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Press</a></li>
                 </ul>
               </div>
               <div className="space-y-6">
                 <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-900">Support</h4>
                 <ul className="space-y-4 text-sm text-slate-500 font-medium">
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a></li>
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Community</a></li>
                   <li><a href="#" className="hover:text-indigo-600 transition-colors">Status</a></li>
                 </ul>
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-6 text-xs text-slate-400 font-medium">
               <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
               <a href="#" className="hover:text-indigo-600 transition-colors">Cookie Policy</a>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} IntelliMart Logistics Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
