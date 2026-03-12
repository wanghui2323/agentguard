const { dataService } = require('./dist/desktop/desktop/services/DataService');

(async () => {
  try {
    console.log('Testing DataService.getStatus()...\n');
    const status = await dataService.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
    console.log('\nLevel:', status.level);
    console.log('Cost:', status.cost);
    console.log('Alerts:', status.alerts.length);
    if (status.alerts.length > 0) {
      console.log('\nAlert details:');
      status.alerts.forEach((alert, i) => {
        console.log(`  ${i + 1}. [${alert.level}] ${alert.message}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
