import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface PizzaChartProps {
  totalSlices: number
  requiredSlices: number
}

export function PizzaChart({ totalSlices, requiredSlices }: PizzaChartProps) {
  const chartData = useMemo(() => {
    return Array.from({ length: totalSlices }).map((_, index) => ({
      name: `Slice ${index + 1}`,
      value: 1,
      isFilled: index < requiredSlices,
    }))
  }, [totalSlices, requiredSlices])

  return (
    <div className="flex justify-center py-4">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <img
          src="/images/pizza.png"
          alt="Pizza"
          className="absolute w-[200px] h-[200px] object-cover rounded-full"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />

        <div className="absolute inset-0 w-full h-full">
          <ResponsiveContainer width={256} height={256}>
            <PieChart width={256} height={256}>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={0}
                strokeWidth={5}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => {
                  const fillColor = entry.isFilled ? "none" : "rgba(255, 255, 255, 0.9)"
                  const strokeColor = entry.isFilled ? "#ffffff" : "#eac9ac"

                  return (
                    <Cell
                      key={`cell-${index}`}
                      id={`pie-slice-${index}`}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={5}
                      style={{
                        fill: fillColor,
                        stroke: strokeColor,
                        outline: "none",
                      }}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-3xl font-bold text-white" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
            {requiredSlices}/{totalSlices}
          </span>
        </div>
      </div>
    </div>
  )
}

