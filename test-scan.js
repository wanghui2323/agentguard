const { scanner } = require('./dist/core/agent-scanner');

(async () => {
  try {
    console.log('Scanning agents...\n');
    const results = await scanner.scanAll();
    
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.agent.name}`);
      console.log(`   Status: ${result.agent.status}`);
      console.log(`   Score: ${result.score}/100`);
      console.log(`   Issues: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`     - [${issue.severity}] ${issue.type}: ${issue.message}`);
        });
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
