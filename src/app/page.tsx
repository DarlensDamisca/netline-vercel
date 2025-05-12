'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import AdminDashboard from './components/AdminDashboard';
import { LoadingAnimation } from './components/LoadingAnimation';
import AppLayout from './components/AppLayout';

function sortByTotalDesc(arr: any[]) {
  return arr.sort((a, b) => b.sold - a.sold);
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globals, setGlobals]: any = useState({});

  const [users, setUsers]: any = useState([]);
  const [histories, setHistories]: any = useState([]);
  const [plans, setPlans]: any = useState([]);

  const [userFilter, setUserFilter] = useState<{
    id: any;
    name: any;
    registrationDate: any;
    plansSold: { name: string; count: number; value: number; }[];
    totalSold: any;
    dataUsage: { total: any; };
  }[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser && typeof window !== 'undefined') {
      window.location.href = '/login';
      return;
    }

    const fetchItems = async () => {
      try {
        const clients = await fetch('/api/items?table=users');
        const clientsJson = await clients.json();
        setUsers(clientsJson);

        const histories = await fetch('/api/items?table=histories');
        const historiesJson = await histories.json();
        setHistories(historiesJson);
      } catch (error) {
        setError('Failed to fetch items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    if (users.length > 0 && histories.length > 0) {
      const totalUsers = users.length;
      let totalRevenue = 0;
      histories.forEach((history: any) => {
        totalRevenue += history.price;
      });
      const totalCards = histories.length;
      setGlobals({
        total_users: totalUsers,
        total_revenue: totalRevenue,
        total_cards: totalCards
      });

      const totalSelledPlans: { [key: string]: { count: number, total_price: number, name: string } } = {};

      for (const plan of histories) {
        if (!totalSelledPlans[plan.plan]) {
          totalSelledPlans[plan.plan] = {
            count: 1,
            total_price: plan.price,
            name: plan.plan
          };
        }
        totalSelledPlans[plan.plan].count += 1;
        totalSelledPlans[plan.plan].total_price += plan.price;
      }

      const planData = Object.values(totalSelledPlans).map((plan) => ({
        name: plan.name,
        sold: plan.total_price,
        count: plan.count,
        status: 'active'
      }));
      setPlans(sortByTotalDesc(planData));

      const usersWithPlanAndDatas = []
      for (const user of users) {
        const userHistory = histories.filter((history: any) => history.user_id === user._id);
        const totalSold = userHistory.reduce((acc: any, history: any) => acc + history.price, 0);
        const totalData = userHistory.reduce((acc: any, history: any) => acc + history.scheduler_datas ? history.scheduler_datas.used_data : 0, 0);

        const others = {} as { [key: string]: { name: string, count: number, price: number } };
        for (const history of userHistory) {
          if (others[history.plan]) {
            others[history.plan].count += 1;
            others[history.plan].price += history.price;
          } else {
            others[history.plan] = {
              name: history.plan,
              count: 1,
              price: history.price
            };
          }
        }
        const plansSold = Object.values(others).map((plan) => ({
          name: plan.name,
          count : plan.count,
          value: plan.price
        }));
        if (user.complete_name) {
          usersWithPlanAndDatas.push({
            id: user.user_number,
            registrationDate: new Date(user.created_at).toLocaleDateString(),
            name: user.complete_name,
            plansSold: plansSold.map(plan => ({
              name: plan.name,
              count: plan.count,
              value: plan.value
            })),
            totalSold: totalSold,
            dataUsage: {
              total: totalData
            },
          });
        }
      }
      setUserFilter(usersWithPlanAndDatas);
    }
  }, [users, histories]);

  return (
    <AppLayout>
      <AnimatePresence>
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <AdminDashboard globals={globals} plans={plans} users_data={userFilter} users_all={users} histories={histories} />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
