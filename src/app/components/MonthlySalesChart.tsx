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

export const MonthlySalesChart: React.FC<{histories: any}> = ({histories}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [revenueData, setRevenueData] = useState<number[]>(new Array(12).fill(0));
  const [years, setYears] = useState<string[]>([]);
  //const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    // Initialize an array of 12 months with zeros
    const exististYears: string[] = [];
    for (const history of histories) {
        const date = new Date(history.created_at);
        const year = date.getFullYear().toString();
        if (!exististYears.includes(year)) {
            exististYears.push(year);
        }
    }
    if (!exististYears.includes(currentYear.toString())) {
        setSelectedYear(currentYear.toString());
    }
    setYears(exististYears);

    const monthlyRevenue = new Array(12).fill(0);
    
    // Process histories to sum up revenue by month for the selected year
    histories.forEach((history: any) => {
      const date = new Date(history.created_at);
      const year = date.getFullYear().toString();
      
      if (year === selectedYear) {
        const month = date.getMonth(); // 0-11
        monthlyRevenue[month] += history.price;
      }
    });

    setRevenueData(monthlyRevenue);
  }, [selectedYear, histories]);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Revenue',
        data: revenueData,
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
        borderColor: 'rgb(220, 38, 38)',
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
        text: `Monthly Sales - ${selectedYear}`,
        font: {
          size: 16,
          weight: 600 
        },
        color: 'white',
        padding: 10,
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number; }; }) => formatCurrency(context.parsed.y),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(Number(value)),
        },
      },
    },
    layout: {
      padding: 10,
    },
  };

  return (
    <Card className="w-full">
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-default-900">
              Revenue Overview - {selectedYear}
            </h2>
            <Select
              label="Select Year"
              value={selectedYear}
              //defaultValue={selectedYear}
              
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-32 sm:w-40"
            >
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default MonthlySalesChart;
