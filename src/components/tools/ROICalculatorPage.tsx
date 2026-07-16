import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaults: {
    teamSize: number;
    avgSalaryK: number;
    currentMeetingsPerWeek: number;
    avgMeetingHours: number;
    travelBudgetK: number;
    trainingBudgetK: number;
    attritionRate: number;
    avgHireCostK: number;
    decisionCycleWeeks: number;
  };
  improvementRates: {
    meetingEfficiency: number;
    travelReduction: number;
    attritionReduction: number;
    decisionSpeedup: number;
    productivityGain: number;
  };
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'growing-startup',
    name: 'Growing Startup',
    description: '20-50 person team, building leadership capacity fast',
    icon: '🚀',
    defaults: {
      teamSize: 30,
      avgSalaryK: 180,
      currentMeetingsPerWeek: 8,
      avgMeetingHours: 1.5,
      travelBudgetK: 200,
      trainingBudgetK: 150,
      attritionRate: 15,
      avgHireCostK: 80,
      decisionCycleWeeks: 4,
    },
    improvementRates: {
      meetingEfficiency: 20,
      travelReduction: 15,
      attritionReduction: 30,
      decisionSpeedup: 25,
      productivityGain: 10,
    },
  },
  {
    id: 'enterprise-china',
    name: 'Enterprise (China HQ)',
    description: '200+ person org with cross-border coordination',
    icon: '🏢',
    defaults: {
      teamSize: 250,
      avgSalaryK: 300,
      currentMeetingsPerWeek: 12,
      avgMeetingHours: 2,
      travelBudgetK: 2000,
      trainingBudgetK: 1500,
      attritionRate: 12,
      avgHireCostK: 150,
      decisionCycleWeeks: 8,
    },
    improvementRates: {
      meetingEfficiency: 25,
      travelReduction: 30,
      attritionReduction: 25,
      decisionSpeedup: 40,
      productivityGain: 15,
    },
  },
  {
    id: 'family-business',
    name: 'Family Business / SME',
    description: '50-200 people, governance & succession focus',
    icon: '👨‍👩‍👧‍👦',
    defaults: {
      teamSize: 80,
      avgSalaryK: 150,
      currentMeetingsPerWeek: 6,
      avgMeetingHours: 2,
      travelBudgetK: 500,
      trainingBudgetK: 300,
      attritionRate: 8,
      avgHireCostK: 60,
      decisionCycleWeeks: 6,
    },
    improvementRates: {
      meetingEfficiency: 30,
      travelReduction: 20,
      attritionReduction: 20,
      decisionSpeedup: 35,
      productivityGain: 12,
    },
  },
  {
    id: 'cross-border-leader',
    name: 'Cross-Border Leader',
    description: 'Individual leader with global team responsibility',
    icon: '🌍',
    defaults: {
      teamSize: 15,
      avgSalaryK: 350,
      currentMeetingsPerWeek: 15,
      avgMeetingHours: 1.5,
      travelBudgetK: 150,
      trainingBudgetK: 30,
      attritionRate: 10,
      avgHireCostK: 120,
      decisionCycleWeeks: 3,
    },
    improvementRates: {
      meetingEfficiency: 35,
      travelReduction: 25,
      attritionReduction: 20,
      decisionSpeedup: 30,
      productivityGain: 20,
    },
  },
];

interface ROICalculatorPageProps {
  onStartAssessment?: () => void;
}

