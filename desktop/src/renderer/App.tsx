import { useEffect, useState } from 'react';
import DashboardV2 from './components/DashboardV2';
import type { SecurityScanResult, TokenReport } from '../../../src/types';

interface ScanData {
  results: SecurityScanResult[];
  tokenReport: TokenReport;
}

function App() {
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for scan results
    window.electronAPI.onScanResults((data: ScanData) => {
      setScanData(data);
      setLoading(false);
    });

    // Trigger initial scan
    window.electronAPI.scanAgents();

    return () => {
      window.electronAPI.removeAllListeners('scan-results');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Scanning AI Agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardV2 scanData={scanData} />
    </div>
  );
}

export default App;
