'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsChartProps {
  data: {
    name: string;
    revenue: number;
    orders: number;
  }[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-zinc-50 animate-pulse rounded-xl" />;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickFormatter={(value) => `${value} €`}
          />
          <Tooltip 
            cursor={{ fill: '#f4f4f5' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar 
            dataKey="revenue" 
            name="Prihod" 
            radius={[4, 4, 0, 0]}
            barSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#4f46e5" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
