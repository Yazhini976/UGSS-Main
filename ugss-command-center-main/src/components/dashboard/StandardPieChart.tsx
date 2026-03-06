import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieProps,
} from 'recharts';

interface StandardPieChartProps {
    data: any[];
    dataKey?: string;
    nameKey?: string;
    colors?: string[];
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    showLegend?: boolean;
    tooltipFormatter?: (value: any) => string | React.ReactNode;
}

const DEFAULT_COLORS = [
    'hsl(215, 80%, 45%)',
    'hsl(175, 60%, 45%)',
    'hsl(38, 95%, 55%)',
    'hsl(150, 60%, 45%)',
    'hsl(0, 75%, 55%)',
    'hsl(280, 65%, 55%)',
    'hsl(200, 80%, 50%)',
    'hsl(160, 60%, 40%)',
    'hsl(30, 90%, 50%)',
    'hsl(190, 70%, 45%)',
];

const renderCustomizedLabel = (props: any) => {
    const {
        cx,
        cy,
        midAngle,
        outerRadius,
        fill,
        payload,
        percent,
        value,
    } = props;

    // Filter out 0% values to prevent overlapping labels and clutter
    if (percent === 0 || value === 0) return null;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 15) * cos;
    const my = cy + (outerRadius + 15) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path
                d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                stroke={fill}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={0.8}
            />
            <circle cx={ex} cy={ey} r={3} fill={fill} stroke="white" strokeWidth={1} />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 12}
                y={ey}
                textAnchor={textAnchor}
                fill="hsl(var(--foreground))"
                dominantBaseline="central"
                style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.05))'
                }}
            >
                {`${props.name} ${(percent * 100).toFixed(0)}%`}
            </text>
        </g>
    );
};

export function StandardPieChart({
    data,
    dataKey = 'count',
    nameKey = 'status',
    colors = DEFAULT_COLORS,
    height = 400,
    innerRadius = 70,
    outerRadius = 110,
    showLegend = false,
    tooltipFormatter,
}: StandardPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={4}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    animationBegin={0}
                    animationDuration={800}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                            stroke="hsl(var(--background))"
                            strokeWidth={3}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={tooltipFormatter}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '15px'
                    }}
                />
                {showLegend && (
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );
}
