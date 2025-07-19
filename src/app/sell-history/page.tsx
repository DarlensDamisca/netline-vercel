'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
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
  Pagination,
  Input,
  Tabs,
  Tab
} from "@nextui-org/react";
import { FaCalendarAlt, FaFilter, FaSearch, FaUser, FaClock, FaCalculator, FaShare } from 'react-icons/fa';
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
  number:string;
  duration_hour: string;
  price: number;
  by: string;
  comment: string;
  date: { $date: string };
  __v: number;
}

export default function SellHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [solds, setSolds] = useState<Sold[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSolds, setUserSolds] = useState<Sold[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get current date for default filter values
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number | null>(currentDate.getFullYear());
  
  const [showCommissionCard, setShowCommissionCard] = useState(false);
  const [commissionData, setCommissionData] = useState<{
    vendorName: string;
    month: string;
    year: number;
    totalSales: number;
    vendorPercentage: number;
    vendorCommission: number;
    systemPercentage: number;
    systemAmount: number;
  } | null>(null);
  
  const rowsPerPage = 10;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get current year for filtering
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('/api/items?table=users&params=' + encodeURIComponent(JSON.stringify({ type: { $in: ['VENDOR', 'SYSTEM_ADMIN'] } })));
        const usersData = await usersResponse.json();

        console.log(usersData); // Log the first user to see the structure
        
        // Fetch solds
        const soldsResponse = await fetch('/api/items?table=solds');
        const soldsData = await soldsResponse.json();
        const finalResult:any = []
        for (const user of usersData) {
          finalResult.push({
            _id : user._id,
            complete_name: user.lastname,
            name: user.name,
            user_number: user.user_number,
            type: user.type,
            created_at: user.created_at
          })
        }
        setUsers(finalResult); // Set the entire array of users
        setSolds(soldsData);

        console.log(finalResult)
        
        // Filter users who are clients or system administrators
        const filteredUsers = usersData.filter((user: User) => 
          user.type === 'VENDOR' || user.type === 'SYSTEM_ADMINISTRATOR'
        );
        
        setFilteredUsers(finalResult);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    
    // Filter solds for the selected user
    const userSolds = solds.filter(sold => sold.by === user._id);
    setUserSolds(userSolds);
    
    // Set filters to current month and year
    const currentDate = new Date();
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
    
    // Reset pagination
    setCurrentPage(1);
  };

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // If search query is empty, show all filtered users
      const filtered = users.filter(user => 
        user.type === 'VENDOR' || user.type === 'SYSTEM_ADMINISTRATOR'
      );
      setFilteredUsers(filtered);
    } else {
      // Filter users based on search query
      const filtered = users.filter(user => 
        (user.type === 'VENDOR' || user.type === 'SYSTEM_ADMINISTRATOR') &&
        (user.complete_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.user_number?.toLowerCase().includes(searchQuery.toLowerCase())));
      setFilteredUsers(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, users]);

  // Filter user solds by month and year
  const getFilteredSolds = () => {
    if (!selectedUser) return [];
    
    let filtered = [...userSolds];
    
    if (selectedMonth !== null) {
      filtered = filtered.filter(sold => {
        try {
          // Handle MongoDB date format
          let dateObj;
          if (sold.date && typeof sold.date === 'object' && '$date' in sold.date) {
            dateObj = new Date(sold.date.$date as string);
          } else {
            dateObj = new Date(sold.date as string | number);
          }
          
          return dateObj.getMonth() === selectedMonth;
        } catch (error) {
          console.error('Error filtering by month:', error);
          return false;
        }
      });
    }
    
    if (selectedYear !== null) {
      filtered = filtered.filter(sold => {
        try {
          // Handle MongoDB date format
          let dateObj;
          if (sold.date && typeof sold.date === 'object' && '$date' in sold.date) {
            dateObj = new Date(sold.date.$date as string);
          } else {
            dateObj = new Date(sold.date as string | number);
          }
          
          return dateObj.getFullYear() === selectedYear;
        } catch (error) {
          console.error('Error filtering by year:', error);
          return false;
        }
      });
    }
    
    // Sort by date - most recent first (descending order)
    filtered.sort((a, b) => {
      try {
        let dateA, dateB;
        
        // Handle MongoDB date format for item a
        if (a.date && typeof a.date === 'object' && '$date' in a.date) {
          dateA = new Date(a.date.$date as string);
        } else {
          dateA = new Date(a.date as string | number);
        }
        
        // Handle MongoDB date format for item b
        if (b.date && typeof b.date === 'object' && '$date' in b.date) {
          dateB = new Date(b.date.$date as string);
        } else {
          dateB = new Date(b.date as string | number);
        }
        
        // Sort in descending order (most recent first)
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        console.error('Error sorting by date:', error);
        return 0;
      }
    });
    
    return filtered;
  };

  // Pagination logic
  const filteredSolds = getFilteredSolds();
  const totalPages = Math.ceil(filteredSolds.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedSolds = filteredSolds.slice(startIndex, startIndex + rowsPerPage);

  // Format date
  const formatDate = (dateObj: any): JSX.Element | string => {
    try {
      // Check if the date is in MongoDB format with $date field
      if (dateObj && typeof dateObj === 'object' && '$date' in dateObj) {
        const date = new Date(dateObj.$date as string);
        if (isNaN(date.getTime())) {
          return 'N/A'; // Return N/A for invalid dates
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="text-xs text-default-500">
              {date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        );
      }
      
      // Regular date string
      const date = new Date(dateObj as string | number);
      if (isNaN(date.getTime())) {
        return 'N/A'; // Return N/A for invalid dates
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          <span className="text-xs text-default-500">
            {date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      );
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Calculate total sales for the selected user
  const calculateTotalSales = () => {
    return filteredSolds.reduce((total, sold) => total + sold.price, 0);
  };

  // Calculate commission for vendor
  const calculateCommission = () => {
    const totalSales = calculateTotalSales();
    const vendorPercentage = 10; // 10% pour le vendeur
    const vendorCommission = (totalSales * vendorPercentage) / 100;
    const systemPercentage = 90; // 90% pour le système
    const systemAmount = (totalSales * systemPercentage) / 100;
    
    setCommissionData({
      vendorName: selectedUser?.complete_name || 'Unknown',
      month: selectedMonth !== null ? months[selectedMonth] : 'All months',
      year: selectedYear || currentYear,
      totalSales,
      vendorPercentage,
      vendorCommission,
      systemPercentage,
      systemAmount
    });
    setShowCommissionCard(true);
  };

  // Share commission card as image
  const shareCommissionCard = async () => {
    const element = document.getElementById('commission-card');
    if (!element) return;
    
    try {
      // Create a temporary canvas to draw the card
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 600;
      
      // Draw background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw content manually (since html2canvas is not available)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Add text content
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Commission Report', canvas.width / 2, 60);
      
      ctx.font = '16px Arial';
      ctx.fillText(`${commissionData?.month} ${commissionData?.year}`, canvas.width / 2, 90);
      
      ctx.font = '18px Arial';
      ctx.fillText(`Vendor: ${commissionData?.vendorName}`, canvas.width / 2, 130);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Total Sales: $${commissionData?.totalSales.toLocaleString()}`, canvas.width / 2, 180);
      
      ctx.fillStyle = '#10b981';
      ctx.font = '18px Arial';
      ctx.fillText(`Vendor (${commissionData?.vendorPercentage}%): $${commissionData?.vendorCommission.toLocaleString()}`, canvas.width / 2, 230);
      
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`System (${commissionData?.systemPercentage}%): $${commissionData?.systemAmount.toLocaleString()}`, canvas.width / 2, 270);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const file = new File([blob], 'commission-report.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'Commission Report',
            text: `Commission report for ${commissionData?.vendorName} - ${commissionData?.month} ${commissionData?.year}`
          }).catch(console.error);
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'commission-report.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-6 sm:px-8 py-4 sm:py-6 pb-16 md:pb-20">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold mb-4 text-foreground"
        >
          Sell History
        </motion.h2>
        <p className="text-sm text-default-500 mb-6">View and analyze sales history by user, month, and year</p>
        
        {/* Mobile View */}
        <div className="block md:hidden">
          <div className="mb-4">
            <Card className="shadow-md">
              <CardBody className="p-2">
                <Input
                  startContent={<FaSearch className="text-default-400" />}
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full mb-3"
                  size="sm"
                  variant="bordered"
                />
                <div className="overflow-y-auto max-h-[200px]">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center py-4 text-default-400">No users found</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredUsers.map((user) => (
                        <Button 
                          key={user._id}
                          variant={selectedUser?._id === user._id ? "bordered" : "flat"}
                          color={selectedUser?._id === user._id ? "danger" : "default"}
                          className={`justify-start text-left py-2 rounded-lg  transition-transform ${selectedUser?._id === user._id ? 'border-danger border-2' : ''}`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <FaUser className="text-sm text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.complete_name || 'Unknown User'}</p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
          
          {selectedUser && (
            <div className="mb-4">
              <Card className="shadow-md">
                <CardHeader className="flex flex-col gap-1 p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedUser.name || 'Select a user'}</h3>
                      <p className="text-xs text-default-500">
                        Total Sales: <span className="font-semibold text-success">${calculateTotalSales().toLocaleString()}</span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<FaCalculator />}
                      onClick={calculateCommission}
                    >
                      Commission
                    </Button>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className="p-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button 
                          variant="flat" 
                          startContent={<FaCalendarAlt className="text-primary" />}
                          size="sm"
                          className="text-xs bg-default-50"
                        >
                          {selectedMonth !== null ? months[selectedMonth] : 'Month'}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu 
                        aria-label="Month selection"
                        onAction={(key) => {
                          if (key === 'null') {
                            setSelectedMonth(null);
                          } else {
                            setSelectedMonth(Number(key));
                          }
                        }}
                        variant="solid"
                        className="bg-background"
                        items={[
                          { key: 'null', label: 'All Months' },
                          ...months.map((month, index) => ({
                            key: index.toString(),
                            label: month
                          }))
                        ]}
                      >
                        {(item: {key: string, label: string}) => (
                          <DropdownItem key={item.key} className="text-foreground">
                            {item.label}
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                    
                    <Dropdown>
                      <DropdownTrigger>
                        <Button 
                          variant="flat" 
                          startContent={<FaCalendarAlt className="text-primary" />}
                          size="sm"
                          className="text-xs bg-default-50"
                        >
                          {selectedYear !== null ? selectedYear.toString() : 'Year'}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu 
                        aria-label="Year selection"
                        onAction={(key) => {
                          if (key === 'null') {
                            setSelectedYear(null);
                          } else {
                            setSelectedYear(Number(key));
                          }
                        }}
                        variant="solid"
                        className="bg-background"
                        items={[
                          { key: 'null', label: 'All Years' },
                          ...years.map((year) => ({
                            key: year.toString(),
                            label: year.toString()
                          }))
                        ]}
                      >
                        {(item: {key: string, label: string}) => (
                          <DropdownItem key={item.key} className="text-foreground">
                            {item.label}
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
          
          {selectedUser && (
            <div>
              {paginatedSolds.length > 0 ? (
                <div className="space-y-3">
                  {paginatedSolds.map((sold) => (
                    <motion.div
                      key={sold._id.$oid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{sold.profile}</p>
                              <div className="flex items-center gap-1 text-xs text-default-500">
                                <FaClock />
                                <span>{sold.duration_hour} hours</span>
                              </div>
                            </div>
                            <Chip 
                              color={sold.status === 'COMPLETED' ? 'success' : 
                                    sold.status === 'PENDING' ? 'warning' : 'danger'}
                              variant="flat"
                              size="sm"
                              className="capitalize"
                            >
                              {sold.status.toLowerCase()}
                            </Chip>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="text-default-500">
                              {formatDate(sold.date)}
                            </div>
                            <div className="font-semibold text-success">${sold.price}</div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={setCurrentPage}
                        color="primary"
                        showControls
                        size="sm"
                        classNames={{
                          wrapper: "gap-0 overflow-visible",
                          item: "w-7 h-7",
                          cursor: "bg-primary text-white font-bold"
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Card className="shadow-md">
                  <CardBody className="py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-default-100 p-4 rounded-full mb-3">
                        <FaFilter className="text-2xl text-default-300" />
                      </div>
                      <p className="text-default-500 text-sm">No sales found</p>
                      <p className="text-default-400 text-xs mt-1">Try changing the filters</p>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
          
          {!selectedUser && (
            <Card className="shadow-md">
              <CardBody className="py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-default-100 p-4 rounded-full mb-3">
                    <FaUser className="text-2xl text-default-300" />
                  </div>
                  <p className="text-default-500 text-sm">Select a user to view sales history</p>
                  <p className="text-default-400 text-xs mt-1">Choose a user from the list above</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {/* Users List */}
          <Card className="md:col-span-1 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-center bg-default-100 p-4">
              <h2 className="text-xl font-semibold mb-2 sm:mb-0">Users</h2>
              <div className="w-full sm:max-w-xs">
                <Input
                  startContent={<FaSearch className="text-default-400" />}
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  size="sm"
                  variant="bordered"
                />
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="overflow-y-auto max-h-[600px] p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-4 text-default-400">No users found</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredUsers.map((user) => (
                    <Button 
                      key={user._id}
                      variant={selectedUser?._id === user._id ? "bordered" : "flat"}
                      color={selectedUser?._id === user._id ? "danger" : "default"}
                      className={`justify-start text-left py-3 rounded-lg hover:scale-[1.02] transition-transform ${selectedUser?._id === user._id ? 'border-danger border-2' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <FaUser className="text-sm text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.complete_name || 'Unknown User'}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
          
          {/* Sales Details */}
          <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-default-100 p-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedUser ? selectedUser.name || 'Select a user' : 'Select a user'}
                </h2>
                {selectedUser && (
                  <p className="text-sm text-default-500">
                    Total Sales: <span className="font-semibold text-success">${calculateTotalSales().toLocaleString()}</span>
                  </p>
                )}
              </div>
              
              {selectedUser && (
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                  <Button
                    color="primary"
                    variant="solid"
                    startContent={<FaCalculator />}
                    onClick={calculateCommission}
                    size="sm"
                  >
                    Calculate Commission
                  </Button>
                  
                  <Dropdown>
                    <DropdownTrigger>
                      <Button 
                        variant="flat" 
                        startContent={<FaCalendarAlt className="text-primary" />}
                        className="bg-default-50 text-foreground text-sm"
                        size="sm"
                      >
                        {selectedMonth !== null ? months[selectedMonth] : 'Month'}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="Month selection"
                      onAction={(key) => {
                        if (key === 'null') {
                          setSelectedMonth(null);
                        } else {
                          setSelectedMonth(Number(key));
                        }
                      }}
                      variant="solid"
                      className="bg-background"
                      items={[
                        { key: 'null', label: 'All Months' },
                        ...months.map((month, index) => ({
                          key: index.toString(),
                          label: month
                        }))
                      ]}
                    >
                      {(item: {key: string, label: string}) => (
                        <DropdownItem key={item.key} className="text-foreground">
                          {item.label}
                        </DropdownItem>
                      )}
                    </DropdownMenu>
                  </Dropdown>
                  
                  <Dropdown>
                    <DropdownTrigger>
                      <Button 
                        variant="flat" 
                        startContent={<FaCalendarAlt className="text-primary" />}
                        className="bg-default-50 text-foreground text-sm"
                        size="sm"
                      >
                        {selectedYear !== null ? selectedYear.toString() : 'Year'}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="Year selection"
                      onAction={(key) => {
                        if (key === 'null') {
                          setSelectedYear(null);
                        } else {
                          setSelectedYear(Number(key));
                        }
                      }}
                      variant="solid"
                      className="bg-background"
                      items={[
                        { key: 'null', label: 'All Years' },
                        ...years.map((year) => ({
                          key: year.toString(),
                          label: year.toString()
                        }))
                      ]}
                    >
                      {(item: {key: string, label: string}) => (
                        <DropdownItem key={item.key} className="text-foreground">
                          {item.label}
                        </DropdownItem>
                      )}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              )}
            </CardHeader>
            <Divider />
            <CardBody className="p-0 sm:p-2">
              {selectedUser ? (
                paginatedSolds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table 
                      aria-label="Sales history table"
                      className="min-w-full"
                      removeWrapper
                      classNames={{
                        th: "bg-transparent text-default-500 border-b border-divider text-xs sm:text-sm",
                        td: "py-2 sm:py-4 text-xs sm:text-sm"
                      }}
                    >
                      <TableHeader>
                        <TableColumn>PROFILE</TableColumn>
                        <TableColumn>DURATION</TableColumn>
                        <TableColumn>PRICE</TableColumn>
                        <TableColumn>DATE</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {paginatedSolds.map((sold) => (
                          <TableRow key={sold._id.$oid} className="hover:bg-default-50 transition-colors">
                            <TableCell>
                              <div className="font-medium">{sold.profile}</div>
                            </TableCell>
                           
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <FaClock className="text-xs text-default-400" />
                                <span>{sold.duration_hour} hours</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-success">${sold.price}</div>
                            </TableCell>
                            <TableCell>{formatDate(sold.date)}</TableCell>
                            <TableCell>
                              <Chip 
                                color={sold.status === 'COMPLETED' ? 'success' : 
                                      sold.status === 'PENDING' ? 'warning' : 'danger'}
                                variant="flat"
                                size="sm"
                                className="capitalize"
                              >
                                {sold.status.toLowerCase()}
                              </Chip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-default-100 p-6 rounded-full mb-4">
                      <FaFilter className="text-4xl text-default-300" />
                    </div>
                    <p className="text-default-500 text-lg">No sales found for the selected filters</p>
                    <p className="text-default-400 text-sm mt-2">Try changing the month or year filters</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="bg-default-100 p-6 rounded-full mb-4">
                    <FaUser className="text-4xl text-default-300" />
                  </div>
                  <p className="text-default-500 text-lg">Select a user to view their sales history</p>
                  <p className="text-default-400 text-sm mt-2">Choose a user from the list on the left</p>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    color="primary"
                    showControls
                    classNames={{
                      wrapper: "gap-0 overflow-visible shadow-sm rounded-lg",
                      item: "w-8 h-8",
                      cursor: "bg-primary text-white font-bold"
                    }}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
        
        {/* Commission Card Modal */}
        <AnimatePresence>
          {showCommissionCard && commissionData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCommissionCard(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
              >
                <div id="commission-card" className="p-6 bg-gradient-to-br from-primary/10 to-success/10 rounded-xl">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Commission Report</h3>
                    <div className="inline-flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full">
                      <FaCalendarAlt className="text-primary" />
                      <span className="text-sm font-medium">{commissionData.month} {commissionData.year}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FaUser className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vendor</p>
                        <p className="font-semibold text-gray-800">{commissionData.vendorName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Sales</span>
                        <span className="text-xl font-bold text-gray-800">${commissionData.totalSales.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-primary to-success h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-success/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 bg-success rounded-full"></div>
                          <span className="text-sm font-medium text-gray-600">Vendor ({commissionData.vendorPercentage}%)</span>
                        </div>
                        <p className="text-lg font-bold text-success">${commissionData.vendorCommission.toLocaleString()}</p>
                      </div>
                      
                      <div className="bg-primary/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium text-gray-600">System ({commissionData.systemPercentage}%)</span>
                        </div>
                        <p className="text-lg font-bold text-primary">${commissionData.systemAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-center text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-b-xl flex gap-2">
                  <Button
                    color="primary"
                    variant="solid"
                    startContent={<FaShare />}
                    onClick={shareCommissionCard}
                    className="flex-1"
                  >
                    Share on WhatsApp
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    onClick={() => setShowCommissionCard(false)}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
