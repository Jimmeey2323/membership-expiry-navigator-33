
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  tooltip?: string;
  drillDownData?: {
    label: string;
    value: string | number;
  }[];
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'neutral', 
  className = '', 
  tooltip,
  drillDownData = []
}: MetricCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getIconBg = () => {
    switch (trend) {
      case 'up': return 'bg-success/10 text-success border border-success/20';
      case 'down': return 'bg-destructive/10 text-destructive border border-destructive/20';
      default: return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  const getBorderGradient = () => {
    switch (trend) {
      case 'up': return 'border-success/30';
      case 'down': return 'border-destructive/30';
      default: return 'border-primary/30';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`card-elegant group overflow-hidden relative ${className}`}>
            {/* Background gradient mesh */}
            <div className="absolute inset-0 gradient-mesh opacity-30 transition-opacity duration-300 group-hover:opacity-50" />
            
            {/* Main content */}
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-premium text-muted-foreground">
                      {title}
                    </p>
                    {tooltip && <Info className="h-3 w-3 text-muted-foreground/60" />}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-sophisticated animate-scale-in">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    
                    {change && (
                      <div className="flex items-center gap-2 animate-slide-in-right">
                        {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                        {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                        <span className={`text-sm font-semibold ${getTrendColor()}`}>
                          {change}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enhanced icon with glow effect */}
                <div className={`relative p-4 rounded-2xl ${getIconBg()} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="h-8 w-8 transition-transform duration-300 group-hover:rotate-3" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              
              {/* Enhanced drill-down data */}
              {drillDownData.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <div className="pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {drillDownData.slice(0, 4).map((item, index) => (
                        <div 
                          key={index} 
                          className="text-center p-2 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors duration-200"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <p className="text-lg font-bold text-sophisticated animate-fade-in">
                            {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                          </p>
                          <p className="text-xs text-refined font-medium">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Subtle border glow */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${getBorderGradient()} border-2`} />
          </Card>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent side="top" className="max-w-xs card-glass">
            <p className="text-refined">{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
