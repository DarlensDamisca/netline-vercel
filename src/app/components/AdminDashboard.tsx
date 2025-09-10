'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Pagination } from "@nextui-org/react";
import { FaUsers, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { IoTrendingUp } from "react-icons/io5";
import { motion } from "framer-motion";
import { PlanSalesAnalytics } from './PlanSalesAnalytics';
import { FaTicket } from 'react-icons/fa6';

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
    whileHover={{ scale: 1.03 }}
    className="w-full"
  >
    <Card className="border border-default-200 shadow-sm hover:shadow-md transition-shadow">
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
    <Card className="border border-default-200 shadow-sm hover:shadow-md transition-shadow w-full">
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
  }[]>([]);

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
        },
        {
    title: "Active Plans",
    value: globals.active_plans,
    icon: <IoTrendingUp size={24} />,
    trend: { value: "Live", isPositive: true },
    delay: 0.5
  }
      ]);
    }
    if (plans) setSelledPlans(plans);
    if (users_data) setUsers(users_data);
  }, [globals, plans, users_data]);

  const itemsPerPage = 20;
  const [selledPlans, setSelledPlans] = useState<PlanData[]>([]);
  const [users, setUsers] = useState<EnhancedUserData[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (users.length > 0) {
      const filterUsers = () => {
        setIsLoading(true);
        try {
          const query = searchQuery.toLowerCase().trim();
          const filtered = users.filter(user => {
            const name = user.name?.toLowerCase();
            const id = user.id ? user.id.toString() : "";
            return name.includes(query) || id.includes(query);
          });
          setFilteredUsers(filtered);
        } catch (error) {
          console.error('Error filtering users:', error);
          setFilteredUsers([]);
        } finally {
          setIsLoading(false);
        }
      };
      const timeoutId = setTimeout(filterUsers, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, users]);

  const { currentUsers, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredUsers.length / itemsPerPage);
    const current = filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { currentUsers: current, totalPages: total };
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleSearchChange = (value: string) => setSearchQuery(value);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold mb-6 text-foreground"
      >
        Dashboard Overview
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="flex justify-end gap-3 mb-12">
        <Button onPress={onPlansOpen} color="primary" className="px-6" radius="md">
          View Plans
        </Button>
        <Button onPress={onUsersOpen} color="secondary" variant="flat" className="px-6" radius="md">
          Load Users
        </Button>
      </div>

      <div className="mt-12">
        <Card className="p-6 shadow-md">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold mb-6 text-foreground"
          >
            Plan Sales Analytics
          </motion.h2>
          <PlanSalesAnalytics users={users_all} histories={histories} />
        </Card>
      </div>

      {/* Plans Modal */}
      <Modal isOpen={isPlansOpen} onClose={onPlansClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-2 border-b border-default-200 pb-4">
                <h2 className="text-xl font-bold text-foreground">Plans Overview</h2>
                <p className="text-sm text-default-500">Total sold plans</p>
              </ModalHeader>
              <ModalBody>
                <div className="grid gap-4">
                  {selledPlans.map((plan, index) => (
                    <PlanCard key={index} plan={plan} />
                  ))}
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-center">
                <Button color="primary" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Users Modal */}
      <Modal isOpen={isUsersOpen} onClose={onUsersClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-2 border-b border-default-200 pb-4">
                <h2 className="text-xl font-bold text-foreground">Users Overview</h2>
                <p className="text-sm text-default-500">Registered users in the system</p>
                <Input
                  isClearable
                  className="w-full mt-2"
                  placeholder="Search by name, ID, or date..."
                  startContent={<FaSearch className="text-default-400" />}
                  value={searchQuery}
                  onValueChange={handleSearchChange}
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
                      <Card key={user.id} className="p-4 shadow-sm border border-default-200 hover:shadow-md transition-shadow">
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
                              if (newExpandedUsers.has(user.id)) newExpandedUsers.delete(user.id);
                              else newExpandedUsers.add(user.id);
                              setExpandedUsers(newExpandedUsers);
                            }}
                          >
                            {expandedUsers.has(user.id) ? <FaChevronUp /> : <FaChevronDown />}
                          </Button>
                        </div>

                        {expandedUsers.has(user.id) && (
                          <div className="mt-4 space-y-6">
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
                                <div className="flex justify-between items-center">
                                  <span className="text-default-500">Total</span>
                                  <span className="font-semibold text-foreground">{formatNumberWithCommas(user.dataUsage.total)} MB</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
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
                <div className="flex justify-center w-full">
                  <Button color="primary" variant="light" onPress={onClose}>
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
