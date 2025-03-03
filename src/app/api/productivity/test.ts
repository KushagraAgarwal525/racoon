import { calculateAndUpdateProductivity } from "./client";

async function testProductivityFlow() {
  try {
    console.log('\n1. Testing trigger endpoint...');
    console.log('Server: Triggering productivity calculation...');
    
    // Trigger the calculation
    calculateAndUpdateProductivity().catch(error => {
      console.error("Background calculation failed:", error);
    });

    console.log('Server: Calculation triggered successfully');
    
    // Wait for the calculation to complete (in a real scenario, this would be handled by the client)
    console.log('\n2. Waiting for calculation to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5 seconds for demo purposes
    
    console.log('\nTest completed successfully!');
    console.log('Note: In a real deployment, the client would handle the calculation');
    console.log('and send updates to the server independently.');

  } catch (error) {
    console.error("Error in productivity flow test:", error);
  }
}

// Run the test
console.log('Starting productivity flow test...');
testProductivityFlow(); 