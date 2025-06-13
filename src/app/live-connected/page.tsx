'use client';

import AppLayout from '../components/AppLayout';
import { Card, CardBody, CardHeader, Chip, Divider } from "@nextui-org/react";
import pubnub from '../../../lib/pubnub';
import { FaUser, FaClock, FaCalendarAlt, FaDatabase, FaNetworkWired } from 'react-icons/fa';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { useState, useEffect } from 'react';

// Mock data - replace with real data later
/* const usersData = [
  {
    name: "John Doe",
    connectionNumber: "CN123456",
    uptime: "2 hours 15 minutes",
    activationDate: "2024-01-25",
    expirationDate: "2024-02-25",
    dataUsed: 256, // MB
    dataLimit: 1000, // MB
    ipAddress: "192.168.1.100",
    macAddress: "00:1B:44:11:3A:B7",
    downloadSpeed: 15.5, // Mbps
    uploadSpeed: 5.2 // Mbps
  },
  {
    name: "Jane Smith",
    connectionNumber: "CN789012",
    uptime: "45 minutes",
    activationDate: "2024-01-20",
    expirationDate: "2024-02-20",
    dataUsed: 850, // MB
    dataLimit: 1000, // MB
    ipAddress: "192.168.1.101",
    macAddress: "00:1B:44:11:3A:C8",
    downloadSpeed: 22.8,
    uploadSpeed: 8.4
  },
  {
    name: "Mike Johnson",
    connectionNumber: "CN345678",
    uptime: "5 hours 30 minutes",
    activationDate: "2024-01-15",
    expirationDate: "2024-02-15",
    dataUsed: 500, // MB
    dataLimit: 1000, // MB
    ipAddress: "192.168.1.102",
    macAddress: "00:1B:44:11:3A:D9",
    downloadSpeed: 18.2,
    uploadSpeed: 6.7
  }
]; */

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

const toHaitiTime = (stringDate: string): string => {
  try {
    // Check if stringDate is valid
    if (!stringDate || stringDate === 'undefined' || stringDate === 'null') {
      return 'N/A'; // Return a placeholder for invalid dates
    }
    // Convert to Haiti timezone
    const haitiTimeZone = "America/Port-au-Prince";
    const date = new Date(stringDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A'; // Return a placeholder for invalid dates
    }
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
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A'; // Return a placeholder for any errors
  }
};

const ConnectionCard = ({ userData }: { userData: any }) => {
  const dataUsagePercentage = (userData.dataUsed / userData.dataLimit) * 100;

  let upload : string = "0", download : string = "0"

  if (userData.downloadSpeed > 1000000) {
    download = `${(userData.downloadSpeed / 1000000).toFixed(2)} Mbps`
  } else if (userData.downloadSpeed> 1000) {
    download = `${(userData.downloadSpeed / 1000).toFixed(2)} Kbps`
  } else {
    download = `${(userData.downloadSpeed).toFixed(2)} bps`
  }

  if (userData.uploadSpeed > 1000000) {
    upload = `${(userData.uploadSpeed / 1000000).toFixed(2)} Mbps`
  } else if (userData.uploadSpeed > 1000) {
    upload = `${(userData.uploadSpeed / 1000).toFixed(2)} Kbps`
  } else {
    upload = `${(userData.uploadSpeed).toFixed(2)} bps`
  }

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
          Unlimited
          {/* {dataUsagePercentage.toFixed(1)}% Used */}
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

          {/* Connection Dates */}
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-lg text-primary" />
            <div>
              <p className="text-small font-medium text-foreground-500">Plan Period</p>
              <p className="text-medium font-semibold text-foreground">
                {new Date(userData.activationDate).toLocaleDateString()} - {new Date(userData.expirationDate)}  ({userData.activationDate.split('T')[1]})
              </p>
            </div>
          </div>

          {/* Data Usage */}
          <div className="flex items-center gap-3">
            <FaDatabase className="text-lg text-primary" />
            <div>
              <p className="text-small font-medium text-foreground-500">Data Usage</p>
              <p className="text-medium font-semibold text-foreground">
                {userData.dataUsed} MB / {userData.dataLimit} MB
              </p>
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

          {/* Network Speeds */}
          <div className="flex  items-center w-full">
            <div className="grid grid-cols-[1fr,auto,1fr] w-full items-center">
              {/* Download Speed */}
              <div className="flex justify-center lg:justify-end">
                <div className="flex flex-col items-center">
                  <FiDownload className="text-2xl text-primary" />
                  <p className="text-small font-medium text-foreground-500">Download</p>
                  <p className="text-medium font-semibold text-foreground">
                    {upload} 
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="h-12 w-px bg-divider mx-6"></div>

              {/* Upload Speed */}
              <div className="flex justify-center lg:justify-start ">
                <div className="flex flex-col items-center">
                  <FiUpload className="text-2xl text-primary" />
                  <p className="text-small font-medium text-foreground-500">Upload</p>
                  <p className="text-medium font-semibold text-foreground">
                    {download}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Usage Progress */}
        {/* <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${dataUsagePercentage > 80 ? 'bg-danger' :
                dataUsagePercentage > 50 ? 'bg-warning' :
                  'bg-success'
              }`}
            style={{ width: `${dataUsagePercentage}%` }}
          />
        </div> */}
      </CardBody>
    </Card>
  );
};

