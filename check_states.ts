
import { getAllStates } from './src/features/ecommerce/orders/services/OrderServices';

async function checkStates() {
  const states = await getAllStates();
  console.log('ESTADOS ENCONTRADOS:', JSON.stringify(states, null, 2));
}

checkStates();
