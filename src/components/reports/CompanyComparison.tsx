import React from 'react';
import { Building2 } from 'lucide-react';

export interface CompanyAttributeRow {
  label: string;
  values: number[];
  /** When true (default), the highest value is treated as "best" and highlighted. */
  higherIsBetter?: boolean;
  /** Suffix to append to each numeric value (e.g. '%', ' yrs'). */
  suffix?: string;
}

export interface CompanyComparisonProps {
  companies?: string[];
  attributes?: CompanyAttributeRow[];
}

const DEFAULT_COMPANIES: string[] = ['Grab', 'Gojek', 'FinanceHub'];

const DEFAULT_ATTRIBUTES: CompanyAttributeRow[] = [
  { label: 'Headcount', values: [8200, 6400, 1850], higherIsBetter: true },
  { label: 'Engineering %', values: [62, 58, 71], higherIsBetter: true, suffix: '%' },
  { label: 'Leadership Tenure (yrs)', values: [4.2, 5.8, 3.1], higherIsBetter: true, suffix: ' yrs' },
  { label: 'Median Comp (USD)', values: [128000, 119000, 142000], higherIsBetter: true },
  { label: 'Open Roles', values: [142, 96, 38], higherIsBetter: false },
];

function bestIndex(values: number[], higherIsBetter: boolean): number {
  let idx = 0;
  for (let i = 1; i < values.length; i++) {
    if (higherIsBetter ? values[i] > values[idx] : values[i] < values[idx]) {
      idx = i;
    }
  }
  return idx;
}

export function CompanyComparison({
  companies = DEFAULT_COMPANIES,
  attributes = DEFAULT_ATTRIBUTES,
}: CompanyComparisonProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">Company Comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-bg-tertiary">
              <th className="text-left py-3 pr-4 font-serif text-text-secondary font-bold">
                Attribute
              </th>
              {companies.map((c) => (
                <th key={c} className="text-right py-3 px-4 font-serif text-text-primary font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((row) => {
              const best = bestIndex(row.values, row.higherIsBetter ?? true);
              return (
                <tr key={row.label} className="border-b border-bg-tertiary last:border-b-0">
                  <td className="py-3 pr-4 text-text-secondary">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`text-right py-3 px-4 font-mono tabular-nums ${
                        i === best ? 'text-accent font-bold' : 'text-text-primary'
                      }`}
                    >
                      {v.toLocaleString()}
                      {row.suffix ?? ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
