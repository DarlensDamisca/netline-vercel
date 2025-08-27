'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { LoadingAnimation } from '../components/LoadingAnimation';
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress
} from "@nextui-org/react";
import { FaChartBar, FaCalendarAlt, FaUsers, FaDollarSign, FaPercent, FaDownload, FaFilter } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface User {
  _id: string;
  complete_name: string;
  name: string;
  user_number: string;
  type: string;
  created_at: string;
}

interface Sold {
  _id: { $oid: string };
  status: string;
  profile: string;
  name: string;
  number: string;
  duration_hour: string;
  price: number;
  by: string;
  comment: string;
  date: { $date: string };
  __v: number;
}

interface CommissionReport {
  userId: string;
  userName: string;
  userType: string;
  totalSales: number;
  commissionPercentage: number;
  commissionAmount: number;
  systemPercentage: number;
  systemAmount: number;
  salesCount: number;
}

export default function Reports() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [solds, setSolds] = useState<Sold[]>([]);
  const [reports, setReports] = useState<CommissionReport[]>([]);
  
  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number | null>(currentDate.getFullYear());
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users (vendors and admins)
        const usersResponse = await fetch('/api/items?table=users&params=' + 
          encodeURIComponent(JSON.stringify({ type: { $in: ['VENDOR', 'SYSTEM_ADMINISTRATOR'] } })));
        const usersData = await usersResponse.json();
        
        // Fetch all sales
        const soldsResponse = await fetch('/api/items?table=solds');
        const soldsData = await soldsResponse.json();
        
        // Process users data
        const processedUsers = usersData.map((user: any) => ({
          _id: user._id,
          complete_name: user.lastname || user.name,
          name: user.name,
          user_number: user.user_number,
          type: user.type,
          created_at: user.created_at
        }));
        
        setUsers(processedUsers);
        setSolds(soldsData);
        
        // Generate reports
        generateReports(processedUsers, soldsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate commission reports
  const generateReports = (users: User[], solds: Sold[]) => {
    const reportsData: CommissionReport[] = [];
    
    users.forEach(user => {
      // Get commission percentage based on user type
      const commissionPercentage = user.type === 'VENDOR' ? 10 : 0; // Vendors get 10%, Admins get 0%
      
      // Filter sales by user and selected period
      const userSales = filterSalesByPeriod(solds.filter(sold => sold.by === user._id));
      
      // Calculate totals
      const totalSales = userSales.reduce((sum, sold) => sum + sold.price, 0);
      const commissionAmount = (totalSales * commissionPercentage) / 100;
      const systemPercentage = 100 - commissionPercentage;
      const systemAmount = (totalSales * systemPercentage) / 100;
      
      reportsData.push({
        userId: user._id,
        userName: user.complete_name || user.name,
        userType: user.type,
        totalSales,
        commissionPercentage,
        commissionAmount,
        systemPercentage,
        systemAmount,
        salesCount: userSales.length
      });
    });
    
    // Sort by total sales (highest first)
    reportsData.sort((a, b) => b.totalSales - a.totalSales);
    
    setReports(reportsData);
  };

  // Filter sales by selected period
  const filterSalesByPeriod = (sales: Sold[]) => {
    return sales.filter(sold => {
      try {
        let dateObj;
        if (sold.date && typeof sold.date === 'object' && '$date' in sold.date) {
          dateObj = new Date(sold.date.$date);
        } else {
          dateObj = new Date(sold.date as string | number);
        }
        
        const matchesMonth = selectedMonth === null || dateObj.getMonth() === selectedMonth;
        const matchesYear = selectedYear === null || dateObj.getFullYear() === selectedYear;
        
        return matchesMonth && matchesYear;
      } catch (error) {
        console.error('Error filtering by date:', error);
        return false;
      }
    });
  };

  // Update reports when filters change
  useEffect(() => {
    if (users.length > 0 && solds.length > 0) {
      generateReports(users, solds);
    }
  }, [selectedMonth, selectedYear]);

  // Get filtered reports based on user type
  const getFilteredReports = () => {
    if (selectedUserType === 'all') return reports;
    return reports.filter(report => report.userType === selectedUserType);
  };

  // Calculate totals
  const calculateTotals = () => {
    const filteredReports = getFilteredReports();
    return {
      totalSales: filteredReports.reduce((sum, report) => sum + report.totalSales, 0),
      totalCommission: filteredReports.reduce((sum, report) => sum + report.commissionAmount, 0),
      totalSystem: filteredReports.reduce((sum, report) => sum + report.systemAmount, 0),
      totalCount: filteredReports.reduce((sum, report) => sum + report.salesCount, 0)
    };
  };

  // Export to CSV
  const exportToCSV = () => {
    const filteredReports = getFilteredReports();
    const totals = calculateTotals();
    
    // Create CSV content
    const headers = ['Name', 'Type', 'Total Sales', 'Commission %', 'Commission Amount', 'System Amount', 'Sales Count'];
    const rows = filteredReports.map(report => [
      report.userName,
      report.userType,
      report.totalSales.toFixed(2),
      `${report.commissionPercentage}%`,
      report.commissionAmount.toFixed(2),
      report.systemAmount.toFixed(2),
      report.salesCount
    ]);
    
    // Add totals row
    rows.push(['', '', '', '', '', '', '']);
    rows.push(['TOTAL', '', totals.totalSales.toFixed(2), '', totals.totalCommission.toFixed(2), totals.totalSystem.toFixed(2), totals.totalCount.toString()]);
    
    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${selectedMonth !== null ? months[selectedMonth] : 'all'}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  const filteredReports = getFilteredReports();
  const totals = calculateTotals();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-semibold mb-2 text-foreground flex items-center gap-2">
            <FaChartBar className="text-primary" />
            Reports
          </h2>
          <p className="text-sm text-default-500">Commission overview and sales analytics</p>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6 shadow-md">
          <CardBody className="p-4">
            <div className="flex flex-wrap gap-3">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<FaCalendarAlt className="text-primary" />}
                    className="bg-default-100"
                  >
                    {selectedMonth !== null ? months[selectedMonth] : 'All Months'}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Month selection"
                  onAction={(key) => setSelectedMonth(key === 'null' ? null : Number(key))}
                >
                  <DropdownItem key="null">All Months</DropdownItem>
                  {months.map((month, index) => (
                    <DropdownItem key={index}>{month}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<FaCalendarAlt className="text-primary" />}
                    className="bg-default-100"
                  >
                    {selectedYear || 'All Years'}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Year selection"
                  onAction={(key) => setSelectedYear(key === 'null' ? null : Number(key))}
                >
                  <DropdownItem key="null">All Years</DropdownItem>
                  {years.map((year) => (
                    <DropdownItem key={year}>{year}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    startContent={<FaFilter className="text-primary" />}
                    className="bg-default-100"
                  >
                    {selectedUserType === 'all' ? 'All Users' : 
                     selectedUserType === 'VENDOR' ? 'Vendors Only' : 'Admins Only'}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="User type selection"
                  onAction={(key) => setSelectedUserType(key as string)}
                >
                  <DropdownItem key="all">All Users</DropdownItem>
                  <DropdownItem key="VENDOR">Vendors Only</DropdownItem>
                  <DropdownItem key="SYSTEM_ADMINISTRATOR">Admins Only</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Button
                color="primary"
                variant="solid"
                startContent={<FaDownload />}
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Total Sales</p>
                    <p className="text-2xl font-bold">${totals.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FaDollarSign className="text-primary text-xl" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Total Commission</p>
                    <p className="text-2xl font-bold text-success">${totals.totalCommission.toLocaleString()}</p>
                  </div>
                  <div className="bg-success/10 p-3 rounded-full">
                    <FaPercent className="text-success text-xl" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-default-500 mb-1">System Amount</p>
                    <p className="text-2xl font-bold text-primary">${totals.totalSystem.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FaDollarSign className="text-primary text-xl" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Total Sales Count</p>
                    <p className="text-2xl font-bold">{totals.totalCount}</p>
                  </div>
                  <div className="bg-default-100 p-3 rounded-full">
                    <FaUsers className="text-default-500 text-xl" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Commission Table */}
        <Card className="shadow-md">
          <CardHeader className="bg-default-100 p-4">
            <h3 className="text-lg font-semibold">Commission Breakdown</h3>
          </CardHeader>
          <Divider />
          <CardBody className="p-0 overflow-x-auto">
            <Table 
              aria-label="Commission reports table"
              removeWrapper
              classNames={{
                th: "bg-transparent text-default-500 border-b border-divider",
                td: "py-3"
              }}
            >
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>SALES</TableColumn>
                <TableColumn>TOTAL SALES</TableColumn>
                <TableColumn>COMMISSION</TableColumn>
                <TableColumn>VENDOR AMOUNT</TableColumn>
                <TableColumn>SYSTEM AMOUNT</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.userId} className="hover:bg-default-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <FaUsers className="text-xs text-primary" />
                          </div>
                          <span className="font-medium">{report.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={report.userType === 'VENDOR' ? 'success' : 'primary'}
                        >
                          {report.userType === 'VENDOR' ? 'Vendor' : 'Admin'}
                        </Chip>
                      </TableCell>
                      <TableCell>{report.salesCount}</TableCell>
                      <TableCell>
                        <span className="font-semibold">${report.totalSales.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={report.commissionPercentage} 
                            maxValue={100}
                            size="sm"
                            color="success"
                            className="max-w-[60px]"
                          />
                          <span className="text-sm">{report.commissionPercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-success font-medium">
                          ${report.commissionAmount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">
                          ${report.systemAmount.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="bg-default-100 p-4 rounded-full mb-3">
                          <FaChartBar className="text-2xl text-default-300" />
                        </div>
                        <p className="text-default-500">No data available for the selected period</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {filteredReports.length > 0 && (
              <div className="border-t border-divider p-4 bg-default-50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">TOTAL</span>
                  <div className="flex gap-6">
                    <div className="text-right">
                      <p className="text-xs text-default-500">Total Sales</p>
                      <p className="font-bold text-lg">${totals.totalSales.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-default-500">Total Commission</p>
                      <p className="font-bold text-lg text-success">${totals.totalCommission.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-default-500">Total System</p>
                      <p className="font-bold text-lg text-primary">${totals.totalSystem.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  );
}
