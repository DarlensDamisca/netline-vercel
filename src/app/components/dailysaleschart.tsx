'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem, Switch } from '@nextui-org/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'HTG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const DailySalesChart: React.FC<{histories: any}> = ({histories}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [showFrequency, setShowFrequency] = useState(false);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  useEffect(() => {
    // Extract available years and months from histories
    const existingYears: Set<string> = new Set();
    const yearMonthMap: Map<string, Set<string>> = new Map();
    
    histories.forEach((history: any) => {
      const date = new Date(history.created_at);
      const year = date.getFullYear().toString();
      const month = date.getMonth().toString();
      
      existingYears.add(year);
      
      if (!yearMonthMap.has(year)) {
        yearMonthMap.set(year, new Set());
      }
      yearMonthMap.get(year)?.add(month);
    });
    
    const yearArray = Array.from(existingYears).sort((a, b) => Number(b) - Number(a));
    setYears(yearArray);
    
    // Update available months for selected year
    const monthsForYear = yearMonthMap.get(selectedYear);
    if (monthsForYear) {
      setAvailableMonths(Array.from(monthsForYear).sort((a, b) => Number(a) - Number(b)));
    } else {
      setAvailableMonths([]);
    }
  }, [histories, selectedYear]);

  useEffect(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Initialize arrays with zeros for each day of the month
    const dailyRevenue = new Array(daysInMonth).fill(0);
    const dailyFrequency = new Array(daysInMonth).fill(0);
    
    // Process histories to sum up revenue and count sales by day for the selected month/year
    histories.forEach((history: any) => {
      const date = new Date(history.created_at);
      const historyYear = date.getFullYear();
      const historyMonth = date.getMonth();
      
      if (historyYear === year && historyMonth === month) {
        const day = date.getDate() - 1; // 0-indexed for array
        dailyRevenue[day] += history.price;
        dailyFrequency[day] += 1;
      }
    });
    
    setRevenueData(dailyRevenue);
    setFrequencyData(dailyFrequency);
  }, [selectedYear, selectedMonth, histories]);

  // Generate labels for days of the month
  const daysInSelectedMonth = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
  const dayLabels = Array.from({ length: daysInSelectedMonth }, (_, i) => (i + 1).toString());

  // Calculate min and max values for coloring based on current view
  const currentData = showFrequency ? frequencyData : revenueData;
  const daysWithSalesArray = currentData.filter(value => value > 0);
  const maxDaily = Math.max(...currentData, 0);
  const minDaily = daysWithSalesArray.length > 0 ? Math.min(...daysWithSalesArray) : 0;

  // Generate colors for each bar based on value
  const getBarColors = () => {
    return currentData.map(value => {
      if (value === 0) {
        return 'rgba(59, 130, 246, 0.7)'; // Blue for zero/no sales
      } else if (value === maxDaily) {
        return 'rgba(34, 197, 94, 0.7)'; // Green for maximum
      } else if (value === minDaily) {
        return 'rgba(239, 68, 68, 0.7)'; // Red for minimum
      } else {
        return 'rgba(59, 130, 246, 0.7)'; // Blue for others
      }
    });
  };

  const getBorderColors = () => {
    return currentData.map(value => {
      if (value === 0) {
        return 'rgb(59, 130, 246)'; // Blue border
      } else if (value === maxDaily) {
        return 'rgb(34, 197, 94)'; // Green border
      } else if (value === minDaily) {
        return 'rgb(239, 68, 68)'; // Red border
      } else {
        return 'rgb(59, 130, 246)'; // Blue border
      }
    });
  };

  const chartData = {
    labels: dayLabels,
    datasets: [
      {
        label: showFrequency ? 'Number of Sales' : 'Daily Revenue',
        data: currentData,
        backgroundColor: getBarColors(),
        borderColor: getBorderColors(),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Daily ${showFrequency ? 'Sales Frequency' : 'Revenue'} - ${getMonthName(parseInt(selectedMonth))} ${selectedYear}`,
        font: {
          size: 16,
          weight: 600 
        },
        color: 'white',
        padding: 10,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const day = context[0].label;
            return `${getMonthName(parseInt(selectedMonth))} ${day}, ${selectedYear}`;
          },
          label: (context: { parsed: { y: number; }; }) => {
            const value = context.parsed.y;
            const revenueValue = revenueData[context.dataIndex];
            const frequencyValue = frequencyData[context.dataIndex];
            
            let status = '';
            if (value === 0) {
              status = ' (No sales)';
            } else if (value === maxDaily) {
              status = ' (Best day)';
            } else if (value === minDaily) {
              status = ' (Worst day)';
            }
            
            if (showFrequency) {
              return [
                `Sales: ${frequencyValue} transaction${frequencyValue !== 1 ? 's' : ''}${status}`,
                `Revenue: ${formatCurrency(revenueValue)}`
              ];
            } else {
              return [
                `Revenue: ${formatCurrency(revenueValue)}${status}`,
                `Sales: ${frequencyValue} transaction${frequencyValue !== 1 ? 's' : ''}`
              ];
            }
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Day of Month',
          font: {
            size: 14,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: showFrequency ? 'Number of Sales' : 'Revenue (HTG)',
          font: {
            size: 14,
          },
        },
        ticks: {
          callback: (value: any) => {
            if (showFrequency) {
              return Number(value);
            } else {
              return formatCurrency(Number(value));
            }
          },
        },
      },
    },
    layout: {
      padding: 10,
    },
  };

  // Calculate statistics
  const monthTotal = revenueData.reduce((sum, value) => sum + value, 0);
  const totalTransactions = frequencyData.reduce((sum, value) => sum + value, 0);
  const averageDaily = revenueData.length > 0 ? monthTotal / revenueData.length : 0;
  const averageTransactionsDaily = frequencyData.length > 0 ? totalTransactions / frequencyData.length : 0;
  const averageTransactionValue = totalTransactions > 0 ? monthTotal / totalTransactions : 0;
  const daysWithSales = frequencyData.filter(value => value > 0).length;
  
  const maxRevenueDaily = Math.max(...revenueData, 0);
  const maxFrequencyDaily = Math.max(...frequencyData, 0);
  const revenueMaxDaysCount = revenueData.filter(value => value === maxRevenueDaily).length;
  const frequencyMaxDaysCount = frequencyData.filter(value => value === maxFrequencyDaily).length;

  return (
    <Card className="w-full">
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {/* Header with controls */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-default-900">
              Daily Sales Overview
            </h2>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Switch 
                  isSelected={showFrequency}
                  onValueChange={setShowFrequency}
                  size="sm"
                />
                <span className="text-sm font-medium">
                  {showFrequency ? 'Show Frequency' : 'Show Revenue'}
                </span>
              </div>
              <div className="flex gap-2">
                <Select
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-28 sm:w-32"
                >
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-32 sm:w-40"
                >
                  {months.map((month) => (
                    <SelectItem 
                      key={month.value} 
                      value={month.value}
                      isDisabled={availableMonths.length > 0 && !availableMonths.includes(month.value)}
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Best day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Worst day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Other days</span>
            </div>
          </div>

          {/* Statistics cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Total Revenue</p>
              <p className="text-lg font-bold text-success">{formatCurrency(monthTotal)}</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Total Sales</p>
              <p className="text-lg font-bold text-primary">{totalTransactions}</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Avg. Transaction</p>
              <p className="text-lg font-bold text-secondary">{formatCurrency(averageTransactionValue)}</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Best Revenue Day</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(maxRevenueDaily)}</p>
              <p className="text-xs text-default-400">{revenueMaxDaysCount} day(s)</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Most Sales Day</p>
              <p className="text-lg font-bold text-warning">{maxFrequencyDaily} sales</p>
              <p className="text-xs text-default-400">{frequencyMaxDaysCount} day(s)</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Active Days</p>
              <p className="text-lg font-bold text-secondary">{daysWithSales} / {daysInSelectedMonth}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default DailySalesChart;
