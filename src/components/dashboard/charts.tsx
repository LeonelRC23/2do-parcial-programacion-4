"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

export function VentasDiariasChart({
  data,
}: {
  data: { fecha: string; importe: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ventas diarias · 30 días</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-72 w-full">
          <Line
            data={{
              labels: data.map((d) => d.fecha.slice(5).replace("-", "/")),
              datasets: [
                {
                  label: "Ventas",
                  data: data.map((d) => d.importe / 100),
                  borderColor: "#f59e0b",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  fill: true,
                  tension: 0.3,
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      formatMoney(Math.round(Number(ctx.raw) * 100)),
                  },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
                y: {
                  ticks: {
                    callback: (v) =>
                      `$${Number(v).toLocaleString("es-AR", {
                        maximumFractionDigits: 0,
                      })}`,
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function FormaPagoChart({
  data,
}: {
  data: { forma: string; importe: number }[];
}) {
  const labels: Record<string, string> = {
    contado: "Contado",
    tarjeta: "Tarjeta",
    cuenta_corriente: "Cta. cte.",
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Forma de pago · mes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-72 w-full max-w-md">
          <Doughnut
            data={{
              labels: data.map((d) => labels[d.forma] ?? d.forma),
              datasets: [
                {
                  data: data.map((d) => d.importe / 100),
                  backgroundColor: ["#0f766e", "#f59e0b", "#334155"],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "bottom" },
                tooltip: {
                  callbacks: {
                    label: (ctx) =>
                      `${ctx.label}: ${formatMoney(Math.round(Number(ctx.raw) * 100))}`,
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