export function ROICalculatorPage({ onStartAssessment }: ROICalculatorPageProps) {
  const [activePreset, setActivePreset] = useState<string>('growing-startup');
  const [inputs, setInputs] = useState(SCENARIO_PRESETS[0].defaults);
  const [improvements, setImprovements] = useState(SCENARIO_PRESETS[0].improvementRates);
  const [investment, setInvestment] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      setInputs(preset.defaults);
      setImprovements(preset.improvementRates);
    }
  };

  const handleInputChange = (field: string, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleImprovementChange = (field: string, value: number) => {
    setImprovements(prev => ({ ...prev, [field]: value }));
  };

  const results = useMemo(() => {
    const weeklyMeetingsCost =
      (inputs.avgSalaryK * 1000 / 52 / 40) *
      inputs.teamSize *
      inputs.currentMeetingsPerWeek *
      inputs.avgMeetingHours;
    const annualMeetingsCost = weeklyMeetingsCost * 52;
    const meetingsSavings = (annualMeetingsCost * improvements.meetingEfficiency) / 100;

    const travelSavings = (inputs.travelBudgetK * 1000 * improvements.travelReduction) / 100;

    const annualAttritionCost =
      inputs.teamSize * (inputs.attritionRate / 100) * inputs.avgHireCostK * 1000;
    const attritionSavings = (annualAttritionCost * improvements.attritionReduction) / 100;

    const annualSalaryCost = inputs.teamSize * inputs.avgSalaryK * 1000;
    const productivitySavings = (annualSalaryCost * improvements.productivityGain) / 100;

    const decisionCycleSavings =
      inputs.teamSize * (inputs.avgSalaryK * 1000 / 52) * improvements.decisionSpeedup / 100 * inputs.decisionCycleWeeks;

    const totalAnnualSavings =
      meetingsSavings + travelSavings + attritionSavings + productivitySavings;
    const totalInvestment = investment * 1000;
    const netAnnualBenefit = totalAnnualSavings - totalInvestment;
    const roi = totalInvestment > 0 ? (netAnnualBenefit / totalInvestment) * 100 : 0;
    const paybackMonths = totalAnnualSavings > 0
      ? (totalInvestment / (totalAnnualSavings / 12))
      : 0;

    return {
      annualMeetingsCost,
      meetingsSavings,
      travelSavings,
      annualAttritionCost,
      attritionSavings,
      productivitySavings,
      decisionCycleSavings,
      totalAnnualSavings,
      totalInvestment,
      netAnnualBenefit,
      roi,
      paybackMonths,
    };
  }, [inputs, improvements, investment]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `¥${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `¥${(amount / 1000).toFixed(0)}K`;
    }
    return `¥${amount.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563EB] text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-sm mb-4">
            <Calculator className="w-4 h-4" />
            Free ROI Calculator
          </div>
          <h1 className="text-3xl font-bold mb-3">
            What's Your Leadership Intelligence ROI?
          </h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Estimate the financial impact of investing in your team's leadership
            capabilities. Use preset scenarios or customize to your organization.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#171717] mb-4">Start with a Scenario</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCENARIO_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-4 border text-left transition-all ${
                  activePreset === preset.id
                    ? 'border-[#2563EB] bg-[#EFF6FF]'
                    : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4]'
                }`}
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <div className="font-semibold text-[#171717] text-sm">{preset.name}</div>
                <div className="text-xs text-[#737373] mt-1">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-white border border-[#E5E5E5] p-6 mb-6">
              <h2 className="text-lg font-bold text-[#171717] mb-5">Your Organization</h2>

              <div className="space-y-5">
                <SliderInput
                  label="Team Size"
                  value={inputs.teamSize}
                  min={5}
                  max={500}
                  step={5}
                  unit="people"
                  onChange={v => handleInputChange('teamSize', v)}
                />

                <SliderInput
                  label="Avg. Annual Salary"
                  value={inputs.avgSalaryK}
                  min={50}
                  max={500}
                  step={10}
                  unit="K CNY"
                  onChange={v => handleInputChange('avgSalaryK', v)}
                />

                <SliderInput
                  label="Meetings per Week (per person)"
                  value={inputs.currentMeetingsPerWeek}
                  min={1}
                  max={20}
                  step={1}
                  unit="meetings"
                  onChange={v => handleInputChange('currentMeetingsPerWeek', v)}
                />

                <SliderInput
                  label="Avg. Meeting Duration"
                  value={inputs.avgMeetingHours}
                  min={0.5}
                  max={4}
                  step={0.5}
                  unit="hours"
                  onChange={v => handleInputChange('avgMeetingHours', v)}
                />

                <SliderInput
                  label="Annual Travel Budget"
                  value={inputs.travelBudgetK}
                  min={0}
                  max={5000}
                  step={50}
                  unit="K CNY"
                  onChange={v => handleInputChange('travelBudgetK', v)}
                />

                <SliderInput
                  label="Annual Attrition Rate"
                  value={inputs.attritionRate}
                  min={2}
                  max={30}
                  step={1}
                  unit="%"
                  onChange={v => handleInputChange('attritionRate', v)}
                />

                <SliderInput
                  label="Avg. Cost Per Hire"
                  value={inputs.avgHireCostK}
                  min={20}
                  max={300}
                  step={10}
                  unit="K CNY"
                  onChange={v => handleInputChange('avgHireCostK', v)}
                />
              </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] p-6 mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-lg font-bold text-[#171717]"
              >
                <span>Improvement Assumptions</span>
                <ArrowRight className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              </button>
              <p className="text-sm text-[#737373] mt-1">
                Estimated improvements from leadership development
              </p>

              {showAdvanced && (
                <div className="space-y-5 mt-5 pt-5 border-t border-[#E5E5E5]">
                  <SliderInput
                    label="Meeting Efficiency Gain"
                    value={improvements.meetingEfficiency}
                    min={5}
                    max={50}
                    step={5}
                    unit="%"
                    onChange={v => handleImprovementChange('meetingEfficiency', v)}
                  />
                  <SliderInput
                    label="Travel Cost Reduction"
                    value={improvements.travelReduction}
                    min={0}
                    max={50}
                    step={5}
                    unit="%"
                    onChange={v => handleImprovementChange('travelReduction', v)}
                  />
                  <SliderInput
                    label="Attrition Reduction"
                    value={improvements.attritionReduction}
                    min={5}
                    max={50}
                    step={5}
                    unit="%"
                    onChange={v => handleImprovementChange('attritionReduction', v)}
                  />
                  <SliderInput
                    label="Productivity Gain"
                    value={improvements.productivityGain}
                    min={5}
                    max={40}
                    step={5}
                    unit="%"
                    onChange={v => handleImprovementChange('productivityGain', v)}
                  />
                  <SliderInput
                    label="Decision Speed-up"
                    value={improvements.decisionSpeedup}
                    min={10}
                    max={60}
                    step={5}
                    unit="%"
                    onChange={v => handleImprovementChange('decisionSpeedup', v)}
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E5E5E5] p-6">
              <h2 className="text-lg font-bold text-[#171717] mb-2">
                Proposed Investment
              </h2>
              <p className="text-sm text-[#737373] mb-5">
                Estimated annual investment in leadership development
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#171717]">¥</span>
                <input
                  type="number"
                  value={investment}
                  onChange={e => setInvestment(Number(e.target.value))}
                  className="text-2xl font-bold text-[#171717] w-32 border-b border-[#E5E5E5] focus:border-[#2563EB] focus:outline-none bg-transparent"
                />
                <span className="text-sm text-[#737373]">K CNY / year</span>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white border border-[#E5E5E5] p-6">
              <div className="text-center mb-6 pb-6 border-b border-[#E5E5E5]">
                <div className="text-sm text-[#737373] mb-1">Estimated Annual ROI</div>
                <div className={`text-5xl font-bold ${
                  results.roi >= 100 ? 'text-[#16A34A]' :
                  results.roi >= 0 ? 'text-[#2563EB]' :
                  'text-[#DC2626]'
                }`}>
                  {results.roi >= 0 ? '+' : ''}{results.roi.toFixed(0)}%
                </div>
                <div className="text-sm text-[#737373] mt-2">
                  Net annual benefit: <span className="font-semibold text-[#171717]">
                    {formatCurrency(results.netAnnualBenefit)}
                  </span>
                </div>
                {results.paybackMonths > 0 && results.paybackMonths < 120 && (
                  <div className="text-sm text-[#16A34A] mt-1">
                    Payback in {results.paybackMonths.toFixed(1)} months
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-[#171717] mb-4">Annual Savings Breakdown</h3>
              <div className="space-y-4">
                <SavingsRow
                  label="Meeting Efficiency"
                  icon={Clock}
                  amount={results.meetingsSavings}
                  percent={improvements.meetingEfficiency}
                  formatCurrency={formatCurrency}
                />
                <SavingsRow
                  label="Travel Cost Reduction"
                  icon={DollarSign}
                  amount={results.travelSavings}
                  percent={improvements.travelReduction}
                  formatCurrency={formatCurrency}
                />
                <SavingsRow
                  label="Attrition Reduction"
                  icon={Users}
                  amount={results.attritionSavings}
                  percent={improvements.attritionReduction}
                  formatCurrency={formatCurrency}
                />
                <SavingsRow
                  label="Productivity Gains"
                  icon={TrendingUp}
                  amount={results.productivitySavings}
                  percent={improvements.productivityGain}
                  formatCurrency={formatCurrency}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-[#E5E5E5] flex items-center justify-between">
                <span className="font-semibold text-[#171717]">Total Annual Savings</span>
                <span className="text-xl font-bold text-[#16A34A]">
                  {formatCurrency(results.totalAnnualSavings)}
                </span>
              </div>

              <div className="mt-6 p-4 bg-[#F5F5F5] text-xs text-[#737373] flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  This is an estimate based on industry benchmarks. Actual results
                  vary by organization. We recommend a diagnostic assessment for
                  a personalized analysis.
                </div>
              </div>

              <button
                onClick={onStartAssessment}
                className="w-full mt-6 py-3 bg-[#171717] text-white font-semibold hover:bg-[#404040] transition-colors"
              >
                Get a Personalized Assessment
              </button>

              <button
                onClick={() => {
                  const preset = SCENARIO_PRESETS.find(p => p.id === activePreset);
                  if (preset) {
                    setInputs(preset.defaults);
                    setImprovements(preset.improvementRates);
                  }
                }}
                className="w-full mt-3 py-2.5 text-sm text-[#737373] hover:text-[#404040] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Scenario Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-[#404040]">{label}</label>
        <span className="text-sm font-semibold text-[#171717]">
          {value} {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 bg-[#F0F0F0] appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #2563EB 0%, #2563EB ${percent}%, #F0F0F0 ${percent}%, #F0F0F0 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function SavingsRow({
  label,
  icon: Icon,
  amount,
  percent,
  formatCurrency,
}: {
  label: string;
  icon: any;
  amount: number;
  percent: number;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#2563EB]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-[#404040]">{label}</span>
          <span className="text-sm font-semibold text-[#16A34A]">
            +{formatCurrency(amount)}
          </span>
        </div>
        <div className="h-1.5 bg-[#F0F0F0] overflow-hidden">
          <div
            className="h-full bg-[#16A34A]"
            style={{ width: `${Math.min(percent * 2, 100)}%` }}
          />
        </div>
        <div className="text-xs text-[#A3A3A3] mt-0.5">{percent}% improvement</div>
      </div>
    </div>
  );
}
