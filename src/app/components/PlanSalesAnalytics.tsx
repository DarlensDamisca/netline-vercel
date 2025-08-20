'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input, Pagination } from "@nextui-org/react";
import { FaSearch, FaCalendarAlt, FaUsers, FaDollarSign, FaCrown, FaRegClock } from "react-icons/fa";
import { motion } from "framer-motion";
import { MonthlySalesChart } from './MonthlySalesChart';
import { DailySalesChart } from './dailysaleschart';
import { connect } from 'http2';

interface PlanSale {
  planName: string;
  planPrice: number;
  clientName: string;
  connectionNumber: string;
  activationDate: string;
  activationTime: string;
}

interface PlanSummary {
  planName: string;
  totalUsers: number;
  totalRevenue: number;
  sales: PlanSale[];
}

function formatNumberWithCommas(number: number) {
  if (number > 1000) {
    return number.toLocaleString();
  }
  return number.toString();
}


const toHaitiTime = (stringDate: string): string => {
  // Original string date (ISO format)
  //const stringDate = "2024-11-24T15:00:00Z"; // UTC time

  // Convert to Haiti timezone
  const haitiTimeZone = "America/Port-au-Prince";
  const date = new Date(stringDate);

  // Get individual parts adjusted to the Haiti timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: haitiTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23", // Use 24-hour format
  });

  // Format the date
  const [
    { value: month },
    ,
    { value: day },
    ,
    { value: year },
    ,
    { value: hour },
    ,
    { value: minute },
    ,
    { value: second },
  ] = formatter.formatToParts(date);

  // Construct the formatted string
  const haitiDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  //console.log(haitiDate); // Example: 2024-11-24T10:00:00

  return haitiDate;
}

