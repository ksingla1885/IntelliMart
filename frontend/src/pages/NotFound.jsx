import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="text-center p-8 glass-card rounded-3xl max-w-md w-full animate-slide-up">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-8">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-8xl font-black bg-gradient-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-bold mb-4 italic">Oops! Path Unknown</h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The logistics for this page are missing. It seems we've charted into unknown territory.
        </p>
        
        <Button 
          onClick={() => navigate("/")}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
        >
          <Home className="mr-2 h-4 w-4" /> Return to Base
        </Button>
      </div>

    </div>
  );
};

export default NotFound;
