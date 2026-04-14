import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Package,
  BarChart3,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  LayoutDashboard
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('token');

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              IntelliMart
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>
          <div>
            <Button
              onClick={() => navigate("/auth")}
              variant="ghost"
              className="font-medium hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all duration-300"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-sm font-medium mb-8 animate-fade-in">
              <Zap className="w-4 h-4" />
              <span>Enterprise Logistics v2.0</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8">
              Inventory Intelligence <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
                Powering Retail.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-12 leading-relaxed">
              Unlock the full potential of your business with IntelliMart.
              Precision tracking, predictive analytics, and effortless multi-branch harmony.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all duration-300 w-full sm:w-auto"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Start Journey'} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg border-2 hover:bg-secondary w-full sm:w-auto"
                onClick={() => navigate("/auth")}
              >
                Explore Solutions
              </Button>
            </div>

            {/* Floating UI Element (Abstract representation) */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl p-4 md:p-8 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4 text-left p-4 rounded-xl hover:bg-indigo-500/5 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Smart Dashboard</h3>
                    <p className="text-muted-foreground text-sm">Visualize your growth with our award-winning data interface.</p>
                  </div>
                  <div className="space-y-4 text-left p-4 rounded-xl hover:bg-violet-500/5 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Deep Insights</h3>
                    <p className="text-muted-foreground text-sm">Automated reporting uncovered from your business data.</p>
                  </div>
                  <div className="space-y-4 text-left p-4 rounded-xl hover:bg-blue-500/5 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Vault Security</h3>
                    <p className="text-muted-foreground text-sm">Protected by industry-leading multi-layer encryption.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 border-y border-border/50 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="container mx-auto px-6">
            <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
              Trusted by the world's most ambitious retailers
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">TECHSTORE</div>
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">MODERNA</div>
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">URBANFLOW</div>
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">GLOBALMART</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4 tracking-tight">Everything you need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Stop juggling multiple tools. IntelliMart brings all your retail operations into one cohesive experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Globe, title: "Multi-branch Sync", desc: "Manage multiple shops from one central account with synchronized data." },
                { icon: Users, title: "Team Permissions", desc: "Granular role-based access control for all your team members." },
                { icon: Zap, title: "Turbo POS", desc: "A smooth checkout experience that works even with massive inventories." },
                { icon: Package, title: "Smart Inventory", desc: "Real-time alerts and automated stocking suggestions." }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 md:p-24 text-center text-white shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-black/10 rounded-full blur-[100px]" />

              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                  Ready to transform your <br /> business?
                </h2>
                <p className="text-xl text-indigo-50/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Join over 10,000+ businesses that are growing faster with IntelliMart's powerful management tools.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button
                    onClick={() => navigate("/auth")}
                    size="lg"
                    className="bg-white text-indigo-700 hover:bg-indigo-50 h-16 px-10 text-lg font-bold shadow-xl transition-all hover:scale-105"
                  >
                    Start Your Trial
                  </Button>
                  <Button
                    variant="link"
                    size="lg"
                    className="text-white h-16 px-10 text-lg font-semibold hover:text-indigo-200 transition-colors"
                  >
                    Watch a demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-slate-50/50 dark:bg-slate-950/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground">IntelliMart</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs text-center md:text-left">
                The most advanced inventory management system for modern retailers.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-center md:text-left">
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Updates</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
                </ul>
              </div>
              <div className="hidden md:block space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">Support Center</a></li>
                  <li><a href="#" className="hover:text-indigo-600 transition-colors">API Status</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground italic">
              Empowering the next generation of shop owners.
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} IntelliMart Logistics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
