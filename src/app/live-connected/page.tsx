'use client';

import AppLayout from '../components/AppLayout';
import { Card, CardBody, CardHeader, Chip, Divider } from "@nextui-org/react";
import pubnub from '../../../lib/pubnub';
import { FaUser, FaClock, FaCalendarAlt, FaDatabase, FaNetworkWired } from 'react-icons/fa';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface Message {
  complete_name: string;
  connexion_number: string; 
  uptime: string;
  schedule_data: {
    activation_date: string;
    expiration_date: string;
    used_data: number;
  };
  ip: string;
  mac_address: string;
  bandwitch: {
    tx: number;
    rx: number;
    data: number;
  };
}

// Fonctions optimisées pour le format JJ-MM-AAAA
const toHaitiDate = (stringDate: string): string => {
  try {
    if (!stringDate || stringDate === 'undefined' || stringDate === 'null') {
      return 'N/A';
    }
    
    const date = new Date(stringDate);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "America/Port-au-Prince",
      day: "2-digit",
      month: "2-digit", 
      year: "numeric"
    }).format(date).replace(/\//g, '-');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const toHaitiTimeOnly = (stringDate: string): string => {
  try {
    if (!stringDate || stringDate === 'undefined' || stringDate === 'null') {
      return 'N/A';
    }
    
    const date = new Date(stringDate);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Port-au-Prince",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h12"
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
};

// Fonction utilitaire pour formater la bande passante
const formatBandwidth = (bytes: number): string => {
  if (bytes > 1000000) {
    return `${(bytes / 1000000).toFixed(2)} Mbps`;
  } else if (bytes > 1000) {
    return `${(bytes / 1000).toFixed(2)} Kbps`;
  } else {
    return `${bytes.toFixed(2)} bps`;
  }
};

const ConnectionCard = ({ userData }: { userData: any }) => {
  const dataUsagePercentage = userData.dataLimit !== "Unlimited" 
    ? (parseFloat(userData.dataUsed) / parseFloat(userData.dataLimit)) * 100 
    : 0;

  const download = formatBandwidth(userData.downloadSpeed);
  const upload = formatBandwidth(userData.uploadSpeed);

  return (
    <Card className="bg-content1">
      <CardHeader className="flex gap-3">
        <FaUser className="text-xl text-primary" />
        <div className="flex flex-col">
          <p className="text-md font-semibold text-foreground">{userData.name}</p>
          <p className="text-small text-foreground-500">Connection #{userData.connectionNumber}</p>
        </div>
        <Chip
          color={dataUsagePercentage > 80 ? "danger" : dataUsagePercentage > 50 ? "warning" : "success"}
          variant="flat"
          className="text-sm ml-auto"
        >
          {userData.dataLimit}
        </Chip>
      </CardHeader>
      <Divider />
      <CardBody className="gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Uptime */}
          <div className="flex items-center gap-3">
            <FaClock className="text-lg text-primary" />
            <div>
              <p className="text-small font-medium text-foreground-500">Uptime</p>
              <p className="text-medium font-semibold text-foreground">{userData.uptime}</p>
            </div>
          </div>

          {/* Connection Dates - Format JJ-MM-AAAA optimisé */}
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-lg text-primary" />
            <div>
              <p className="text-small font-medium text-foreground-500">Plan Period</p>
              <p className="text-medium font-semibold text-foreground">
                {toHaitiDate(userData.activationDate)} - {toHaitiDate(userData.expirationDate)}
              </p>
              <p className="text-small text-foreground-500">
                Desactivation: {toHaitiTimeOnly(userData.activationDate)}
              </p>
            </div>
          </div>

          {/* Data Usage */}
          <div className="flex items-center gap-3">
            <FaDatabase className="text-lg text-primary" />
            <div>
              <p className="text-small font-medium text-foreground-500">Data Usage</p>
              <p className="text-medium font-semibold text-foreground">
                {userData.dataUsed} MB / {userData.dataLimit}
              </p>
              {dataUsagePercentage > 0 && (
                <div className="w-full bg-default-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${
                      dataUsagePercentage > 80 ? 'bg-danger' : 
                      dataUsagePercentage > 50 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(dataUsagePercentage, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Network Info */}
          <div className="flex items-center gap-3">
            <FaNetworkWired className="text-lg text-primary" />
            <div>
              <p className="text-small font-medium text-foreground-500">Network Details</p>
              <p className="text-medium font-semibold text-foreground">
                IP: {userData.ipAddress}
              </p>
              <p className="text-small text-foreground-500">
                MAC: {userData.macAddress}
              </p>
            </div>
          </div>

          {/* Network Speeds - Optimisé */}
          <div className="flex items-center w-full md:col-span-2">
            <div className="grid grid-cols-[1fr,auto,1fr] w-full items-center">
              {/* Download Speed */}
              <div className="flex justify-center lg:justify-end">
                <div className="flex flex-col items-center">
                  <FiDownload className="text-2xl text-primary" />
                  <p className="text-small font-medium text-foreground-500">Download</p>
                  <p className="text-medium font-semibold text-foreground">
                    {download}
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="h-12 w-px bg-divider mx-6"></div>

              {/* Upload Speed */}
              <div className="flex justify-center lg:justify-start">
                <div className="flex flex-col items-center">
                  <FiUpload className="text-2xl text-primary" />
                  <p className="text-small font-medium text-foreground-500">Upload</p>
                  <p className="text-medium font-semibold text-foreground">
                    {upload}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default function LiveConnected() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Optimisation de la transformation des données
  useEffect(() => {
    if (messages.length === 0) {
      setUsersData([]);
      return;
    }

    const buildObject = messages.map(object => ({
      name: object.complete_name,
      connectionNumber: object.connexion_number,
      uptime: object.uptime,
      activationDate: object.schedule_data?.activation_date,
      expirationDate: object.schedule_data?.expiration_date,
      dataUsed: object.schedule_data?.used_data !== undefined 
        ? object.schedule_data.used_data.toFixed(2) 
        : '0.00',
      dataLimit: "Unlimited",
      ipAddress: object.ip,
      macAddress: object.mac_address,
      downloadSpeed: object.bandwitch?.rx || 0,
      uploadSpeed: object.bandwitch?.tx || 0
    }));

    setUsersData(buildObject);
    setIsLoading(false);
    setLastUpdate(new Date());
  }, [messages]);

  // Gestion PubNub optimisée
  useEffect(() => {
    const channel = pubnub.channel('NetlineMessageListenner');
    const subscription = channel.subscription();

    subscription.onMessage = async (messageEvent: any) => {
      try {
        const variablesResponse = await fetch('/api/items?table=variables');
        const variablesData = await variablesResponse.json();
        const connectedUsersVariable = variablesData.find(
          (variable: any) => variable.name === 'connected_users'
        );
        
        if (connectedUsersVariable?.array_data) {
          setMessages(connectedUsersVariable.array_data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
      pubnub.removeListener({ message: subscription.onMessage });
    };
  }, []);

  const publishMessage = async (message: string) => {
    try {
      const publishPayload = {
        channel: "NetlineMessageReceiver",
        message: {
          request: message,
          description: message
        }
      };
      await pubnub.publish(publishPayload);
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  };

  // Initialisation et polling optimisé
  useEffect(() => {
    publishMessage("get");
    
    const myInterval = setInterval(() => {
      publishMessage("get");
    }, 8000);

    return () => {
      setMessages([]);
      clearInterval(myInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-28 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground-500">Loading connections...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-28 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-foreground">Live Connected</h1>
            <div className="flex items-center gap-3">
              <Chip color="primary" variant="flat">
                {usersData.length} Active Connection{usersData.length !== 1 ? 's' : ''}
              </Chip>
              {lastUpdate && (
                <p className="text-small text-foreground-500">
                  Last update: {toHaitiTimeOnly(lastUpdate.toISOString())}
                </p>
              )}
            </div>
          </div>

          {usersData.length === 0 ? (
            <div className="text-center py-12">
              <FaNetworkWired className="text-6xl text-foreground-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Active Connections</h3>
              <p className="text-foreground-500">No users are currently connected to the network.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {usersData.map((userData) => (
                <ConnectionCard 
                  key={`${userData.connectionNumber}-${userData.macAddress}`} 
                  userData={userData} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
