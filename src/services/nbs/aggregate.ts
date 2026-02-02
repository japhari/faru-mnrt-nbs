import { ensureSeedCollections } from './collections';
import { NbsConfigResolved, NbsDbState } from './types';

type AggregateParams = {
  period: string;
  requestTime: string;
  indicatorId: string;
};

type AggregateResult = {
  datavalues: Array<{
    area: number;
    area_name: string;
    indicator: string;
    sub_group: string;
    data_value: number;
    time_value: string;
    source: string;
    time_period: string;
  }>;
};

export async function aggregateIndicatorData(
  state: NbsDbState,
  config: NbsConfigResolved,
  params: AggregateParams
): Promise<AggregateResult> {
  const period = normalizePeriod(params.period);
  const { year, quarter, timeValue } = parseRequestTime(period, params.requestTime);
  const { indicatorMatch, indicatorLabel } = parseIndicatorId(params.indicatorId);

  const { indicatorValues, adminAreas, disaggregations } = await ensureSeedCollections(
    state,
    config
  );

  const match: Record<string, any> = { year };
  if (period === 'Quarterly') {
    match.quarter = quarter;
  }
  if (indicatorMatch.length) {
    match.$or = indicatorMatch;
  }

  const totals = await indicatorValues
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $convert: { input: '$value', to: 'double', onError: 0, onNull: 0 },
            },
          },
          areaIds: { $addToSet: '$area' },
          disaggregationIds: { $addToSet: '$disaggregation_id' },
          sources: { $addToSet: '$source' },
        },
      },
    ])
    .toArray();

  const totalValue = totals[0]?.total ?? 0;
  const areaIds = (totals[0]?.areaIds ?? []).filter((value: any) => value != null);
  const disaggregationIds = (totals[0]?.disaggregationIds ?? []).filter(
    (value: any) => value != null
  );
  const sources = (totals[0]?.sources ?? []).filter((value: any) => value != null);

  const areaId = areaIds.length ? areaIds[0] : null;
  const disaggregationId = disaggregationIds.length ? disaggregationIds[0] : null;

  const areaDoc =
    areaId != null
      ? await adminAreas.findOne({ id: { $in: [areaId, String(areaId)] } })
      : null;
  const subGroupDoc =
    disaggregationId != null ? await disaggregations.findOne({ id: disaggregationId }) : null;
  const areaName = areaDoc?.name ?? '';
  const subGroup = subGroupDoc?.name ?? '';
  const sourceLabel = sources.length === 1 ? String(sources[0]) : sources.join(', ');

  return {
    datavalues: [
      {
        area: areaId ?? 0,
        area_name: areaName,
        indicator: indicatorLabel,
        sub_group: subGroup,
        data_value: totalValue,
        time_value: timeValue,
        source: sourceLabel,
        time_period: period,
      },
    ],
  };
}

function normalizePeriod(periodRaw: string): 'Yearly' | 'Quarterly' {
  const value = String(periodRaw || '').trim().toLowerCase();
  if (value === 'yearly') return 'Yearly';
  if (value === 'quarterly') return 'Quarterly';
  throw new Error('Invalid period. Use Yearly or Quarterly.');
}

function parseRequestTime(
  period: 'Yearly' | 'Quarterly',
  requestTimeRaw: string
): { year: number; quarter: number | null; timeValue: string } {
  const requestTime = String(requestTimeRaw || '').trim();
  if (period === 'Yearly') {
    if (!/^\d{4}$/.test(requestTime)) {
      throw new Error('Invalid requestTime for Yearly. Use YYYY.');
    }
    return { year: Number(requestTime), quarter: null, timeValue: requestTime };
  }

  const match = requestTime.match(/^(\d{4})Q([1-4])$/i);
  if (!match) {
    throw new Error('Invalid requestTime for Quarterly. Use YYYYQ1-YYYYQ4.');
  }
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  return { year, quarter, timeValue: `${match[1]}Q${quarter}` };
}

function parseIndicatorId(indicatorIdRaw: string): {
  indicatorMatch: Array<Record<string, any>>;
  indicatorLabel: string;
} {
  const raw = String(indicatorIdRaw || '').trim();
  if (!raw) {
    throw new Error('indicatorId is required.');
  }

  const digitMatch = raw.match(/(\d+)/);
  const numeric = digitMatch ? Number(digitMatch[1]) : null;
  const matchers: Array<Record<string, any>> = [];

  if (numeric != null && Number.isFinite(numeric)) {
    matchers.push({ indicator_id: numeric }, { mnrt_indicator_id: numeric });
  } else {
    matchers.push({ indicator_id: raw }, { mnrt_indicator_id: raw });
  }

  return { indicatorMatch: matchers, indicatorLabel: raw };
}