export default function LiveConnected() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);

  useEffect(() => {
    const buldObject: any[] = []
    if(messages.length === 0){
      return
    }
    for (const object of messages) {
      buldObject.push({
        name: object.complete_name,
        connectionNumber: object.connexion_number,
        uptime: object.uptime,
        activationDate: toHaitiTime(object.schedule_data?.activation_date),
        expirationDate: toHaitiTime(object.schedule_data?.expiration_date),
        dataUsed: object.schedule_data?.used_data !== undefined ? object.schedule_data.used_data.toFixed(2) : '0.00',
        dataLimit: "Unlimited", // MB
        ipAddress: object.ip,
        macAddress: object.mac_address,
        downloadSpeed: object.bandwitch?.rx || 0,
        uploadSpeed: object.bandwitch?.tx || 0
      })
    }

    setUsersData(buldObject)


  }, [messages])

  useEffect(() => {
    // Create a local channel entity
    const channel = pubnub.channel('NetlineMessageListenner');
    // Create a subscription on the channel
    const subscription = channel.subscription();

    // add an onMessage listener to the channel subscription
    subscription.onMessage = async (messageEvent: any) => {
      //const message = messageEvent.message
      //console.log(message.description)
      //setMessages(messageEvent.message.description);
      const variablesResponse = await fetch('/api/items?table=variables');
      const variablesData = await variablesResponse.json();
      const connectedUsersVariable = variablesData.find((variable: any) => variable.name === 'connected_users');
      if (connectedUsersVariable) {
        setMessages(connectedUsersVariable.array_data);
      }
    };

    // subscribe to the channel
    subscription.subscribe();

    // Cleanup function to remove subscription and listener
    return () => {
      subscription.unsubscribe();
      pubnub.removeListener({ message: subscription.onMessage });
    }
  }, []);

  const publishMessage = async (message: string) => {
    const publishPayload = {
      channel: "NetlineMessageReceiver",
      message: {
        //title: "greeting",
        request: message,
        description: message
      }
    };
    await pubnub.publish(publishPayload);

  };

  useEffect(() => {
    publishMessage("get")
    const myInterval = setInterval(() => {
      try {
        publishMessage("get")
      } catch (error) {
        setMessages([])
      }
    }, 8000)

    return () => {
      setMessages([])
      console.log("Close Interval")
      clearInterval(myInterval)
    }
  }, [])



  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-28 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Live Connected</h1>
            <Chip color="primary" variant="flat">
              {usersData.length} Active Connections
            </Chip>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {usersData.map((userData) => (
              <ConnectionCard key={userData?.connectionNumber} userData={userData} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
