import { LegendAvatar } from "@/components/legend-avatar";
import { MatrixCell } from "./matrix-cell";
import { emptyWinrateRecord, type WinrateMatrix } from "@/lib/winrate-matrix";

export function WinrateMatrixTable({ matrix }: { matrix: WinrateMatrix }) {
  return (
    <div className="overflow-auto rounded-lg border bg-card shadow-sm">
      <table className="w-max min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-20 bg-card shadow-[0_1px_0_var(--border)]">
          <tr>
            <th className="sticky left-0 z-30 w-56 min-w-56 border-r bg-card p-3 text-left align-bottom">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Your legend
              </span>
            </th>
            <th className="w-28 min-w-28 border-r bg-card p-3 text-center align-bottom">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Overall
              </span>
            </th>
            {matrix.columns.map(({ legend, totalMatches }) => (
              <th
                key={legend.id}
                className="w-28 min-w-28 p-2 align-bottom text-center"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <LegendAvatar
                    legendId={legend.id}
                    name={legend.name}
                    size="sm"
                  />
                  <span className="max-w-24 truncate text-xs font-bold">
                    {shortLegendName(legend.name)}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {totalMatches} {totalMatches === 1 ? "match" : "matches"}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map(({ legend, summary, cells }) => (
            <tr key={legend.id} className="border-t border-border">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r bg-card p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <LegendAvatar
                    legendId={legend.id}
                    name={legend.name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-black tracking-normal">
                      {shortLegendName(legend.name)}
                    </p>
                  </div>
                </div>
              </th>
              <td className="w-28 min-w-28 border-r p-0 align-middle">
                <MatrixCell record={summary} />
              </td>
              {matrix.columns.map(({ legend: opponent }) => (
                <td
                  key={opponent.id}
                  className="w-28 min-w-28 p-0 align-middle"
                >
                  <MatrixCell
                    record={cells.get(opponent.id) ?? emptyWinrateRecord()}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shortLegendName(name: string) {
  return name.split(",")[0] ?? name;
}
