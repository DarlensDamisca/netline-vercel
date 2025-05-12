'use client';

import React, { useState, useEffect } from 'react';
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
import { FaCalendarAlt, FaFilter, FaSearch, FaUser, FaClock } from 'react-icons/fa';
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
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'Select a user'}</h3>
                  <p className="text-xs text-default-500">
                    Total Sales: <span className="font-semibold text-success">${calculateTotalSales().toLocaleString()}</span>
                  </p>
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
      </div>
    </AppLayout>
  );
}
