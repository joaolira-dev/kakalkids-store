import type { SizeChart } from "@/lib/catalog/types";

export function SizeChartTable({ chart }: { chart: SizeChart }) {
  const { columns, rows } = chart.chart;

  return (
    <section id="medidas" aria-labelledby="medidas-titulo" className="scroll-mt-28">
      <h2 id="medidas-titulo" className="text-2xl sm:text-3xl">
        Tabela de medidas
      </h2>
      {chart.notes && <p className="mt-2 max-w-prose text-marinho-soft">{chart.notes}</p>}
      <div className="mt-5 overflow-x-auto rounded-3xl bg-white ring-2 ring-marinho/10">
        <table className="w-full min-w-[32rem] text-left">
          <caption className="sr-only">{chart.name}</caption>
          <thead>
            <tr className="bg-sol">
              {columns.map((col) => (
                <th key={col} scope="col" className="px-4 py-3 font-display font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-marinho/10 even:bg-creme/60">
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-4 py-3 font-display font-semibold">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="px-4 py-3">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