export const PlanSalesAnalytics: React.FC<{ users: any, histories: any }> = ({ users, histories }) => {
  const today = toHaitiTime(new Date().toISOString()).split('T')[0];
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlan, setSelectedPlan] = useState<PlanSummary | null>(null);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;
  const [planSales, setPlanSales] = useState<PlanSale[]>([]);

  // Sample data - replace with actual data from your backend
  /*  const [planSales] = useState<PlanSale[]>([
     { planName: "Basic Plan", planPrice: 29.99, clientName: "John Smith", activationDate: "2024-01-15" },
     { planName: "Basic Plan", planPrice: 29.99, clientName: "Emma Davis", activationDate: "2024-01-18" },
     { planName: "Premium Plan", planPrice: 59.99, clientName: "Michael Brown", activationDate: "2024-01-16" },
     { planName: "Premium Plan", planPrice: 59.99, clientName: "Sarah Wilson", activationDate: "2024-01-20" },
     { planName: "Enterprise Plan", planPrice: 99.99, clientName: "David Johnson", activationDate: "2024-01-17" },
     { planName: "Basic Plan", planPrice: 29.99, clientName: "Lisa Anderson", activationDate: "2024-01-21" },
     { planName: "Premium Plan", planPrice: 59.99, clientName: "James Miller", activationDate: "2024-01-19" },
     { planName: "Enterprise Plan", planPrice: 99.99, clientName: "Patricia Martinez", activationDate: "2024-01-22" },
   ]); */

  useEffect(() => {
    if (users && histories) {
      //console.log(users)
      const plansData = []

      for (const history of histories) {
        const client = users.find((user: any) => user._id === history.user_id);
        const clientName = client ? client.complete_name : '';
        const date : string = toHaitiTime(history.created_at);
        plansData.push({
          planName: history.plan,
          planPrice: history.price,
          clientName: clientName,
          connectionNumber: history.number,
          activationDate: date.split("T")[0],
          activationTime: date.split("T")[1],
        });
      }

      //console.log(plansData)

      setPlanSales(plansData);

    }
  }, [users, histories]);

  const planSummaries = useMemo(() => {
    setIsLoading(true);
    try {
      const filteredSales = planSales.filter(sale => {
        const saleDate = new Date(sale.activationDate);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date(9999, 11, 31);
        return saleDate >= start && saleDate <= end;
      });

      const summaries = filteredSales.reduce((acc: { [key: string]: PlanSummary }, sale) => {
        if (!acc[sale.planName]) {
          acc[sale.planName] = {
            planName: sale.planName,
            totalUsers: 0,
            totalRevenue: 0,
            sales: [],
          };
        }
        acc[sale.planName].totalUsers++;
        acc[sale.planName].totalRevenue += sale.planPrice;
        acc[sale.planName].sales.push(sale);
        return acc;
      }, {});

      return Object.values(summaries);
    } catch (error) {
      console.error('Error calculating plan summaries:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [planSales, startDate, endDate]);

  const totalRevenue = useMemo(() => {
    return planSummaries.reduce((total, plan) => total + plan.totalRevenue, 0);
  }, [planSummaries]);

  const filteredSales = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.sales.filter(sale =>
      sale.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedPlan, searchQuery]);

  const currentSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredSales.slice(start, end);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const topUsers = useMemo(() => {
    if (!planSales.length) return [];
    
    // Filter sales by date range first
    const filteredSales = planSales.filter(sale => {
      const saleDate = new Date(sale.activationDate);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(9999, 11, 31);
      return saleDate >= start && saleDate <= end;
    });
    
    // Create a map to store user purchase totals
    const userPurchases = new Map();
    
    filteredSales.forEach(sale => {
      if (!userPurchases.has(sale.clientName)) {
        userPurchases.set(sale.clientName, {
          name: sale.clientName,
          connectionNumber: 0,
          totalSpent: 0,
          purchaseCount: 0
        });
      }
      const userData = userPurchases.get(sale.clientName);
      userData.totalSpent += sale.planPrice;
      userData.purchaseCount += 1;
      userPurchases.set(sale.clientName, userData);
    });
    
    // Convert to array and sort by total spent
    return Array.from(userPurchases.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);
  }, [planSales, startDate, endDate]);

  const handlePlanClick = (plan: PlanSummary) => {
    setSelectedPlan(plan);
    setSearchQuery("");
    setCurrentPage(1);
    onOpen();
  };

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic plan':
        return <FaUsers className="text-2xl text-primary" />;
      case 'premium plan':
        return <FaCrown className="text-2xl text-warning" />;
      case 'enterprise plan':
        return <FaDollarSign className="text-2xl text-success" />;
      default:
        return <FaUsers className="text-2xl text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-content1">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-default-600 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                startContent={<FaCalendarAlt className="text-default-400" />}
                className="w-full"
                classNames={{
                  input: "text-small",
                  inputWrapper: "h-12"
                }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-default-600 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                startContent={<FaCalendarAlt className="text-default-400" />}
                className="w-full"
                classNames={{
                  input: "text-small",
                  inputWrapper: "h-12"
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                color="primary"
                className="h-12 px-8"
                startContent={<FaSearch />}
                onClick={handleSearch}
                isLoading={isLoading}
              >
                Search
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>

<Card className="w-full mb-6">
            <CardBody>
              <h3 className="text-xl font-bold text-primary mb-4">Top Customers</h3>
              <div className="grid grid-cols-3 gap-1 lg:gap-8 mb-6 lg:p-5">
                {topUsers.map((user, index) => (
                  <Card key={user.name} className="w-full bg-content1/50">
                    <CardBody className="flex items-center gap-4 p-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-500/20' : 
                        index === 1 ? 'bg-gray-400/20' : 
                        'bg-amber-600/20'
                      }`}>
                        <FaCrown className={`text-xl ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          'text-amber-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0 text-center w-full items-center">
                        <h4 className="font-semibold text-sm text-foreground truncate">{user.name}</h4>
                        <div className="flex items-center justify-center mt-1">
                          {/* <p className="text-xs text-default-500">{user.purchaseCount} buys</p> */}
                          <p className="text-xs font-medium text-success">HTG {formatNumberWithCommas(user.totalSpent)}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>

          
          <Card className="w-full">
            <CardBody className="p-0">
              <div className="divide-y divide-default-200">
                {planSummaries.map((plan) => (
                  <div
                    key={plan.planName}
                    className="p-4 hover:bg-default-100 cursor-pointer transition-colors"
                    onClick={() => handlePlanClick(plan)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getPlanIcon(plan.planName)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{plan.planName}</h3>
                          <p className="text-sm text-default-500">{plan.totalUsers} Solds</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <div className="p-2 rounded-lg bg-success/10">
                          <FaDollarSign className="text-lg text-success" />
                        </div> */}
                        <div>
                          <p className="text-md font-semibold text-success">
                            HTG {formatNumberWithCommas(plan.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

         

          <Card className="bg-primary/5">
            <CardBody className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Total Revenue</h3>
                <div className="flex items-center gap-2">
                  <FaDollarSign className="text-2xl text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    ${formatNumberWithCommas(totalRevenue)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>


          <div className="mt-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-semibold mb-6 text-foreground mt-32"
            >
              Monthly sales chart
            </motion.h2>
            <MonthlySalesChart histories={histories} />
          </div>

          <div className="mt-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-semibold mb-6 text-foreground mt-32"
            >
              Daily sales chart
            </motion.h2>
            <DailySalesChart histories={histories} />
          </div>


        </>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {selectedPlan && getPlanIcon(selectedPlan.planName)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedPlan?.planName}  {/*- from {currentSales.length} users */}
                    </h2>
                    <p className="text-sm text-default-500">
                      Total Revenue: ${selectedPlan? formatNumberWithCommas(selectedPlan.totalRevenue) : 0}
                    </p>
                  </div>
                </div>
                <Input
                  isClearable
                  className="w-full"
                  placeholder="Search by client name..."
                  startContent={<FaSearch className="text-default-400" />}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-4">
                  {currentSales.map((sale, index) => (
                    <Card
                      key={index}
                      className="w-full"
                    >
                      <CardBody className="p-4">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3 flex-grow">
                            <div className="p-2 rounded-lg bg-default-100">
                              <FaRegClock className="text-lg text-primary" />
                            </div>
                            <div className="flex-grow">
                              <h3 className="text-base font-semibold text-foreground">{sale.clientName}</h3>
                              <p className="text-sm text-default-500">
                                Number of connections: {sale.connectionNumber}
                              </p>
                              <p className="text-sm text-default-500">
                                Activated on {sale.activationDate} at {sale.activationTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-success/10 px-3 py-1 rounded-lg">
                            <FaDollarSign className="text-success" />
                            <p className="font-semibold text-success">
                              ${sale.planPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter className="flex flex-col gap-4">
                {totalPages > 1 && (
                  <div className="flex w-full justify-center">
                    <Pagination
                      total={totalPages}
                      page={currentPage}
                      onChange={setCurrentPage}
                      color="primary"
                      showControls
                      className="gap-2"
                    />
                  </div>
                )}
                <div className="flex justify-end w-full">
                  <Button
                    color="primary"
                    variant="light"
                    onPress={onClose}
                  >
                    Close
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PlanSalesAnalytics;
