import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
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
  Chip,
  Input,
  Spinner
} from "@nextui-org/react";
import { FaCalendarAlt, FaDownload, FaPrint, FaFileExport, FaCalculator, FaShare } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ReportData {
  vendorId: string;
  vendorName: string;
  commission70: number;
  totalVente: number;
  montantSysteme: number;
  salesCount: number;
}

export default function ReportsSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [solds, setSolds] = useState<Sold[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showShareModal, setShowShareModal] = useState(false);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Simulation des données - remplacez par vos vrais appels API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulation des données utilisateurs
        const mockUsers = [
          { _id: '1', complete_name: 'Admini', name: 'Admin', user_number: 'U001', type: 'SYSTEM_ADMINISTRATOR', created_at: '2024-01-01' },
          { _id: '2', complete_name: 'Bella', name: 'Bella', user_number: 'V001', type: 'VENDOR', created_at: '2024-01-01' },
          { _id: '3', complete_name: 'Cherubin', name: 'Cherubin', user_number: 'V002', type: 'VENDOR', created_at: '2024-01-01' },
          { _id: '4', complete_name: 'Joanis', name: 'Joanis', user_number: 'V003', type: 'VENDOR', created_at: '2024-01-01' }
        ];

        // Simulation des ventes
        const mockSolds = [
          { _id: { $oid: '1' }, status: 'COMPLETED', profile: 'Profile A', name: 'Client 1', number: 'C001', duration_hour: '2', price: 50000, by: '2', comment: '', date: { $date: '2024-08-15T10:00:00Z' }, __v: 0 },
          { _id: { $oid: '2' }, status: 'COMPLETED', profile: 'Profile B', name: 'Client 2', number: 'C002', duration_hour: '3', price: 75000, by: '2', comment: '', date: { $date: '2024-08-16T14:00:00Z' }, __v: 0 },
          { _id: { $oid: '3' }, status: 'COMPLETED', profile: 'Profile C', name: 'Client 3', number: 'C003', duration_hour: '1', price: 30000, by: '3', comment: '', date: { $date: '2024-08-17T09:00:00Z' }, __v: 0 },
          { _id: { $oid: '4' }, status: 'COMPLETED', profile: 'Profile D', name: 'Client 4', number: 'C004', duration_hour: '4', price: 100000, by: '3', comment: '', date: { $date: '2024-08-18T16:00:00Z' }, __v: 0 },
          { _id: { $oid: '5' }, status: 'COMPLETED', profile: 'Profile E', name: 'Client 5', number: 'C005', duration_hour: '2', price: 60000, by: '4', comment: '', date: { $date: '2024-08-19T11:00:00Z' }, __v: 0 },
        ];

        setUsers(mockUsers);
        setSolds(mockSolds);
        
        // Générer les données du rapport
        generateReportData(mockUsers, mockSolds);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const generateReportData = (users: User[], solds: Sold[]) => {
    const vendors = users.filter(user => user.type === 'VENDOR');
    const reports: ReportData[] = [];

    vendors.forEach(vendor => {
      // Filtrer les ventes par vendeur et période
      const vendorSales = solds.filter(sold => {
        if (sold.by !== vendor._id) return false;
        
        const saleDate = new Date(sold.date.$date);
        return saleDate.getMonth() === selectedMonth && 
               saleDate.getFullYear() === selectedYear &&
               sold.status === 'COMPLETED';
      });

      const totalVente = vendorSales.reduce((sum, sale) => sum + sale.price, 0);
      const commission70 = Math.round(totalVente * 0.10); // 10% pour le vendeur
      const montantSysteme = Math.round(totalVente * 0.90); // 90% pour le système

      if (totalVente > 0) {
        reports.push({
          vendorId: vendor._id,
          vendorName: vendor.complete_name,
          commission70: commission70,
          totalVente: totalVente,
          montantSysteme: montantSysteme,
          salesCount: vendorSales.length
        });
      }
    });

    setReportData(reports);
  };

  const calculateTotals = () => {
    return reportData.reduce((totals, report) => ({
      totalCommission: totals.totalCommission + report.commission70,
      totalVentes: totals.totalVentes + report.totalVente,
      totalSysteme: totals.totalSysteme + report.montantSysteme
    }), { totalCommission: 0, totalVentes: 0, totalSysteme: 0 });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Nom', '10% Commission', 'Total Vente', 'Montant Système'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.vendorName,
        row.commission70,
        row.totalVente,
        row.montantSysteme
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-${months[selectedMonth]}-${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const totals = calculateTotals();
      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport ${months[selectedMonth]} ${selectedYear}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .total-row { background-color: #e3f2fd; font-weight: bold; }
              .header { text-align: center; margin-bottom: 30px; }
              .date { color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>RAPPORTS</h1>
              <p class="date">${months[selectedMonth]} ${selectedYear}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>10% Commission</th>
                  <th>Total Vente</th>
                  <th>Montant Système</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map(report => `
                  <tr>
                    <td>${report.vendorName}</td>
                    <td>${formatCurrency(report.commission70)}</td>
                    <td>${formatCurrency(report.totalVente)}</td>
                    <td>${formatCurrency(report.montantSysteme)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>${formatCurrency(totals.totalCommission)}</strong></td>
                  <td><strong>${formatCurrency(totals.totalVentes)}</strong></td>
                  <td><strong>${formatCurrency(totals.totalSysteme)}</strong></td>
                </tr>
              </tbody>
            </table>
            <script>window.print(); window.onafterprint = function() { window.close(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const shareReport = async () => {
    const totals = calculateTotals();
    const reportText = `
📊 RAPPORT ${months[selectedMonth].toUpperCase()} ${selectedYear}

${reportData.map(report => 
  `👤 ${report.vendorName}
💰 Commission: ${formatCurrency(report.commission70)}
💵 Ventes: ${formatCurrency(report.totalVente)}
🏢 Système: ${formatCurrency(report.montantSysteme)}`
).join('\n\n')}

📋 TOTAUX:
💰 Total Commissions: ${formatCurrency(totals.totalCommission)}
💵 Total Ventes: ${formatCurrency(totals.totalVentes)}
🏢 Total Système: ${formatCurrency(totals.totalSysteme)}

📅 Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rapport ${months[selectedMonth]} ${selectedYear}`,
          text: reportText,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier dans le presse-papiers
      navigator.clipboard.writeText(reportText).then(() => {
        alert('Rapport copié dans le presse-papiers!');
      });
    }
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* En-tête */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">RAPPORTS</h1>
                <p className="text-gray-600">Rapport des commissions et ventes par vendeur</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      variant="bordered" 
                      startContent={<FaCalendarAlt />}
                      className="min-w-32"
                    >
                      {months[selectedMonth]}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Sélection du mois"
                    onAction={(key) => setSelectedMonth(Number(key))}
                  >
                    {months.map((month, index) => (
                      <DropdownItem key={index}>{month}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      variant="bordered" 
                      startContent={<FaCalendarAlt />}
                      className="min-w-24"
                    >
                      {selectedYear}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="Sélection de l'année"
                    onAction={(key) => setSelectedYear(Number(key))}
                  >
                    {years.map((year) => (
                      <DropdownItem key={year}>{year}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Actions */}
        <Card>
          <CardBody className="py-4">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Button
                color="primary"
                variant="solid"
                startContent={<FaPrint />}
                onClick={printReport}
                size="sm"
              >
                Imprimer
              </Button>
              <Button
                color="success"
                variant="solid"
                startContent={<FaDownload />}
                onClick={exportToCSV}
                size="sm"
              >
                Exporter CSV
              </Button>
              <Button
                color="secondary"
                variant="solid"
                startContent={<FaShare />}
                onClick={shareReport}
                size="sm"
              >
                Partager
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tableau principal */}
        <Card className="shadow-lg">
          <CardHeader className="bg-default-100">
            <h2 className="text-xl font-semibold">
              Détails par Vendeur - {months[selectedMonth]} {selectedYear}
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="p-0">
            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table removeWrapper aria-label="Tableau des rapports">
                  <TableHeader>
                    <TableColumn className="bg-gray-50 text-center font-bold">NOM</TableColumn>
                    <TableColumn className="bg-gray-50 text-center font-bold">10% COMMISSION</TableColumn>
                    <TableColumn className="bg-gray-50 text-center font-bold">TOTAL VENTE</TableColumn>
                    <TableColumn className="bg-gray-50 text-center font-bold">MONTANT SYSTÈME</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((report) => (
                      <TableRow key={report.vendorId} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                              <span className="text-primary font-bold text-sm">
                                {report.vendorName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{report.vendorName}</p>
                              <p className="text-sm text-gray-500">{report.salesCount} vente(s)</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip color="success" variant="flat" className="font-semibold">
                            {formatCurrency(report.commission70)}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-primary">
                            {formatCurrency(report.totalVente)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip color="primary" variant="flat" className="font-semibold">
                            {formatCurrency(report.montantSysteme)}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Ligne des totaux */}
                    <TableRow className="bg-blue-50 font-bold border-t-2">
                      <TableCell>
                        <span className="text-lg font-bold text-gray-800">TOTAL</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Chip color="success" variant="solid" className="font-bold">
                          {formatCurrency(totals.totalCommission)}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(totals.totalVentes)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Chip color="primary" variant="solid" className="font-bold">
                          {formatCurrency(totals.totalSysteme)}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  <FaCalculator className="text-4xl text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">Aucune vente trouvée</p>
                <p className="text-gray-400 text-sm mt-2">
                  pour {months[selectedMonth]} {selectedYear}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Statistiques résumées */}
        {reportData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-success/10 to-success/20">
              <CardBody className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Commissions</h3>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totals.totalCommission)}
                </p>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/10 to-primary/20">
              <CardBody className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Ventes</h3>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totals.totalVentes)}
                </p>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/20">
              <CardBody className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Montant Système</h3>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(totals.totalSysteme)}
                </p>
              </CardBody>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
