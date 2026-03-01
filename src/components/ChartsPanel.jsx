import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
} from 'recharts'

export default function ChartsPanel({ trendData, statusData, priorityData, deptData, chartGrid, chartTick, tooltipProps }) {
  return (
    <section className="panels">
      <div className="panel left">
        <h3>Ticket Volume Trend</h3>
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 8, right: 14, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64d2ff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#64d2ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} />
              <XAxis dataKey="day" tick={{ fill: chartTick }} />
              <YAxis tick={{ fill: chartTick }} />
              <Tooltip {...tooltipProps} />
              <Legend />
              <Area type="monotone" dataKey="count" stroke="#0a84ff" fill="url(#volumeGlow)" name="Daily count" />
              <Line type="monotone" dataKey="ma" stroke="#30d158" strokeWidth={2} dot={false} name="Moving avg" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel right">
        <h3>Status Distribution</h3>
        <div className="chart mini">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                {statusData.map((entry, index) => (
                  <Cell key={`status-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel left">
        <h3>Priority Pressure</h3>
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} margin={{ top: 8, right: 14, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} />
              <XAxis dataKey="name" tick={{ fill: chartTick }} />
              <YAxis tick={{ fill: chartTick }} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={`priority-${entry.name}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel right">
        <h3>Department Load</h3>
        <div className="chart mini">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} />
              <XAxis dataKey="dept" tick={{ fill: chartTick }} />
              <YAxis tick={{ fill: chartTick }} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="count" fill="#5e5ce6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
