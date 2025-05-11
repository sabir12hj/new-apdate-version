import { User, Search, Wallet, Trophy } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <User className="text-secondary text-2xl" />,
      title: "Sign Up",
      description: "Create an account or login with Google"
    },
    {
      icon: <Search className="text-secondary text-2xl" />,
      title: "Find Tournaments",
      description: "Browse upcoming and live tournaments"
    },
    {
      icon: <Wallet className="text-secondary text-2xl" />,
      title: "Pay Entry Fee",
      description: "Secure payment via Paytm Gateway"
    },
    {
      icon: <Trophy className="text-secondary text-2xl" />,
      title: "Win Prizes",
      description: "Score high and win exciting prizes"
    }
  ];

  return (
    <div id="how-it-works" className="bg-white rounded-lg shadow-md p-8 mb-12">
      <h2 className="text-2xl font-bold font-heading mb-6 text-center">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="text-center">
            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              {step.icon}
            </div>
            <h3 className="font-bold mb-2">{step.title}</h3>
            <p className="text-gray-600 text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
