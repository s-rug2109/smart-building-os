import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { format } from 'date-fns';
import type { TimeSeriesData } from '../types';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  title: string;
  color: string;
  unit?: string;
}

export default function TimeSeriesChart({ data, title, color, unit = '' }: TimeSeriesChartProps) {
  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.8)', border: `1px solid ${color}` }}>
          <Typography variant="body2" sx={{ color: 'white' }}>
            {format(new Date(label), 'MM/dd HH:mm:ss')}
          </Typography>
          <Typography variant="body2" sx={{ color }}>
            {`${payload[0].value}${unit}`}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Quality: {payload[0].payload.quality}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: 400, width: '100%', minHeight: 400, minWidth: 600 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatXAxis}
            stroke="rgba(255,255,255,0.7)"
            fontSize={12}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.7)"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}