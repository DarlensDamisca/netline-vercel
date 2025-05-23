'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Pagination, } from "@nextui-org/react";
import { FaUsers, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { IoTrendingUp } from "react-icons/io5";
import { motion } from "framer-motion";
import { PlanSalesAnalytics } from './PlanSalesAnalytics';
import { FaTicket } from 'react-icons/fa6';
import { form } from 'framer-motion/client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: {
    value: string;
    isPositive: boolean;
  };
  delay: number;
}

interface PlanData {
  name: string;
  count: number;
  sold: number;
  status: 'active' | 'expired';
}

interface EnhancedUserData {
  id: number;
  name: string;
  registrationDate: string;
  plansSold: {
    count: ReactNode;
    name: string;
    value: number;
    date: string;
  }[];
  totalSold: number;
  dataUsage: {
    total: number;
  };
}

interface AdminDashboardProps {
  globals: any;
  plans: any;
  users_data: any;
  users_all: any;
  histories: any;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02 }}
    className="w-full"
  >
    <Card className="border-1 border-default-200">
      <CardBody className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-100">
            <div className="text-2xl text-primary">{icon}</div>
          </div>
          <div>
            <p className="text-sm text-default-500 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-foreground">{value}</p>
              <span className={`text-xs ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                {trend.value}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  </motion.div>
);

const PlanCard: React.FC<{ plan: PlanData }> = ({ plan }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="w-full"
  >
    <Card className="border-1 border-default-200 w-full">
      <CardBody className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
            <p className="text-sm text-default-500">{formatNumberWithCommas(plan.count)} Sold</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">HTG {formatNumberWithCommas(plan.sold)}</p>
            <span className={`text-xs px-2 py-1 rounded-full ${plan.status === 'active'
                ? 'bg-success-100 text-success-600'
                : 'bg-danger-100 text-danger-600'
              }`}>
              {plan.status}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  </motion.div>
);

function formatNumberWithCommas(number: number) {
  if (number > 1000) {
    return number.toLocaleString();
  }
  return number.toString();
}


export const AdminDashboard: React.FC<AdminDashboardProps> = ({ globals, plans, users_data, users_all, histories }) => {
  const { isOpen: isPlansOpen, onOpen: onPlansOpen, onClose: onPlansClose } = useDisclosure();
  const { isOpen: isUsersOpen, onOpen: onUsersOpen, onClose: onUsersClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedUserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set<number>());

  const [stats, setStats] = useState<{
    title: string;
    value: string;
    icon: React.JSX.Element;
    trend: { value: string; isPositive: boolean };
    delay: number;
  }[]>([])

  useEffect(() => {
    if (globals) {
      setStats([
        {
          title: "Total Clients",
          value: globals.total_users,
          icon: <FaUsers size={24} />,
          trend: { value: "ACTIVE", isPositive: true },
          delay: 0.2
        },
        {
          title: "Revenue",
          value: `HTG ${globals.total_revenue && formatNumberWithCommas(globals.total_revenue)}`,
          icon: <MdAttachMoney size={24} />,
          trend: { value: "", isPositive: true },
          delay: 0.3
        },
        {
          title: "Total Cards Sold",
          value: globals.total_cards,
          icon: <FaTicket size={24} />,
          trend: { value: "", isPositive: false },
          delay: 0.4
        }
      ])
    }

    if (plans) {
      setSelledPlans(plans)
    }
    if (users_data) {
      //console.log("users_data")
      //console.log(users_data)
      setUsers(users_data)
    }
  }, [globals, plans, users_data])

  const itemsPerPage = 20;

  const [selledPlans, setSelledPlans] = useState<PlanData[]>([]);
  const [users, setUsers] = useState<EnhancedUserData[]>([]);

  /*  const [users] = useState<EnhancedUserData[]>([
     { 
       id: 1, 
       name: "John Smith", 
       registrationDate: "2024-01-15", 
       plansSold: [
         { name: "Plan 1", value: 100, date: "2024-01-15" },
         { name: "Plan 2", value: 200, date: "2024-01-16" },
       ],
       totalSold: 300,
       dataUsage: { total: 1000 },
     },
     { 
       id: 2, 
       name: "Maria Garcia", 
       registrationDate: "2024-01-16", 
       plansSold: [
         { name: "Plan 3", value: 300, date: "2024-01-17" },
         { name: "Plan 4", value: 400, date: "2024-01-18" },
       ],
       totalSold: 700,
       dataUsage: { total: 2000 },
     },
     { 
       id: 3, 
       name: "David Johnson", 
       registrationDate: "2024-01-17", 
       plansSold: [
         { name: "Plan 5", value: 500, date: "2024-01-19" },
         { name: "Plan 6", value: 600, date: "2024-01-20" },
       ],
       totalSold: 1100,
       dataUsage: { total: 3000 },
     },
     { 
       id: 4, 
       name: "Sarah Wilson", 
       registrationDate: "2024-01-18", 
       plansSold: [
         { name: "Plan 7", value: 700, date: "2024-01-21" },
         { name: "Plan 8", value: 800, date: "2024-01-22" },
       ],
       totalSold: 1500,
       dataUsage: { total: 4000 },
     },
     { 
       id: 5, 
       name: "Michael Brown", 
       registrationDate: "2024-01-19", 
       plansSold: [
         { name: "Plan 9", value: 900, date: "2024-01-23" },
         { name: "Plan 10", value: 1000, date: "2024-01-24" },
       ],
       totalSold: 1900,
       dataUsage: { total: 5000 },
     },
     { 
       id: 6, 
       name: "Emma Davis", 
       registrationDate: "2024-01-20", 
       plansSold: [
         { name: "Plan 11", value: 1100, date: "2024-01-25" },
         { name: "Plan 12", value: 1200, date: "2024-01-26" },
       ],
       totalSold: 2300,
       dataUsage: { total: 6000 },
     },
     { 
       id: 7, 
       name: "James Miller", 
       registrationDate: "2024-01-21", 
       plansSold: [
         { name: "Plan 13", value: 1300, date: "2024-01-27" },
         { name: "Plan 14", value: 1400, date: "2024-01-28" },
       ],
       totalSold: 2700,
       dataUsage: { total: 7000 },
     },
     { 
       id: 8, 
       name: "Lisa Anderson", 
       registrationDate: "2024-01-22", 
       plansSold: [
         { name: "Plan 15", value: 1500, date: "2024-01-29" },
         { name: "Plan 16", value: 1600, date: "2024-01-30" },
       ],
       totalSold: 3100,
       dataUsage: { total: 8000 },
     },
     { 
       id: 9, 
       name: "Robert Taylor", 
       registrationDate: "2024-01-23", 
       plansSold: [
         { name: "Plan 17", value: 1700, date: "2024-01-31" },
         { name: "Plan 18", value: 1800, date: "2024-02-01" },
       ],
       totalSold: 3500,
       dataUsage: { total: 9000 },
     },
     { 
       id: 10, 
       name: "Patricia Martinez", 
       registrationDate: "2024-01-24", 
       plansSold: [
         { name: "Plan 19", value: 1900, date: "2024-02-02" },
         { name: "Plan 20", value: 2000, date: "2024-02-03" },
       ],
       totalSold: 3900,
       dataUsage: { total: 10000 },
     },
   ]); */



  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter users when search query changes
  useEffect(() => {
    if (users.length > 0) {

      const filterUsers = () => {
        setIsLoading(true);
        try {
          const query = searchQuery.toLowerCase().trim();
          const filtered = users.filter(user => {
            const name = user.name?.toLowerCase();

            const id = user.id?user.id.toString():"";
            const date = new Date(user.registrationDate).toLocaleDateString();
            //console.log(user)
            /* if(!user.id){
              console.log(user)
            } */
            return name.includes(query) ||
              id.includes(query) //||
              //date.includes(query);
          });
          setFilteredUsers(filtered);
        } catch (error) {
          console.error('Error filtering users:', error);
          setFilteredUsers([]);
        } finally {
          setIsLoading(false);
        }
      };

      // Debounce the filter operation
      const timeoutId = setTimeout(filterUsers, 300);
      return () => clearTimeout(timeoutId);
    }

  }, [searchQuery, users]);

  // Memoize pagination calculations
  const { currentUsers, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredUsers.length / itemsPerPage);
    const current = filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { currentUsers: current, totalPages: total };
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold mb-6 text-foreground"
      >
        Dashboard Overview
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          onPress={onPlansOpen}
          color="primary"
          className="px-8"
          radius="sm"
        >
          View selled plans
        </Button>
        <Button
          onPress={onUsersOpen}
          color="primary"
          variant="bordered"
          className="px-8"
          radius="sm"
        >
          Load users
        </Button>
      </div>

      <div className="mt-8">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold mb-6 text-foreground mt-32"
        >
          Plan Sales Analytics
        </motion.h2>
        <PlanSalesAnalytics users={users_all} histories={histories} />
      </div>

      <Modal
        isOpen={isPlansOpen}
        onClose={onPlansClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-foreground">Plans Overview</h2>
                <p className="text-sm text-default-500">Total sold plans</p>
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-4">
                  {selledPlans.map((plan, index) => (
                    <PlanCard
                      key={index}
                      plan={plan}
                    />
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  variant="light"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isUsersOpen}
        onClose={onUsersClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Users Overview</h2>
                  <p className="text-sm text-default-500">Registered users in the system</p>
                </div>
                <Input
                  isClearable
                  className="w-full"
                  placeholder="Search by name, ID, or date..."
                  startContent={<FaSearch className="text-default-400" />}
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                  description="Search by name, ID, or registration date"
                />
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 rounded-lg border border-default-200 hover:bg-default-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-foreground">{user.name}</h3>
                            <p className="text-small text-default-500">
                              User #{user.id} • Joined {new Date(user.registrationDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            isIconOnly
                            variant="light"
                            onPress={() => {
                              const newExpandedUsers = new Set(expandedUsers);
                              if (newExpandedUsers.has(user.id)) {
                                newExpandedUsers.delete(user.id);
                              } else {
                                newExpandedUsers.add(user.id);
                              }
                              setExpandedUsers(newExpandedUsers);
                            }}
                          >
                            {expandedUsers.has(user.id) ? <FaChevronUp /> : <FaChevronDown />}
                          </Button>
                        </div>

                        {expandedUsers.has(user.id) && (
                          <div className="mt-4">
                            <div className="space-y-6">
                              <div className="bg-content1 dark:bg-content2 rounded-xl p-4">
                                <h4 className="font-semibold mb-3 text-warning-500 flex items-center gap-2">
                                  <FaTicket className="text-lg" />
                                  Plans Sold
                                </h4>
                                <div className="space-y-2">
                                  {user.plansSold.map((plan, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-background dark:bg-default-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                                        <span className="font-medium text-foreground">{plan.name} ({plan.count})</span>

                                      </div>
                                      <span className="font-semibold text-success-600">HTG {formatNumberWithCommas(plan.value ? plan.value : 0)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-content1 dark:bg-content2 rounded-xl p-4">
                                  <h4 className="font-semibold mb-3 text-warning-500 flex items-center gap-2">
                                    <MdAttachMoney className="text-lg" />
                                    Total Sales
                                  </h4>
                                  <p className="text-2xl font-bold text-success-600">
                                    HTG {formatNumberWithCommas(user.totalSold)}
                                  </p>
                                </div>

                                <div className="bg-content1 dark:bg-content2 rounded-xl p-4">
                                  <h4 className="font-semibold mb-3 text-warning-500 flex items-center gap-2">
                                    <IoTrendingUp className="text-lg" />
                                    Data Usage
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-default-500">Total</span>
                                      <span className="font-semibold text-foreground">{formatNumberWithCommas(user.dataUsage.total)} MB</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-default-500">
                      No users found matching your search criteria
                    </div>
                  )}
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

export default AdminDashboard;
