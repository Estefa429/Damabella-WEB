import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../../../shared/components/native';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth?: number;
}

export function StatsCard({ title, value, icon: Icon, growth }: StatsCardProps) {
  const isPositive = growth && growth > 0;
  const isNegative = growth && growth < 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {growth !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive && <TrendingUp className="h-4 w-4 text-green-600" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
              <span className={`text-sm ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
                {growth > 0 ? '+' : ''}{growth}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="h-6 w-6 text-black" />
        </div>
      </div>
    </Card>
  );
}
