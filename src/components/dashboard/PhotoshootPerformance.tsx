import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const costData = [
  { month: 'Jan', saved: 125000 },
  { month: 'Feb', saved: 185000 },
  { month: 'Mar', saved: 220000 },
  { month: 'Apr', saved: 190000 },
  { month: 'May', saved: 275000 },
  { month: 'Jun', saved: 310000 },
];

const rejectionData = [
  { name: 'Amazon', value: 12, color: '#b89d7f' },
  { name: 'Flipkart', value: 8, color: '#a3825e' },
  { name: 'Takealot', value: 5, color: '#896b4a' },
  { name: 'eBay', value: 15, color: '#6f563b' },
];

const styleCards = [
  { name: 'Lifestyle', count: 1247, trend: '+15%' },
  { name: 'Studio', count: 892, trend: '+8%' },
  { name: 'Flat Lay', count: 634, trend: '+22%' },
];

export function PhotoshootPerformance() {
  return (
    <div className="glass-card rounded-xl p-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">AI Photoshoot Performance</h3>
        <p className="text-sm text-muted-foreground">Cost savings and efficiency metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Savings Chart */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Monthly Cost Savings (₹)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Saved']}
                />
                <Bar 
                  dataKey="saved" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rejection Rate Donut */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Rejection Rate by Marketplace</h4>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rejectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {rejectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Rejection Rate']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {rejectionData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Style Distribution */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <h4 className="text-sm font-medium text-foreground mb-3">Style Distribution</h4>
        <div className="grid grid-cols-3 gap-3">
          {styleCards.map((style) => (
            <div 
              key={style.name}
              className="p-3 bg-muted/50 rounded-lg text-center hover:bg-muted transition-colors"
            >
              <div className="text-lg font-bold text-foreground">{style.count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{style.name}</div>
              <div className="text-xs text-success font-medium mt-1">{style.trend}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
