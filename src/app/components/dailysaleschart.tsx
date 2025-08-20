'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem } from '@nextui-org/react';
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
  const [revenueData, setRevenueData] = useState<number[]>([]);
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
    
    // Initialize array with zeros for each day of the month
    const dailyRevenue = new Array(daysInMonth).fill(0);
    
    // Process histories to sum up revenue by day for the selected month/year
    histories.forEach((history: any) => {
      const date = new Date(history.created_at);
      const historyYear = date.getFullYear();
      const historyMonth = date.getMonth();
      
      if (historyYear === year && historyMonth === month) {
        const day = date.getDate() - 1; // 0-indexed for array
        dailyRevenue[day] += history.price;
      }
    });
    
    setRevenueData(dailyRevenue);
  }, [selectedYear, selectedMonth, histories]);

  // Generate labels for days of the month
  const daysInSelectedMonth = getDaysInMonth(parseInt(selectedYear), parseInt(selectedMonth));
  const dayLabels = Array.from({ length: daysInSelectedMonth }, (_, i) => (i + 1).toString());

  const chartData = {
    labels: dayLabels,
    datasets: [
      {
        label: 'Daily Revenue',
        data: revenueData,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
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
        text: `Daily Sales - ${getMonthName(parseInt(selectedMonth))} ${selectedYear}`,
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
            return `Revenue: ${formatCurrency(context.parsed.y)}`;
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
          text: 'Revenue (HTG)',
          font: {
            size: 14,
          },
        },
        ticks: {
          callback: (value: any) => formatCurrency(Number(value)),
        },
      },
    },
    layout: {
      padding: 10,
    },
  };

  // Calculate total for the month
  const monthTotal = revenueData.reduce((sum, value) => sum + value, 0);
  const averageDaily = revenueData.length > 0 ? monthTotal / revenueData.length : 0;
  const maxDaily = Math.max(...revenueData, 0);
  const daysWithSales = revenueData.filter(value => value > 0).length;

  return (
    <Card className="w-full">
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {/* Header with controls */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-default-900">
              Daily Revenue Overview
            </h2>
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

          {/* Statistics cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Total Revenue</p>
              <p className="text-lg font-bold text-success">{formatCurrency(monthTotal)}</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Daily Average</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(averageDaily)}</p>
            </div>
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-500">Best Day</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(maxDaily)}</p>
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