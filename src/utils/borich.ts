import { QuantitativeItem, SurveyData } from '../types';

/**
 * Borich 요구도 공식:
 * Borich = (기대 - 현재)의 합 × 기대 수준 평균 ÷ 응답자 수
 * = ∑(Expected_i - Current_i) * Expected_Mean / N
 */
export function calculateBorichNeeds(survey: SurveyData): QuantitativeItem[] {
  if (!survey.rows || survey.rows.length === 0) {
    return [];
  }

  const { rows, columnMapping, customItemLabels } = survey;

  // Find column pairs
  // Case A: Wide format with paired columns, e.g. "성과관리_현재", "성과관리_기대"
  // or user designated columns
  const currentCols: string[] = [];
  const expectedCols: string[] = [];
  const itemCols: string[] = [];

  Object.entries(columnMapping).forEach(([col, type]) => {
    if (type === 'current') currentCols.push(col);
    else if (type === 'expected') expectedCols.push(col);
    else if (type === 'item') itemCols.push(col);
  });

  const results: QuantitativeItem[] = [];

  // Scenario 1: Paired columns (e.g., matching prefixes or matching indices)
  if (currentCols.length > 0 && expectedCols.length > 0) {
    // If there is only 1 current and 1 expected column, and there is an 'item' column, it's long format!
    if (currentCols.length === 1 && expectedCols.length === 1 && itemCols.length > 0) {
      const itemCol = itemCols[0];
      const currentCol = currentCols[0];
      const expectedCol = expectedCols[0];

      // Group rows by itemCol
      const groups: Record<string, { currents: number[]; expecteds: number[] }> = {};

      rows.forEach((r) => {
        const itemName = String(r[itemCol] || '').trim();
        if (!itemName) return;
        const cVal = parseFloat(r[currentCol]);
        const eVal = parseFloat(r[expectedCol]);
        if (!isNaN(cVal) && !isNaN(eVal)) {
          if (!groups[itemName]) groups[itemName] = { currents: [], expecteds: [] };
          groups[itemName].currents.push(cVal);
          groups[itemName].expecteds.push(eVal);
        }
      });

      Object.entries(groups).forEach(([itemName, data], idx) => {
        const N = data.currents.length;
        if (N === 0) return;

        let sumDiff = 0;
        let sumExpected = 0;
        let sumCurrent = 0;

        for (let i = 0; i < N; i++) {
          const diff = data.expecteds[i] - data.currents[i];
          sumDiff += diff;
          sumExpected += data.expecteds[i];
          sumCurrent += data.currents[i];
        }

        const currentMean = Number((sumCurrent / N).toFixed(2));
        const expectedMean = Number((sumExpected / N).toFixed(2));
        const gap = Number((expectedMean - currentMean).toFixed(2));
        const borichScore = Number(((sumDiff * expectedMean) / N).toFixed(2));

        results.push({
          id: `item-${idx + 1}`,
          itemName,
          currentMean,
          expectedMean,
          gap,
          borichScore,
          borichRank: 1,
          respondentCount: N,
        });
      });
    } else {
      // Scenario 2: Wide format, multiple columns for current and expected
      // Match them up by name similarity or positional index
      currentCols.forEach((curCol, idx) => {
        // Try to find matching expected column:
        // 1. Remove '_현재', '_현재수준', '(현재)' etc.
        const cleanBase = curCol
          .replace(/[_\s\(\[\{]?(현재|현재수준|실행도|보유도|Current)[_\s\)\]\}]?/gi, '')
          .trim();

        let expCol = expectedCols.find((exp) => {
          const expClean = exp
            .replace(/[_\s\(\[\{]?(기대|기대수준|중요도|필요도|Expected)[_\s\)\]\}]?/gi, '')
            .trim();
          return expClean === cleanBase;
        });

        // Fallback to same index if length matches
        if (!expCol && expectedCols[idx]) {
          expCol = expectedCols[idx];
        }

        if (!expCol) return;

        const displayName = customItemLabels?.[curCol] || cleanBase || curCol;

        let sumDiff = 0;
        let sumExpected = 0;
        let sumCurrent = 0;
        let validN = 0;

        rows.forEach((r) => {
          const cVal = parseFloat(r[curCol]);
          const eVal = parseFloat(r[expCol!]);
          if (!isNaN(cVal) && !isNaN(eVal)) {
            sumDiff += eVal - cVal;
            sumExpected += eVal;
            sumCurrent += cVal;
            validN++;
          }
        });

        if (validN > 0) {
          const currentMean = Number((sumCurrent / validN).toFixed(2));
          const expectedMean = Number((sumExpected / validN).toFixed(2));
          const gap = Number((expectedMean - currentMean).toFixed(2));
          const borichScore = Number(((sumDiff * expectedMean) / validN).toFixed(2));

          results.push({
            id: `item-${idx + 1}`,
            itemName: displayName,
            currentMean,
            expectedMean,
            gap,
            borichScore,
            borichRank: 1,
            respondentCount: validN,
          });
        }
      });
    }
  }

  // Calculate ranks based on Borich Score (descending)
  results.sort((a, b) => b.borichScore - a.borichScore);
  results.forEach((item, index) => {
    item.borichRank = index + 1;
  });

  return results;
}
