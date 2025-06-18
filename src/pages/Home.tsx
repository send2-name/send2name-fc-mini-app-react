import { SendTokens } from '../components/SendTokens';
import Balance from '../components/balance';

function Home() {
  return (
    <div>
      <h3 className="text-center">Send Tokens To Any Domain Name</h3>
      <SendTokens />
      <Balance />
    </div>
  );
}

export default Home; 